import maxmind, { Reader } from "maxmind";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { LRUCache } from "lru-cache";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path for MaxMind GeoLite2-City
const DEFAULT_DB_PATH = path.resolve(__dirname, "../data/GeoLite2-City.mmdb");
const dbPath = process.env.GEOLITE2_DB_PATH || process.env.MAXMIND_DB_PATH || DEFAULT_DB_PATH;

// In-process Reader instance, LRU Cache, and Single-Flight Inflight Map
let lookupReader = null;
const geoCache = new LRUCache({ max: 5000, ttl: 1000 * 60 * 60 * 24 });
const inflight = new Map();

export function clearGeoCache() {
  geoCache.clear();
  inflight.clear();
}

/**
 * Synchronously retrieves or instantiates the MaxMind reader into memory.
 */
function getLookupReaderSync() {
  if (lookupReader) return lookupReader;
  try {
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      lookupReader = new Reader(buffer);
      return lookupReader;
    }
  } catch (err) {
    console.error("[Geolocation] Failed to load GeoLite2-City.mmdb synchronously:", err.message);
  }
  return null;
}

/**
 * Asynchronously initializes the reader if preferred at boot.
 */
export async function initGeoLiteReader() {
  if (lookupReader) return lookupReader;
  try {
    if (fs.existsSync(dbPath)) {
      lookupReader = await maxmind.open(dbPath);
      return lookupReader;
    } else {
      console.warn(`[Geolocation] GeoLite2-City database not found at ${dbPath}`);
    }
  } catch (err) {
    console.error("[Geolocation] Failed to open GeoLite2 database asynchronously:", err.message);
  }
  return null;
}

// Pre-load database in-process immediately on module import
try {
  getLookupReaderSync();
} catch (_) { }

// 1. IP Normalization & Validation (IPv4 & IPv6 safe)
function normalizeIp(ip) {
  if (!ip || typeof ip !== "string") return null;
  ip = ip.trim();

  if (!ip) return null;

  ip = ip.replace(/^"|"$/g, "");
  if (ip.startsWith("[") && ip.includes("]")) {
    ip = ip.slice(1, ip.indexOf("]"));
  }

  // Convert IPv4-mapped IPv6 (::ffff:127.0.0.1 -> 127.0.0.1)
  if (ip.toLowerCase().startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  // Strip IPv4 ports such as 203.0.113.10:443
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.slice(0, ip.lastIndexOf(":"));
  }

  return ip || null;
}

function isPrivateIp(ip) {
  if (!ip) return true;
  const lower = ip.toLowerCase();
  if (lower === "127.0.0.1" || lower === "::1" || lower === "localhost") return true;
  if (lower === "0.0.0.0" || lower === "::") return true;
  if (lower.startsWith("10.") || lower.startsWith("192.168.")) return true;
  if (lower.startsWith("169.254.")) return true; // link-local
  if (lower.startsWith("100.")) {
    const octet = parseInt(lower.split(".")[1], 10);
    if (octet >= 64 && octet <= 127) return true;
  }
  if (lower.startsWith("172.")) {
    const octet = parseInt(lower.split(".")[1], 10);
    if (octet >= 16 && octet <= 31) return true;
  }
  if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:")) return true;
  return false;
}

function headerValue(req, name) {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

// 2. Client IP Extraction
export function getClientIp(req) {
  if (!req) return null;

  if (process.env.NODE_ENV !== "production") {
    const testIp = req.query?.test_ip || req.query?.ip;
    const normTest = normalizeIp(testIp);
    if (normTest) return normTest;
  }

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

  const forwardedFor = headerValue(req, "x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map(normalizeIp).filter(Boolean);
    const clientHop = parts.find((ip) => !isPrivateIp(ip));
    if (clientHop) return clientHop;
  }

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

  const fallbackIp = edgeTrueClient || edgeCf || edgeReal || reqIp || socketIp || "127.0.0.1";
  if (fallbackIp === "::1") return "127.0.0.1";
  return fallbackIp;
}

// 3. GeoIP Lookup (Synchronous, in-process via MaxMind GeoLite2-City)
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
        ll: []
      };
    }

    const country = geo.country?.names?.en || geo.country?.iso_code || "Unknown";
    const countryCode = geo.country?.iso_code || "Unknown";
    const city = geo.city?.names?.en || "Unknown";
    const region = geo.subdivisions?.[0]?.names?.en || geo.subdivisions?.[0]?.iso_code || "Unknown";
    const timezone = geo.location?.time_zone || "UTC";
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
      ll: []
    };
  }
}

// 4. Async Geo Lookup: In-process MaxMind with Single-Flight Deduplication, LRU cache, and FreeIPAPI fallback
export async function getLocationAsync(ip, options = {}) {
  const normIp = normalizeIp(ip);
  const isPrivate = !normIp || isPrivateIp(normIp);

  // ✅ DEV FIX: Private/localhost IP → still try FreeIPAPI (it uses the CALLER's public IP)
  if (isPrivate) {
    const cacheKey = normIp || "local";
    if (geoCache.has(cacheKey)) {
      return geoCache.get(cacheKey);
    }
    if (inflight.has(cacheKey)) {
      return inflight.get(cacheKey);
    }

    const fetcher = options.fetcher || axios.get;

    const localPromise = (async () => {
      try {
        // No IP in URL → FreeIPAPI auto-detects caller's public IP
        const { data } = await fetcher("https://freeipapi.com/api/json/", {
          timeout: 3000,
          headers: {
            "Accept": "application/json",
            "User-Agent": "QRVibe-Analytics/1.0"
          }
        });

        if (data && (data.countryName || data.countryCode)) {
          const loc = {
            country: data.countryName || data.countryCode || "Unknown",
            country_code: data.countryCode || "Unknown",
            city: (data.cityName && data.cityName !== "-") ? data.cityName : "Unknown",
            region: (data.regionName && data.regionName !== "-") ? data.regionName : "Unknown",
            timezone: Array.isArray(data.timeZones) && data.timeZones[0] ? data.timeZones[0] : "UTC",
            source: "ip",
            ll: []
          };
          geoCache.set(cacheKey, loc);
          return loc;
        }
      } catch (err) {
        console.warn("[Geolocation] FreeIPAPI fallback for private IP failed:", err.message);
      }

      return getLocationOffline(normIp);
    })().finally(() => {
      inflight.delete(cacheKey);
    });

    inflight.set(cacheKey, localPromise);
    return localPromise;
  }

  // ── Public IP path (unchanged) ──
  if (geoCache.has(normIp)) {
    return geoCache.get(normIp);
  }

  if (inflight.has(normIp)) {
    return inflight.get(normIp);
  }

  const fetcher = options.fetcher || axios.get;

  const lookupPromise = (async () => {
    const localLoc = getLocationOffline(normIp);
    if (localLoc && localLoc.country_code !== "Unknown" && localLoc.city !== "Unknown") {
      geoCache.set(normIp, localLoc);
      return localLoc;
    }

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
          ll: []
        };

        geoCache.set(normIp, loc);
        return loc;
      }
    } catch (_) { }

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

// 5. Hybrid Geolocation: Read from CDN Edge Headers
export function getLocationFromHeaders(req) {
  if (!req || !req.headers) return null;

  const country = req.headers["cf-ipcountry"] || req.headers["x-vercel-ip-country"];
  const city = req.headers["cf-ipcity"] || req.headers["x-vercel-ip-city"];
  const region = req.headers["cf-region"] || req.headers["x-vercel-ip-country-region"];
  const timezone = req.headers["cf-timezone"] || req.headers["x-vercel-ip-timezone"];

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
    ll: []
  };
}