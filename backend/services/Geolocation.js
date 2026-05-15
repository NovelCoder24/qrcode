// backend/services/geolocation.js
import geoip from "geoip-lite";
import axios from "axios";

// 1. IP Normalization & Validation
function normalizeIp(ip) {
  if (!ip || typeof ip !== "string") return null;
  ip = ip.trim();
  // Convert IPv4-mapped IPv6 (::ffff:127.0.0.1 → 127.0.0.1)
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  return ip || null;
}

function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true; // link-local
  if (ip.startsWith("172.")) {
    const octet = parseInt(ip.split(".")[1], 10);
    if (octet >= 16 && octet <= 31) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) return true;
  return false;
}

// ==========================================
// FREEIPAPI RATE LIMITER (60 req/min)
// ==========================================
let apiCallCount = 0;
let windowStart = Date.now();
const API_LIMIT = 55; // Stay 5 under the 60/min limit for safety margin
const WINDOW_MS = 60 * 1000;

function canCallApi() {
  const now = Date.now();
  if (now - windowStart >= WINDOW_MS) {
    // Reset the window
    apiCallCount = 0;
    windowStart = now;
  }
  return apiCallCount < API_LIMIT;
}

function recordApiCall() {
  apiCallCount++;
}

// 2. Client IP Extraction
export function getClientIp(req) {
  let ip = null;

  if (req.ip) {
    ip = normalizeIp(req.ip);
  } else if (req.headers["x-forwarded-for"]) {
    const ips = req.headers["x-forwarded-for"]
      .split(",")
      .map((s) => normalizeIp(s))
      .filter(Boolean);
    ip = ips.find((i) => !isPrivateIp(i)) || ips[0]; 
  } else if (req.socket?.remoteAddress) {
    ip = normalizeIp(req.socket.remoteAddress);
  }

  // 🚨 LOCAL TESTING OVERRIDE 🚨
  // If we are on local dev, and the IP is private/local, inject a real IP
  if (process.env.NODE_ENV !== "production" && isPrivateIp(ip)) {
    return "207.97.227.239"; // Test IP
  }

  return ip;
}

// 3. GeoIP Lookup (Synchronous — geoip-lite only, used as fallback)
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
    return { country: "Unknown", country_code: "Unknown", city: "Unknown", region: "Unknown", timezone: "UTC", ll: [] };
  }
}

// 4. Async Geo Lookup — freeipapi.com first, geoip-lite fallback
export async function getLocationAsync(ip) {
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

  // Try freeipapi.com if within rate limit
  if (canCallApi()) {
    try {
      recordApiCall();
      const { data } = await axios.get(`https://freeipapi.com/api/json/${ip}`, {
        timeout: 3000 // 3s hard timeout — don't let it slow down analytics
      });

      if (data && data.countryCode) {
        return {
          country: data.countryName || data.countryCode || "Unknown",
          country_code: data.countryCode || "Unknown",
          city: data.cityName || "Unknown",
          region: data.regionName || "Unknown",
          timezone: data.timeZone || "UTC",
          ll: [data.latitude, data.longitude].filter(Boolean)
        };
      }
      console.log(data);
    } catch (apiErr) {
      // API failed (rate limited, timeout, network error) — fall through to offline
      console.warn(`[Geolocation] freeipapi.com failed for ${ip}: ${apiErr.message}. Falling back to geoip-lite.`);
    }
  }

  // Fallback: geoip-lite (synchronous, local DB)
  return getLocationOffline(ip);
}