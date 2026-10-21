import maxmind, { Reader } from "maxmind";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { LRUCache } from "lru-cache";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database paths for MaxMind GeoLite2-City and GeoLite2-ASN
const DEFAULT_CITY_DB_PATH = path.resolve(__dirname, "../data/GeoLite2-City.mmdb");
const DEFAULT_ASN_DB_PATH = path.resolve(__dirname, "../data/GeoLite2-ASN.mmdb");

const cityDbPath = process.env.GEOLITE2_DB_PATH || process.env.MAXMIND_DB_PATH || DEFAULT_CITY_DB_PATH;
const asnDbPath = process.env.GEOLITE2_ASN_DB_PATH || process.env.MAXMIND_ASN_DB_PATH || DEFAULT_ASN_DB_PATH;

// In-process Reader instances, LRU Cache, and Single-Flight Inflight Map
let lookupReader = null;
let asnReader = null;
const geoCache = new LRUCache({ max: 5000, ttl: 1000 * 60 * 60 * 24 });
const inflight = new Map();

export function clearGeoCache() {
  geoCache.clear();
  inflight.clear();
}

/**
 * Synchronously retrieves or instantiates the MaxMind City reader into memory.
 */
function getLookupReaderSync() {
  if (lookupReader) return lookupReader;
  try {
    if (fs.existsSync(cityDbPath)) {
      const buffer = fs.readFileSync(cityDbPath);
      lookupReader = new Reader(buffer);
      return lookupReader;
    }
  } catch (err) {
    console.error("[Geolocation] Failed to load GeoLite2-City.mmdb synchronously:", err.message);
  }
  return null;
}

/**
 * Synchronously retrieves or instantiates the MaxMind ASN reader into memory.
 */
function getAsnReaderSync() {
  if (asnReader) return asnReader;
  try {
    if (fs.existsSync(asnDbPath)) {
      const buffer = fs.readFileSync(asnDbPath);
      asnReader = new Reader(buffer);
      return asnReader;
    }
  } catch (err) {
    console.warn("[Geolocation] GeoLite2-ASN.mmdb not found or failed to load synchronously:", err.message);
  }
  return null;
}

/**
 * Asynchronously initializes the readers if preferred at boot.
 */
export async function initGeoLiteReader() {
  try {
    if (!lookupReader && fs.existsSync(cityDbPath)) {
      lookupReader = await maxmind.open(cityDbPath);
    }
  } catch (err) {
    console.error("[Geolocation] Failed to open GeoLite2 City database asynchronously:", err.message);
  }

  try {
    if (!asnReader && fs.existsSync(asnDbPath)) {
      asnReader = await maxmind.open(asnDbPath);
    }
  } catch (err) {
    console.warn("[Geolocation] Failed to open GeoLite2 ASN database asynchronously:", err.message);
  }

  return { lookupReader, asnReader };
}

// Pre-load databases in-process immediately on module import
try {
  getLookupReaderSync();
  getAsnReaderSync();
} catch (_) {}

// 1. IP Normalization & Validation (IPv4 & IPv6 safe)
export function normalizeIp(ip) {
  if (!ip || typeof ip !== "string") return null;
  ip = ip.trim();

  if (!ip) return null;

  // Headers sometimes include quoted/bracketed values or ports.
  ip = ip.replace(/^"|"$/g, "");
  if (ip.startsWith("[") && ip.includes("]")) {
    ip = ip.slice(1, ip.indexOf("]"));
  }

  // Convert IPv4-mapped IPv6 (::ffff:127.0.0.1 -> 127.0.0.1)
  if (ip.toLowerCase().startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  // Strip IPv4 ports such as 203.0.113.10:443 (leave pure IPv6 intact)
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.slice(0, ip.lastIndexOf(":"));
  }

  return ip || null;
}

