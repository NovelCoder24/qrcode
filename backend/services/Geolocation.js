// backend/services/geolocation.js
import geoip from "geoip-lite";

// 1. IP Normalization & Validation
function normalizeIp(ip) {
  if (!ip || typeof ip !== "string") return null;
  ip = ip.trim();

  if (!ip) return null;

  // Headers sometimes include quoted/bracketed values or ports.
  ip = ip.replace(/^"|"$/g, "");
  if (ip.startsWith("[") && ip.includes("]")) {
    ip = ip.slice(1, ip.indexOf("]"));
  }

  // Convert IPv4-mapped IPv6 (::ffff:127.0.0.1 -> 127.0.0.1)
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);

  // Strip IPv4 ports such as 203.0.113.10:443.
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.slice(0, ip.lastIndexOf(":"));
  }

  return ip || null;
}

function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (ip === "0.0.0.0" || ip === "::") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true; // link-local
  if (ip.startsWith("100.")) {
    const octet = parseInt(ip.split(".")[1], 10);
    if (octet >= 64 && octet <= 127) return true; // carrier-grade NAT
  }
  if (ip.startsWith("172.")) {
    const octet = parseInt(ip.split(".")[1], 10);
    if (octet >= 16 && octet <= 31) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) return true;
  return false;
}

function headerValue(req, name) {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

function addCandidate(candidates, value) {
  const ip = normalizeIp(value);
  if (ip) candidates.push(ip);
}

function addForwardedHeaderCandidates(candidates, forwarded) {
  if (!forwarded || typeof forwarded !== "string") return;

  for (const part of forwarded.split(",")) {
    const match = part.match(/for="?([^;,"]+)"?/i);
    if (match?.[1]) addCandidate(candidates, match[1]);
  }
}

// 2. Client IP Extraction
export function getClientIp(req) {
  const candidates = [];

  // Express req.ip is the primary source once app.set("trust proxy", 1)
  // is enabled, but hosted proxy chains can still surface private hops.
  addCandidate(candidates, req.ip);

  for (const ip of req.ips || []) {
    addCandidate(candidates, ip);
  }

  addCandidate(candidates, headerValue(req, "cf-connecting-ip"));
  addCandidate(candidates, headerValue(req, "true-client-ip"));
  addCandidate(candidates, headerValue(req, "x-real-ip"));
  addForwardedHeaderCandidates(candidates, headerValue(req, "forwarded"));

  const forwardedFor = headerValue(req, "x-forwarded-for");
  if (forwardedFor) {
    for (const part of forwardedFor.split(",")) {
      addCandidate(candidates, part);
    }
  }

  addCandidate(candidates, req.socket?.remoteAddress);

  const publicIp = candidates.find((candidate) => !isPrivateIp(candidate));
  const ip = publicIp || candidates[0] || null;

  if (process.env.LOG_GEO_IP_DEBUG === "true") {
    console.log("[Geolocation] IP candidates:", candidates, "selected:", ip);
  }

  // LOCAL TESTING OVERRIDE
  // If we are on local dev, and the IP is private/local, inject a real IP.
  if (process.env.NODE_ENV !== "production" && isPrivateIp(ip)) {
    return "207.97.227.239"; // Test IP
  }

  return ip;
}

// 3. GeoIP Lookup (Synchronous, geoip-lite only)
export function getLocationOffline(ip) {
  if (!ip || isPrivateIp(ip)) {
    return {
      country: "Unknown",
      country_code: "Unknown",
      city: "Unknown",
      region: "Unknown",
      timezone: "UTC",
      ll: []
    };
  }

  try {
    const geo = geoip.lookup(ip);
    return {
      country: geo?.country || "Unknown",
      country_code: geo?.country || "Unknown",
      city: geo?.city || "Unknown",
      region: geo?.region || "Unknown",
      timezone: geo?.timezone || "UTC",
      ll: geo?.ll || []
    };
  } catch (err) {
    console.error("[Geolocation] Offline lookup failed:", err.message);
    return {
      country: "Unknown",
      country_code: "Unknown",
      city: "Unknown",
      region: "Unknown",
      timezone: "UTC",
      ll: []
    };
  }
}

// 4. Async Geo Lookup: keep async interface, but use stateless local lookup only.
export async function getLocationAsync(ip) {
  // This avoids redirect analytics depending on third-party network calls.
  return getLocationOffline(ip);
}
