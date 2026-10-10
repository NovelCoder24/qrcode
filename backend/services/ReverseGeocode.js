import axios from "axios";
import { LRUCache } from "lru-cache";
import { getLocationAsync } from "./Geolocation.js";

// Cache reverse geocode results clustered to ~1.1km (2 decimal places) for 7 days
const geoCache = new LRUCache({ max: 5000, ttl: 1000 * 60 * 60 * 24 * 7 });
const inflight = new Map();

export function clearReverseGeoCache() {
  geoCache.clear();
  inflight.clear();
}

// Offline reference centroids for major Indian & global cities (Tier-3 fallback when external APIs fail/timeout)
const OFFLINE_CITY_CENTROIDS = [
  { city: "Mumbai", region: "Maharashtra", country: "India", country_code: "IN", lat: 19.0760, lon: 72.8777, tz: "Asia/Kolkata" },
  { city: "Pune", region: "Maharashtra", country: "India", country_code: "IN", lat: 18.5204, lon: 73.8567, tz: "Asia/Kolkata" },
  { city: "Nagpur", region: "Maharashtra", country: "India", country_code: "IN", lat: 21.1458, lon: 79.0882, tz: "Asia/Kolkata" },
  { city: "Nashik", region: "Maharashtra", country: "India", country_code: "IN", lat: 19.9975, lon: 73.7898, tz: "Asia/Kolkata" },
  { city: "Aurangabad", region: "Maharashtra", country: "India", country_code: "IN", lat: 19.8762, lon: 75.3433, tz: "Asia/Kolkata" },
  { city: "New Delhi", region: "Delhi", country: "India", country_code: "IN", lat: 28.6139, lon: 77.2090, tz: "Asia/Kolkata" },
  { city: "Noida", region: "Uttar Pradesh", country: "India", country_code: "IN", lat: 28.5355, lon: 77.3910, tz: "Asia/Kolkata" },
  { city: "Gurugram", region: "Haryana", country: "India", country_code: "IN", lat: 28.4595, lon: 77.0266, tz: "Asia/Kolkata" },
  { city: "Bengaluru", region: "Karnataka", country: "India", country_code: "IN", lat: 12.9716, lon: 77.5946, tz: "Asia/Kolkata" },
  { city: "Mysuru", region: "Karnataka", country: "India", country_code: "IN", lat: 12.2958, lon: 76.6394, tz: "Asia/Kolkata" },
  { city: "Mangaluru", region: "Karnataka", country: "India", country_code: "IN", lat: 12.9141, lon: 74.8560, tz: "Asia/Kolkata" },
  { city: "Hyderabad", region: "Telangana", country: "India", country_code: "IN", lat: 17.3850, lon: 78.4867, tz: "Asia/Kolkata" },
  { city: "Warangal", region: "Telangana", country: "India", country_code: "IN", lat: 17.9689, lon: 79.5941, tz: "Asia/Kolkata" },
  { city: "Chennai", region: "Tamil Nadu", country: "India", country_code: "IN", lat: 13.0827, lon: 80.2707, tz: "Asia/Kolkata" },
  { city: "Coimbatore", region: "Tamil Nadu", country: "India", country_code: "IN", lat: 11.0168, lon: 76.9558, tz: "Asia/Kolkata" },
  { city: "Madurai", region: "Tamil Nadu", country: "India", country_code: "IN", lat: 9.9252, lon: 78.1198, tz: "Asia/Kolkata" },
  { city: "Kolkata", region: "West Bengal", country: "India", country_code: "IN", lat: 22.5726, lon: 88.3639, tz: "Asia/Kolkata" },
  { city: "Ahmedabad", region: "Gujarat", country: "India", country_code: "IN", lat: 23.0225, lon: 72.5714, tz: "Asia/Kolkata" },
  { city: "Surat", region: "Gujarat", country: "India", country_code: "IN", lat: 21.1702, lon: 72.8311, tz: "Asia/Kolkata" },
  { city: "Vadodara", region: "Gujarat", country: "India", country_code: "IN", lat: 22.3072, lon: 73.1812, tz: "Asia/Kolkata" },
  { city: "Rajkot", region: "Gujarat", country: "India", country_code: "IN", lat: 22.3039, lon: 70.8022, tz: "Asia/Kolkata" },
  { city: "Jaipur", region: "Rajasthan", country: "India", country_code: "IN", lat: 26.9124, lon: 75.7873, tz: "Asia/Kolkata" },
  { city: "Jodhpur", region: "Rajasthan", country: "India", country_code: "IN", lat: 26.2389, lon: 73.0243, tz: "Asia/Kolkata" },
  { city: "Udaipur", region: "Rajasthan", country: "India", country_code: "IN", lat: 24.5854, lon: 73.7125, tz: "Asia/Kolkata" },
  { city: "Kota", region: "Rajasthan", country: "India", country_code: "IN", lat: 25.2138, lon: 75.8648, tz: "Asia/Kolkata" },
  { city: "Lucknow", region: "Uttar Pradesh", country: "India", country_code: "IN", lat: 26.8467, lon: 80.9462, tz: "Asia/Kolkata" },
  { city: "Kanpur", region: "Uttar Pradesh", country: "India", country_code: "IN", lat: 26.4499, lon: 80.3319, tz: "Asia/Kolkata" },
  { city: "Varanasi", region: "Uttar Pradesh", country: "India", country_code: "IN", lat: 25.3176, lon: 82.9739, tz: "Asia/Kolkata" },
  { city: "Agra", region: "Uttar Pradesh", country: "India", country_code: "IN", lat: 27.1767, lon: 78.0081, tz: "Asia/Kolkata" },
  { city: "Prayagraj", region: "Uttar Pradesh", country: "India", country_code: "IN", lat: 25.4358, lon: 81.8463, tz: "Asia/Kolkata" },
  { city: "Bhopal", region: "Madhya Pradesh", country: "India", country_code: "IN", lat: 23.2599, lon: 77.4126, tz: "Asia/Kolkata" },
  { city: "Indore", region: "Madhya Pradesh", country: "India", country_code: "IN", lat: 22.7196, lon: 75.8577, tz: "Asia/Kolkata" },
  { city: "Jabalpur", region: "Madhya Pradesh", country: "India", country_code: "IN", lat: 23.1815, lon: 79.9864, tz: "Asia/Kolkata" },
  { city: "Gwalior", region: "Madhya Pradesh", country: "India", country_code: "IN", lat: 26.2183, lon: 78.1828, tz: "Asia/Kolkata" },
  { city: "Raipur", region: "Chhattisgarh", country: "India", country_code: "IN", lat: 21.2514, lon: 81.6296, tz: "Asia/Kolkata" },
  { city: "Bhilai", region: "Chhattisgarh", country: "India", country_code: "IN", lat: 21.1938, lon: 81.3509, tz: "Asia/Kolkata" },
  { city: "Bilaspur", region: "Chhattisgarh", country: "India", country_code: "IN", lat: 22.0797, lon: 82.1409, tz: "Asia/Kolkata" },
  { city: "Patna", region: "Bihar", country: "India", country_code: "IN", lat: 25.5941, lon: 85.1376, tz: "Asia/Kolkata" },
  { city: "Ranchi", region: "Jharkhand", country: "India", country_code: "IN", lat: 23.3441, lon: 85.3096, tz: "Asia/Kolkata" },
  { city: "Jamshedpur", region: "Jharkhand", country: "India", country_code: "IN", lat: 22.8046, lon: 86.2029, tz: "Asia/Kolkata" },
  { city: "Bhubaneswar", region: "Odisha", country: "India", country_code: "IN", lat: 20.2961, lon: 85.8245, tz: "Asia/Kolkata" },
  { city: "Cuttack", region: "Odisha", country: "India", country_code: "IN", lat: 20.4625, lon: 85.8830, tz: "Asia/Kolkata" },
  { city: "Chandigarh", region: "Chandigarh", country: "India", country_code: "IN", lat: 30.7333, lon: 76.7794, tz: "Asia/Kolkata" },
  { city: "Ludhiana", region: "Punjab", country: "India", country_code: "IN", lat: 30.9010, lon: 75.8573, tz: "Asia/Kolkata" },
  { city: "Amritsar", region: "Punjab", country: "India", country_code: "IN", lat: 31.6340, lon: 74.8723, tz: "Asia/Kolkata" },
  { city: "Dehradun", region: "Uttarakhand", country: "India", country_code: "IN", lat: 30.3165, lon: 78.0322, tz: "Asia/Kolkata" },
  { city: "Shimla", region: "Himachal Pradesh", country: "India", country_code: "IN", lat: 31.1048, lon: 77.1734, tz: "Asia/Kolkata" },
  { city: "Srinagar", region: "Jammu and Kashmir", country: "India", country_code: "IN", lat: 34.0837, lon: 74.7973, tz: "Asia/Kolkata" },
  { city: "Jammu", region: "Jammu and Kashmir", country: "India", country_code: "IN", lat: 32.7266, lon: 74.8570, tz: "Asia/Kolkata" },
  { city: "Guwahati", region: "Assam", country: "India", country_code: "IN", lat: 26.1445, lon: 91.7362, tz: "Asia/Kolkata" },
  { city: "Kochi", region: "Kerala", country: "India", country_code: "IN", lat: 9.9312, lon: 76.2673, tz: "Asia/Kolkata" },
  { city: "Thiruvananthapuram", region: "Kerala", country: "India", country_code: "IN", lat: 8.5241, lon: 76.9366, tz: "Asia/Kolkata" },
  { city: "Kozhikode", region: "Kerala", country: "India", country_code: "IN", lat: 11.2588, lon: 75.7804, tz: "Asia/Kolkata" },
  { city: "Visakhapatnam", region: "Andhra Pradesh", country: "India", country_code: "IN", lat: 17.6868, lon: 83.2185, tz: "Asia/Kolkata" },
  { city: "Vijayawada", region: "Andhra Pradesh", country: "India", country_code: "IN", lat: 16.5062, lon: 80.6480, tz: "Asia/Kolkata" },
  { city: "Panaji", region: "Goa", country: "India", country_code: "IN", lat: 15.4909, lon: 73.8278, tz: "Asia/Kolkata" },
  { city: "New York", region: "New York", country: "United States", country_code: "US", lat: 40.7128, lon: -74.0060, tz: "America/New_York" },
  { city: "San Francisco", region: "California", country: "United States", country_code: "US", lat: 37.7749, lon: -122.4194, tz: "America/Los_Angeles" },
  { city: "London", region: "England", country: "United Kingdom", country_code: "GB", lat: 51.5074, lon: -0.1278, tz: "Europe/London" },
  { city: "Singapore", region: "Singapore", country: "Singapore", country_code: "SG", lat: 1.3521, lon: 103.8198, tz: "Asia/Singapore" },
  { city: "Dubai", region: "Dubai", country: "United Arab Emirates", country_code: "AE", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai" }
];

function extractAdminLocalityFromBdc(data) {
  let district = "";
  let adminLocality = "";
  if (Array.isArray(data?.localityInfo?.administrative)) {
    const districtObj = data.localityInfo.administrative.find(
      (item) => item.description?.toLowerCase().includes("district") || item.name?.toLowerCase().includes("district")
    );
    if (districtObj?.name) {
      district = districtObj.name.replace(/\s+district$/i, "").trim();
    }
    const cityAdminObj = data.localityInfo.administrative.find(
      (item) => item.name && item.adminLevel >= 5 && !/country|state|division/i.test(item.description || "")
    );
    if (cityAdminObj?.name) {
      adminLocality = cityAdminObj.name.replace(/\s+district$/i, "").trim();
    }
  }
  return { district, adminLocality };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function resolveOfflineCoordinates(lat, lon) {
  let nearest = null;
  let minDistance = Infinity;

  for (const entry of OFFLINE_CITY_CENTROIDS) {
    const dist = haversineKm(lat, lon, entry.lat, entry.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = entry;
    }
  }

  // Match if within 250km of a known city centroid, or within India bounding box (6.5..37.5 N, 68..97.5 E)
  const isWithinIndia = lat >= 6.5 && lat <= 37.5 && lon >= 68.0 && lon <= 97.5;
  if (nearest && (minDistance <= 250 || isWithinIndia)) {
    return {
      country: nearest.country,
      country_code: nearest.country_code,
      city: nearest.city,
      region: nearest.region,
      district: nearest.city,
      pincode: "",
      timezone: nearest.tz,
      ll: [], // DPDP: discard raw GPS coordinates
      source: "gps"
    };
  }

  return null;
}

const TIMEZONE_FALLBACK_MAP = {
  "Asia/Kolkata": { city: "India", region: "India", country: "India", country_code: "IN", timezone: "Asia/Kolkata" },
  "Asia/Calcutta": { city: "India", region: "India", country: "India", country_code: "IN", timezone: "Asia/Kolkata" },
  "America/New_York": { city: "New York", region: "New York", country: "United States", country_code: "US", timezone: "America/New_York" },
  "America/Los_Angeles": { city: "San Francisco", region: "California", country: "United States", country_code: "US", timezone: "America/Los_Angeles" },
  "America/Chicago": { city: "Chicago", region: "Illinois", country: "United States", country_code: "US", timezone: "America/Chicago" },
  "Europe/London": { city: "London", region: "England", country: "United Kingdom", country_code: "GB", timezone: "Europe/London" },
  "Asia/Singapore": { city: "Singapore", region: "Singapore", country: "Singapore", country_code: "SG", timezone: "Asia/Singapore" },
  "Asia/Dubai": { city: "Dubai", region: "Dubai", country: "United Arab Emirates", country_code: "AE", timezone: "Asia/Dubai" }
};

/**
 * Resolves coarse city/region via WAN lookup when the user accepted the browser GPS prompt
 * on a desktop/device whose OS location service returned POSITION_UNAVAILABLE or TIMEOUT.
 */
export async function resolveWanLocation(options = {}) {
  const fetcher = options.fetcher || axios.get;
  const { clientIp, headerLocation, timezone } = options;

  // 0. If edge proxy headers already resolved a specific city, use it immediately
  if (headerLocation && headerLocation.city && headerLocation.city !== "Unknown" && headerLocation.city !== "-") {
    return {
      country: headerLocation.country || "India",
      country_code: headerLocation.country_code || "IN",
      city: headerLocation.city,
      region: headerLocation.region && headerLocation.region !== "Unknown" ? headerLocation.region : headerLocation.city,
      district: headerLocation.district || headerLocation.city,
      pincode: String(headerLocation.pincode || ""),
      timezone: headerLocation.timezone || timezone || "Asia/Kolkata",
      ll: [],
      source: "gps"
    };
  }

  // 0b. If clientIp is provided (and not using a custom unit-test fetcher), check MaxMind/IP cache
  if (clientIp && !options.fetcher) {
    try {
      const ipLoc = await getLocationAsync(clientIp);
      if (ipLoc && ipLoc.city && ipLoc.city !== "Unknown" && ipLoc.city !== "-") {
        return {
          country: ipLoc.country || "India",
          country_code: ipLoc.country_code || "IN",
          city: ipLoc.city,
          region: ipLoc.region && ipLoc.region !== "Unknown" ? ipLoc.region : ipLoc.city,
          district: ipLoc.district || ipLoc.city,
          pincode: String(ipLoc.pincode || ""),
          timezone: ipLoc.timezone || timezone || "Asia/Kolkata",
          ll: [],
          source: "gps"
        };
      }
    } catch (_) {}
  }

  // 1. BigDataCloud client reverse geocode
  try {
    const { data } = await fetcher("https://api.bigdatacloud.net/data/reverse-geocode-client", {
      params: { localityLanguage: "en" },
      timeout: 3000,
      headers: {
        "Accept": "application/json",
        "User-Agent": "QRVibe-Analytics/1.0 (https://qrvibe.in)"
      }
    });

    if (data) {
      const { district, adminLocality } = extractAdminLocalityFromBdc(data);
      const rawCity = data.city || data.locality || district || adminLocality || data.principalSubdivision || "";
      const city = String(rawCity).trim();
      const region = String(data.principalSubdivision || district || city || "Unknown").trim();
      if (city && city !== "Unknown" && city !== "-") {
        return {
          country: data.countryName || "India",
          country_code: data.countryCode || "IN",
          city,
          region: region !== "-" ? region : city,
          district: district || city,
          pincode: String(data.postcode || ""),
          timezone: timezone || "Asia/Kolkata",
          ll: [],
          source: "gps"
        };
      }
    }
  } catch (_) {}

  // 2. FreeIPAPI fallback
  try {
    const { data } = await fetcher("https://freeipapi.com/api/json/", {
      timeout: 3000,
      headers: {
        "Accept": "application/json",
        "User-Agent": "QRVibe-Analytics/1.0"
      }
    });

    if (data && (data.cityName || data.regionName)) {
      const city = (data.cityName && data.cityName !== "-")
        ? data.cityName
        : (data.regionName && data.regionName !== "-")
          ? data.regionName
          : "";
      if (city && city !== "Unknown") {
        return {
          country: data.countryName || "India",
          country_code: data.countryCode || "IN",
          city,
          region: (data.regionName && data.regionName !== "-") ? data.regionName : city,
          district: city,
          pincode: String(data.zipCode || ""),
          timezone: Array.isArray(data.timeZones) && data.timeZones[0] ? data.timeZones[0] : (timezone || "Asia/Kolkata"),
          ll: [],
          source: "gps"
        };
      }
    }
  } catch (_) {}

  // 3. ipwho.is fallback (when running with real network fetcher)
  if (!options.fetcher) {
    try {
      const { data } = await fetcher("https://ipwho.is/", {
        timeout: 3000,
        headers: {
          "Accept": "application/json",
          "User-Agent": "QRVibe-Analytics/1.0"
        }
      });

      if (data && data.success !== false && (data.city || data.region)) {
        const city = (data.city || data.region || "").trim();
        if (city && city !== "Unknown" && city !== "-") {
          return {
            country: data.country || "India",
            country_code: data.country_code || "IN",
            city,
            region: data.region || city,
            district: city,
            pincode: String(data.postal || ""),
            timezone: data.timezone?.id || timezone || "Asia/Kolkata",
            ll: [],
            source: "gps"
          };
        }
      }
    } catch (_) {}
  }

  // 4. Timezone-based coarse fallback if browser supplied its IANA timezone
  if (timezone && TIMEZONE_FALLBACK_MAP[timezone]) {
    const tzFallback = TIMEZONE_FALLBACK_MAP[timezone];
    return {
      country: tzFallback.country,
      country_code: tzFallback.country_code,
      city: tzFallback.city,
      region: tzFallback.region,
      district: tzFallback.city,
      pincode: "",
      timezone: tzFallback.timezone,
      ll: [],
      source: "gps"
    };
  }

  return null;
}

/**
 * Reverse geocodes GPS coordinates (latitude, longitude) to coarse administrative components.
 * DPDP Compliance: Raw coordinates (lat/lon) are never persisted; returns ll: [].
 * Production Policy: Uses BigDataCloud in production; Nominatim is gated to non-production only.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {{ fetcher?: Function }} [options]
 * @returns {Promise<{ country: string, country_code: string, city: string, region: string, district: string, pincode: string, timezone: string, ll: [], source: string } | null>}
 */
export async function reverseGeocode(latitude, longitude, options = {}) {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  // Cluster coordinates by ~1.1km for caching efficiency & privacy
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (geoCache.has(cacheKey)) {
    return geoCache.get(cacheKey);
  }

  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey);
  }

  const fetcher = options.fetcher || axios.get;

  const lookupPromise = (async () => {
    let bdcSubdivisionFallback = null;

    // 1. Primary: BigDataCloud Reverse Geocode API (Free, fast, no auth required)
    try {
      const { data } = await fetcher("https://api.bigdatacloud.net/data/reverse-geocode-client", {
        params: {
          latitude: lat,
          longitude: lon,
          localityLanguage: "en"
        },
        timeout: 3000,
        headers: {
          "Accept": "application/json",
          "User-Agent": "QRVibe-Analytics/1.0 (https://qrvibe.in)"
        }
      });

      if (data && (data.countryName || data.countryCode)) {
        const { district, adminLocality } = extractAdminLocalityFromBdc(data);

        // Prefer a specific city/locality/district over state-level principalSubdivision
        const rawSpecificCity = data.city || data.locality || district || adminLocality || "";
        const specificCity = rawSpecificCity !== "-" ? String(rawSpecificCity).trim() : "";
        const rawRegion = data.principalSubdivision || district || specificCity || "Unknown";
        const region = rawRegion !== "-" ? String(rawRegion).trim() : "Unknown";
        const country = data.countryName || "Unknown";
        const countryCode = data.countryCode || "Unknown";
        const pincode = data.postcode || "";

        if (specificCity && specificCity !== "Unknown") {
          const result = {
            country,
            country_code: countryCode,
            city: specificCity,
            region,
            district: district || specificCity,
            pincode: String(pincode || ""),
            timezone: "Asia/Kolkata",
            ll: [], // DPDP: discard raw GPS coordinates
            source: "gps"
          };

          geoCache.set(cacheKey, result);
          return result;
        }

        // If BigDataCloud only returned state (principalSubdivision), hold it as a fallback
        // after trying Nominatim (dev) and offline city centroids first.
        if (region && region !== "Unknown") {
          bdcSubdivisionFallback = {
            country,
            country_code: countryCode,
            city: region,
            region,
            district: region,
            pincode: String(pincode || ""),
            timezone: "Asia/Kolkata",
            ll: [],
            source: "gps"
          };
        }
      }
    } catch (apiErr) {
      if (process.env.NODE_ENV !== "test") {
        console.warn(`[ReverseGeocode] BigDataCloud failed (${apiErr.message}).`);
      }
    }

    // 2. Secondary Fallback (Development / Non-Production ONLY): OpenStreetMap Nominatim
    // Nominatim public usage policy strictly prohibits production bulk usage (max 1 req/s).
    if (process.env.NODE_ENV !== "production") {
      try {
        const { data } = await fetcher("https://nominatim.openstreetmap.org/reverse", {
          params: {
            lat,
            lon,
            format: "json",
            "accept-language": "en"
          },
          timeout: 4500,
          headers: {
            "Accept": "application/json",
            "User-Agent": "QRVibe-Dev/1.0 (contact@qrvibe.in)"
          }
        });

        if (data && data.address) {
          const addr = data.address;
          const city =
            addr.city ||
            addr.town ||
            addr.city_district ||
            addr.municipality ||
            addr.village ||
            addr.suburb ||
            addr.state_district ||
            addr.county ||
            addr.neighbourhood ||
            addr.hamlet ||
            addr.state ||
            "Unknown";
          const region = addr.state || addr.province || addr.region || city || "Unknown";
          const country = addr.country || "Unknown";
          const countryCode = (addr.country_code || "").toUpperCase() || "Unknown";
          const district = (addr.state_district || addr.county || city || "Unknown").replace(/\s+district$/i, "").trim();
          const pincode = addr.postcode || "";

          if (city && city !== "Unknown") {
            const result = {
              country,
              country_code: countryCode,
              city,
              region,
              district,
              pincode: String(pincode || ""),
              timezone: "UTC",
              ll: [], // DPDP: discard raw GPS coordinates
              source: "gps"
            };

            geoCache.set(cacheKey, result);
            return result;
          }
        }
      } catch (_) {
        // Ignore dev fallback error
      }
    }

    // 3. Offline In-Process Centroid Fallback when external geocoders time out or only returned state
    const offlineMatch = resolveOfflineCoordinates(lat, lon);
    if (offlineMatch) {
      const merged = bdcSubdivisionFallback
        ? {
            ...offlineMatch,
            pincode: bdcSubdivisionFallback.pincode || offlineMatch.pincode
          }
        : offlineMatch;
      geoCache.set(cacheKey, merged);
      return merged;
    }

    // 3b. If BigDataCloud returned a state/subdivision and coordinates were outside centroid coverage, use it
    if (bdcSubdivisionFallback) {
      geoCache.set(cacheKey, bdcSubdivisionFallback);
      return bdcSubdivisionFallback;
    }

    // 4. Final fallback if coordinates are out of known regions and reverse geocoder is unreachable
    return {
      country: "Unknown",
      country_code: "Unknown",
      city: "Unknown",
      region: "Unknown",
      district: "Unknown",
      pincode: "",
      timezone: "UTC",
      ll: [],
      source: "gps"
    };
  })().finally(() => {
    inflight.delete(cacheKey);
  });

  inflight.set(cacheKey, lookupPromise);
  return lookupPromise;
}