export function isPrivateIp(ip) {
  if (!ip) return true;
  const lower = ip.toLowerCase();
  if (lower === "127.0.0.1" || lower === "::1" || lower === "localhost") return true;
  if (lower === "0.0.0.0" || lower === "::") return true;
  if (lower.startsWith("10.") || lower.startsWith("192.168.")) return true;
  if (lower.startsWith("169.254.")) return true; // link-local
  if (lower.startsWith("100.")) {
    const octet = parseInt(lower.split(".")[1], 10);
    if (octet >= 64 && octet <= 127) return true; // carrier-grade NAT internal RFC6598
  }
  if (lower.startsWith("172.")) {
    const octet = parseInt(lower.split(".")[1], 10);
    if (octet >= 16 && octet <= 31) return true;
  }
  // IPv6 Unique Local (fc00::/7) and Link-Local (fe80::/10)
  if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:")) return true;
  return false;
}

function headerValue(reqOrHeaders, name) {
  if (!reqOrHeaders) return null;
  const headers = reqOrHeaders.headers || reqOrHeaders;
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

// 2. Client IP Extraction
// Security: Never accept x-test-ip header. Only allow ?test_ip query param when NODE_ENV !== 'production'.
export function getClientIp(req) {
  if (!req) return null;

  if (process.env.NODE_ENV !== "production") {
    const testIp = req.query?.test_ip || req.query?.ip;
    const normTest = normalizeIp(testIp);
    if (normTest) return normTest;
  }

  // 1. Direct Edge Headers from Render / Cloudflare
  const edgeTrueClient = normalizeIp(headerValue(req, "true-client-ip"));
  if (edgeTrueClient && !isPrivateIp(edgeTrueClient)) {
    return edgeTrueClient;
  }

  const edgeCf = normalizeIp(headerValue(req, "cf-connecting-ip"));
  if (edgeCf && !isPrivateIp(edgeCf)) {
    return edgeCf;
  }

  const edgeReal = normalizeIp(headerValue(req, "x-real-ip"));
  if (edgeReal && !isPrivateIp(edgeReal)) {
    return edgeReal;
  }

  // 2. X-Forwarded-For chain (leftmost public IP is the originating client)
  const forwardedFor = headerValue(req, "x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map(normalizeIp).filter(Boolean);
    const clientHop = parts.find((ip) => !isPrivateIp(ip));
    if (clientHop) return clientHop;
  }

  // 3. Express req.ips / req.ip (when behind trusted proxies configured via app.set('trust proxy', 1))
  for (const ip of req.ips || []) {
    const norm = normalizeIp(ip);
    if (norm && !isPrivateIp(norm)) return norm;
  }

  const reqIp = normalizeIp(req.ip);
  if (reqIp && !isPrivateIp(reqIp)) {
    return reqIp;
  }

  const socketIp = normalizeIp(req.socket?.remoteAddress);
  if (socketIp && !isPrivateIp(socketIp)) {
    return socketIp;
  }

  // 4. Localhost / Private IP default (no spoofing to fake hardcoded cities)
  const fallbackIp = edgeTrueClient || edgeCf || edgeReal || reqIp || socketIp || "127.0.0.1";
  if (fallbackIp === "::1") return "127.0.0.1";
  return fallbackIp;
}

// 3. Regex matchers for Carrier & Datacenter / VPN classification
const MOBILE_CARRIER_REGEX = /jio|airtel|bharti|vodafone|idea|bsnl|rjil/i;
const VPN_DATACENTER_REGEX = /icloud|private relay|cloudflare|amazon|aws|digitalocean|linode|google cloud|microsoft|ovh|hetzner|m247|datacamp/i;

/**
 * Architecture D: Confidence-Tiered IP Geolocation Service.
 * Combines GeoLite2-City with GeoLite2-ASN and URL-decoded Edge Headers.
 * Returns confidence: 'HIGH' | 'MEDIUM' | 'LOW'
 */
export function resolveIpGeo(ip, reqHeaders = {}) {
  const normIp = normalizeIp(ip);

  // Fallback for private / localhost during development & tests
  if (!normIp || isPrivateIp(normIp)) {
    return {
      country: "India",
      country_code: "IN",
      region: "Local",
      city: "Local Dev",
      accuracyRadius: 0,
      asnOrg: "Local Network",
      isMobileCarrier: false,
      isVpnOrDatacenter: false,
      confidence: "HIGH"
    };
  }

  const cityReader = lookupReader || getLookupReaderSync();
  const asn = asnReader || getAsnReaderSync();

  const cityData = cityReader ? cityReader.get(normIp) : null;
  const asnData = asn ? asn.get(normIp) : null;

  const asnOrg = asnData?.autonomous_system_organization || "";
  const isVpnOrDatacenter = VPN_DATACENTER_REGEX.test(asnOrg);
  const isMobileCarrier = MOBILE_CARRIER_REGEX.test(asnOrg);

  const accuracyRadius = typeof cityData?.location?.accuracy_radius === "number"
    ? cityData.location.accuracy_radius
    : 999;

  // Fix 2: URL-decode x-vercel-ip-city before using in map keys or city resolution
  let vercelCity = headerValue(reqHeaders, "x-vercel-ip-city");
  if (vercelCity && typeof vercelCity === "string") {
    try {
      vercelCity = decodeURIComponent(vercelCity);
    } catch (_) {}
  }

  const edgeCity = headerValue(reqHeaders, "cf-ipcity") || vercelCity;
  const rawCity =
    (edgeCity && edgeCity !== "Unknown")
      ? edgeCity
      : (cityData?.city?.names?.en || "Unknown");

  const edgeRegion = headerValue(reqHeaders, "cf-region") || headerValue(reqHeaders, "x-vercel-ip-country-region");
  const region =
    (edgeRegion && edgeRegion !== "Unknown")
      ? edgeRegion
      : (cityData?.subdivisions?.[0]?.names?.en || "Unknown");

  const edgeCountry = headerValue(reqHeaders, "cf-ipcountry") || headerValue(reqHeaders, "x-vercel-ip-country");
  const country =
    (edgeCountry && edgeCountry !== "Unknown")
      ? edgeCountry
      : (cityData?.country?.names?.en || "Unknown");

  const countryCode =
    (edgeCountry && edgeCountry !== "Unknown")
      ? edgeCountry
      : (cityData?.country?.iso_code || "Unknown");

  // Determine confidence tier
  let confidence = "LOW";
  if (!isVpnOrDatacenter && accuracyRadius <= 25 && rawCity !== "Unknown") {
    confidence = "HIGH"; // Broadband / Fiber Wi-Fi -> High city accuracy
  } else if (!isVpnOrDatacenter && (accuracyRadius <= 120 || isMobileCarrier)) {
    confidence = "MEDIUM"; // Cellular CGNAT -> State is accurate, City is a gateway guess
  }

  return {
    country,
    country_code: countryCode,
    region,
    city: rawCity,
    accuracyRadius,
    asnOrg,
    isMobileCarrier,
    isVpnOrDatacenter,
    confidence
  };
}

// 4. GeoIP Lookup (Synchronous, in-process via MaxMind GeoLite2-City)
export function getLocationOffline(ip) {
  const normIp = normalizeIp(ip);
  if (!normIp || isPrivateIp(normIp)) {
    return {
      country: "Unknown",
      country_code: "Unknown",
      city: "Unknown",
      region: "Unknown",
      timezone: "UTC",
      source: "ip",
      accuracyRadius: 999,
      ll: []
    };
  }

  const reader = lookupReader || getLookupReaderSync();
  if (!reader) {
    return {
      country: "Unknown",
      country_code: "Unknown",
      city: "Unknown",
      region: "Unknown",
      timezone: "UTC",
      source: "ip",
      accuracyRadius: 999,
      ll: []
    };
  }

  try {
    const geo = reader.get(normIp);
    if (!geo) {
      return {
        country: "Unknown",
        country_code: "Unknown",
        city: "Unknown",
        region: "Unknown",
        timezone: "UTC",
        source: "ip",
        accuracyRadius: 999,
        ll: []
      };
    }

    const country = geo.country?.names?.en || geo.country?.iso_code || "Unknown";
    const countryCode = geo.country?.iso_code || "Unknown";
    const city = geo.city?.names?.en || "Unknown";
    const region = geo.subdivisions?.[0]?.names?.en || geo.subdivisions?.[0]?.iso_code || "Unknown";
    const timezone = geo.location?.time_zone || "UTC";
    const accuracyRadius = typeof geo.location?.accuracy_radius === "number" ? geo.location.accuracy_radius : 999;
    const lat = geo.location?.latitude;
    const lon = geo.location?.longitude;
    const ll = (typeof lat === "number" && typeof lon === "number") ? [lat, lon] : [];

    return {
      country,
      country_code: countryCode,
      city,
      region,
      timezone,
      source: "ip",
      accuracyRadius,
      ll
    };
  } catch (err) {
    console.error("[Geolocation] MaxMind lookup failed:", err.message);
    return {
      country: "Unknown",
      country_code: "Unknown",
      city: "Unknown",
      region: "Unknown",
      timezone: "UTC",
      source: "ip",
      accuracyRadius: 999,
      ll: []
    };
  }
}

// 5. Async Geo Lookup: In-process MaxMind with Single-Flight Deduplication, LRU cache, and FreeIPAPI fallback
export async function getLocationAsync(ip, options = {}) {
  const normIp = normalizeIp(ip);
  if (!normIp || isPrivateIp(normIp)) {
    return getLocationOffline(normIp);
  }

  if (geoCache.has(normIp)) {
    return geoCache.get(normIp);
  }

  // Single-flight deduplication: prevent cache stampedes when thousands of users share a CGNAT IP
  if (inflight.has(normIp)) {
    return inflight.get(normIp);
  }

  const fetcher = options.fetcher || axios.get;

  const lookupPromise = (async () => {
    // Primary: In-process MaxMind GeoLite2 lookup
    const localLoc = getLocationOffline(normIp);
    if (localLoc && localLoc.country_code !== "Unknown" && localLoc.city !== "Unknown") {
      geoCache.set(normIp, localLoc);
      return localLoc;
    }

    // Secondary Fallback: FreeIPAPI when local DB misses city or file is absent
    try {
      const { data } = await fetcher(`https://freeipapi.com/api/json/${encodeURIComponent(normIp)}`, {
        timeout: 2500,
        headers: {
          "Accept": "application/json",
          "User-Agent": "QRVibe-Analytics/1.0"
        }
      });

      if (data && (data.countryName || data.countryCode)) {
        const cityName = (data.cityName && data.cityName !== "-") ? data.cityName : (localLoc.city !== "Unknown" ? localLoc.city : "Unknown");
        const regionName = (data.regionName && data.regionName !== "-") ? data.regionName : (localLoc.region !== "Unknown" ? localLoc.region : "Unknown");
        const timeZone = (Array.isArray(data.timeZones) && data.timeZones.length > 0)
          ? data.timeZones[0]
          : (data.timeZone || (localLoc.timezone !== "UTC" ? localLoc.timezone : "UTC"));

        const loc = {
          country: data.countryName || data.countryCode || localLoc.country || "Unknown",
          country_code: data.countryCode || localLoc.country_code || "Unknown",
          city: cityName,
          region: regionName,
          timezone: timeZone,
          source: "ip",
          accuracyRadius: 100,
          ll: []
        };

        geoCache.set(normIp, loc);
        return loc;
      }
    } catch (_) {
      // API failed or timed out; proceed with localLoc
    }

    if (localLoc && localLoc.country_code !== "Unknown") {
      geoCache.set(normIp, localLoc);
    }

    return localLoc;
  })().finally(() => {
    inflight.delete(normIp);
  });

  inflight.set(normIp, lookupPromise);
  return lookupPromise;
}

// 6. Hybrid Geolocation: Read from CDN Edge Headers (with URL decoding)
export function getLocationFromHeaders(req) {
  if (!req) return null;
  const headers = req.headers || req;

  const country = headerValue(headers, "cf-ipcountry") || headerValue(headers, "x-vercel-ip-country");
  let vercelCity = headerValue(headers, "x-vercel-ip-city");
  if (vercelCity && typeof vercelCity === "string") {
    try {
      vercelCity = decodeURIComponent(vercelCity);
    } catch (_) {}
  }
  const city = headerValue(headers, "cf-ipcity") || vercelCity;
  const region = headerValue(headers, "cf-region") || headerValue(headers, "x-vercel-ip-country-region");
  const timezone = headerValue(headers, "cf-timezone") || headerValue(headers, "x-vercel-ip-timezone");

  if (!country && !city) {
    return null;
  }

  return {
    country: country || "Unknown",
    country_code: country || "Unknown",
    city: city || "Unknown",
    region: region || "Unknown",
    timezone: timezone || "UTC",
    source: "ip",
    accuracyRadius: 100,
    ll: []
  };
}
