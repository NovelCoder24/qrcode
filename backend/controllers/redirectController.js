import { QRCode } from "../models/QRCode.js";
import { Scan } from "../models/Scan.js";
import { DailyScanStats } from "../models/DailyScanStats.js";
import { User } from "../models/User.js";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import { getClientIp, getLocationAsync, getLocationFromHeaders } from "../services/Geolocation.js";
import { reverseGeocode, resolveWanLocation } from "../services/ReverseGeocode.js";
import { env } from "../config/env.js";

const BOT_PATTERN = /bot\b|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|slack|discord|headlesschrome|puppeteer|playwright|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot/i;

const IN_APP_BROWSER_PATTERN = /Instagram|FBAN|FBAV|WhatsApp|Snapchat|Line\/|LinkedInApp|wv\)|WebView/i;

export const isInAppBrowser = (ua) => {
  if (!ua || typeof ua !== "string") return false;
  return IN_APP_BROWSER_PATTERN.test(ua);
};

const sanitizeKey = (str) => {
  if (!str) return "unknown";
  return String(str).replace(/\./g, "_").replace(/\$/g, "_").toLowerCase();
};

const formatLocationKey = (loc) => {
  const city = String(loc?.city || "Unknown").replace(/\./g, "_").replace(/\$/g, "_");
  const region = String(loc?.region || "Unknown").replace(/\./g, "_").replace(/\$/g, "_");
  const code = String(loc?.country_code || "Unknown").replace(/\./g, "_").replace(/\$/g, "_");
  const name = String(loc?.country || "Unknown").replace(/\./g, "_").replace(/\$/g, "_");
  return `${city}::${region}::${code}::${name}`;
};

export const resolveInitialLocation = (qr, ipLocation) => {
  const ipCity = ipLocation?.city || "Unknown";
  if (qr?.placement?.city && String(qr.placement.city).trim()) {
    return {
      location: {
        country: qr.placement.country?.trim() || ipLocation?.country || "India",
        country_code: qr.placement.country_code?.trim() || ipLocation?.country_code || "IN",
        region: qr.placement.region?.trim() || ipLocation?.region || "Unknown",
        city: qr.placement.city.trim(),
        district: qr.placement.city.trim(),
        pincode: "",
        timezone: ipLocation?.timezone || "Asia/Kolkata",
        source: "placement",
        ll: []
      },
      ipCity
    };
  }

  return {
    location: {
      country: ipLocation?.country || "Unknown",
      country_code: ipLocation?.country_code || "Unknown",
      region: ipLocation?.region || "Unknown",
      city: ipCity,
      district: ipLocation?.district || "",
      pincode: ipLocation?.pincode || "",
      timezone: ipLocation?.timezone || "UTC",
      source: ipLocation?.source || "ip",
      ll: []
    },
    ipCity
  };
};

const recentScans = new Map();
const pendingScanWrites = new Map();
const issuedTelemetryTokens = new Map();
const DEDUP_WINDOW_MS = 5000;
const TOKEN_TTL_MS = 5 * 60 * 1000;

// ── Legacy HTML GPS interstitial (kept as fallback for direct backend access) ──
// Primary flow: frontend fetches JSON and renders GpsConsentPage.jsx
export const renderGpsInterstitial = ({ shortId, destinationUrl, title, telemetryToken }) => {
  const safeTitle = (title || "Redirecting...").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeDest = destinationUrl.replace(/"/g, "&quot;");
  const safeToken = String(telemetryToken || "").replace(/"/g, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} | Connecting...</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root { --bg:#0b0f19; --card-bg:rgba(22,29,47,0.85); --border:rgba(255,255,255,0.1); --text:#f8fafc; --text-muted:#94a3b8; --primary:#5B3FF4; --primary-hover:#4f35d8; }
    @media (prefers-color-scheme: light) { :root { --bg:#f8fafc; --card-bg:#fff; --border:#e2e8f0; --text:#0f172a; --text-muted:#475569; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1.5rem; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px; padding: 2rem 1.75rem; max-width: 400px; width: 100%; text-align: center; }
    .icon-box { width: 56px; height: 56px; margin: 0 auto 1.25rem; border-radius: 50%; background: rgba(91,63,244,0.12); display: flex; align-items: center; justify-content: center; color: var(--primary); }
    .icon-box svg { width: 28px; height: 28px; }
    h1 { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; }
    .subtitle { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem; }
    .actions { display: flex; flex-direction: column; gap: 0.75rem; }
    .btn-primary { background: var(--primary); color: #fff; border: none; border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 10px; padding: 0.65rem 1rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-box">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    </div>
    <h1>${safeTitle}</h1>
    <p class="subtitle">We use your location to show scans near you and verify regional access. Only city and region are stored.</p>
    <div class="actions">
      <button type="button" class="btn-primary" id="shareBtn">Share location</button>
      <a href="${safeDest}" class="btn-secondary" id="skipLink">No thanks</a>
    </div>
  </div>

  <script>
    (function() {
      var dest = "${safeDest}";
      var shortId = "${shortId}";
      var token = "${safeToken}";
      var redirected = false;
      var acquisitionStarted = false;
      var resolved = false;

      function redirectNow() {
        if (redirected) return;
        redirected = true;
        window.location.replace(dest);
      }

      var skip = document.getElementById('skipLink');
      if (skip) skip.addEventListener('click', function(e) { e.preventDefault(); redirectNow(); });

      var idleTimer = setTimeout(redirectNow, 22000);

      function sendTelemetryAndRedirect(bodyObj) {
        if (resolved) return;
        resolved = true;
        clearTimeout(idleTimer);

        try {
          try { var tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (tz) bodyObj.timezone = tz; } catch (_) {}
          var payload = JSON.stringify(bodyObj);
          var url = '/r/' + encodeURIComponent(shortId) + '/telemetry';
          var safetyTimer = setTimeout(redirectNow, 2500);
          if (typeof window.fetch === 'function') {
            fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: payload })
              .then(function() { clearTimeout(safetyTimer); redirectNow(); })
              .catch(function() {
                clearTimeout(safetyTimer);
                if (navigator.sendBeacon) {
                  try { var blob = new Blob([payload], { type: 'application/json' }); navigator.sendBeacon(url, blob); } catch (_) {}
                }
                redirectNow();
              });
          } else if (navigator.sendBeacon) {
            var blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
            clearTimeout(safetyTimer);
            redirectNow();
          } else { clearTimeout(safetyTimer); redirectNow(); }
        } catch (err) { redirectNow(); }
      }

      var shareBtn = document.getElementById('shareBtn');

      function startLocationAcquisition() {
        if (acquisitionStarted || redirected) return;
        acquisitionStarted = true;
        clearTimeout(idleTimer);
        if (shareBtn) { shareBtn.textContent = "Connecting..."; shareBtn.disabled = true; }

        var bdcResult = null;
        var bdcDeadline = setTimeout(function() {
          if (!resolved && bdcResult) {
            sendTelemetryAndRedirect({
              telemetryToken: token,
              resolvedCity: bdcResult.city,
              resolvedRegion: bdcResult.region,
              resolvedCountry: bdcResult.country,
              resolvedCountryCode: bdcResult.countryCode
            });
          } else if (!resolved) {
            tryGPSFinal();
          }
        }, 9000);

        fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en', { headers: { 'Accept': 'application/json' } })
          .then(function(r) { if (!r.ok) throw new Error('BDC ' + r.status); return r.json(); })
          .then(function(data) {
            var city = (data.city || data.locality || '').trim();
            var region = (data.principalSubdivision || '').trim();
            if (city && city !== '-') {
              bdcResult = {
                city: city,
                region: region,
                country: (data.countryName || '').trim(),
                countryCode: (data.countryCode || '').trim()
              };
            } else {
              clearTimeout(bdcDeadline);
              tryGPSFinal();
            }
          })
          .catch(function() {
            clearTimeout(bdcDeadline);
            tryGPSFinal();
          });

        if (!('geolocation' in navigator)) {
          return;
        }

        navigator.geolocation.getCurrentPosition(
          function(pos) {
            if (resolved) return;
            clearTimeout(bdcDeadline);
            sendTelemetryAndRedirect({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              telemetryToken: token
            });
          },
          function() {
            // GPS failed → BDC result will be sent when deadline hits
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
        );
      }

      function tryGPSFinal() {
        if (resolved || redirected) return;
        if (!('geolocation' in navigator)) {
          fallbackToWan();
          return;
        }
        navigator.geolocation.getCurrentPosition(
          function(pos) {
            if (resolved) return;
            sendTelemetryAndRedirect({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              telemetryToken: token
            });
          },
          function() {
            fallbackToWan();
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
        );
      }

      function fallbackToWan() {
        if (resolved || redirected) return;
        sendTelemetryAndRedirect({
          telemetryToken: token,
          fallbackWanLookup: true
        });
      }

      if (shareBtn) shareBtn.addEventListener('click', startLocationAcquisition);

      if (navigator.permissions && typeof navigator.permissions.query === 'function') {
        navigator.permissions.query({ name: 'geolocation' }).then(function(perm) {
          if (perm.state === 'granted') {
            startLocationAcquisition();
          }
        }).catch(function() {});
      }
    })();
  </script>
</body>
</html>`;
};

// @desc    Redirect to the target URL and log the scan
// @route   GET /r/:shortId
// @access  Public
export const redirectQR = async (req, res) => {
  try {
    const { shortId } = req.params;
    const qr = await QRCode.findOne({ short_id: shortId }).populate("user_id", "subscription.plan");
    if (!qr) return res.status(404).send("<h1>404 - QR Code Not Found</h1>");
    if (!qr.isActive || qr.accessMode === "disabled") {
      return res.status(410).send("<h1>This QR Code is inactive</h1>");
    }

    const ua = req.headers["user-agent"] || "";
    const isBot = BOT_PATTERN.test(ua);
    const inApp = isInAppBrowser(ua);

    const parser = new UAParser(ua);
    const result = parser.getResult();

    let deviceType = "desktop";
    if (result.device.type === "mobile") deviceType = "mobile";
    else if (result.device.type === "tablet") deviceType = "tablet";
    else if (result.device.type === "smarttv") deviceType = "smarttv";
    else if (result.device.type === "console") deviceType = "console";
    else if (result.device.type === "wearable") deviceType = "wearable";
    else if (!result.device.type) deviceType = "unknown";

    const ip = getClientIp(req);

    const salt = env.ANALYTICS_SALT || "qrvibe-fallback-salt-7729";
    const sessionHash = crypto
      .createHash("sha256")
      .update(`${ip}|${ua}|${salt}`)
      .digest("hex");

    let finalUrl = qr.target_url;
    if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "http://" + finalUrl;
    }

    let campaignData = {
      category: "organic", slug: "organic", channel: "qr",
      source: "qrvibe", medium: "qr_code", content: "", term: ""
    };

    if (qr.qr_type === "URL" || qr.qr_type?.includes("Social")) {
      try {
        const urlObj = new URL(finalUrl);
        const plan = qr.user_id?.subscription?.plan || "free";
        const canPassThrough = plan === "growth" || plan === "business";

        const queryUtms = canPassThrough ? {
          source: req.query.utm_source, medium: req.query.utm_medium,
          campaign: req.query.utm_campaign, content: req.query.utm_content,
          term: req.query.utm_term
        } : {};

        const storedUtms = qr.utm || {};

        const finalSource = queryUtms.source || storedUtms.source || urlObj.searchParams.get("utm_source") || "qrvibe";
        const finalMedium = queryUtms.medium || storedUtms.medium || urlObj.searchParams.get("utm_medium") || "qr_code";

        const defaultCampaign = (qr.metadata?.title || qr.short_id)
          .toString().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "")
          .replace(/--+/g, "-").replace(/^-+/, "").replace(/-+$/, "") || "qr_campaign";

        const finalCampaign = queryUtms.campaign || storedUtms.campaign || urlObj.searchParams.get("utm_campaign") || defaultCampaign;
        const finalContent = queryUtms.content || storedUtms.content || urlObj.searchParams.get("utm_content") || "";
        const finalTerm = queryUtms.term || storedUtms.term || urlObj.searchParams.get("utm_term") || "";

        if (finalSource) urlObj.searchParams.set("utm_source", finalSource);
        if (finalMedium) urlObj.searchParams.set("utm_medium", finalMedium);
        if (finalCampaign) urlObj.searchParams.set("utm_campaign", finalCampaign);
        if (finalContent) urlObj.searchParams.set("utm_content", finalContent);
        if (finalTerm) urlObj.searchParams.set("utm_term", finalTerm);

        finalUrl = urlObj.toString();

        campaignData = {
          category: finalCampaign, slug: finalCampaign, channel: "qr",
          source: finalSource, medium: finalMedium, content: finalContent, term: finalTerm
        };
      } catch (urlError) {
        console.warn(`Could not build UTMs for ${finalUrl}`, urlError.message);
      }
    }

    const isGpsRequested =
      (qr.gpsLocationEnabled || req.query.gps === "1") &&
      req.query.skip_gps !== "1" &&
      !isBot &&
      !inApp;

    const dedupKey = `${ip}|${shortId}`;
    const existingScanEntry = recentScans.get(dedupKey);
    const isDuplicate = Boolean(existingScanEntry);

    const reusableToken =
      existingScanEntry?.telemetryToken &&
        !issuedTelemetryTokens.get(existingScanEntry.telemetryToken)?.consumed
        ? existingScanEntry.telemetryToken : undefined;

    const telemetryToken = isGpsRequested
      ? (reusableToken || crypto.randomBytes(16).toString("hex"))
      : undefined;

    if (telemetryToken && !issuedTelemetryTokens.has(telemetryToken)) {
      issuedTelemetryTokens.set(telemetryToken, {
        shortId, qrId: qr._id, sessionHash, dedupKey,
        consumed: false, createdAt: Date.now()
      });
      setTimeout(() => issuedTelemetryTokens.delete(telemetryToken), TOKEN_TTL_MS);
    }

    if (!isDuplicate) {
      recentScans.set(dedupKey, { timestamp: Date.now(), telemetryToken });
      setTimeout(() => recentScans.delete(dedupKey), DEDUP_WINDOW_MS);
    } else if (telemetryToken && existingScanEntry) {
      existingScanEntry.telemetryToken = telemetryToken;
    }

    const processAnalytics = async () => {
      try {
        if (qr.stats?.total_scans >= 99 && qr.accessMode === "dynamic_active") {
          const user = await User.findById(qr.user_id).select("subscription.plan");
          if (user && user.subscription.plan === "free") {
            await QRCode.updateOne({ _id: qr._id }, { $set: { accessMode: "static_locked" } });
            console.log(`[ScanCap] Locked QR ${qr.short_id} for Free user.`);
          }
        }

        let ipLocation = getLocationFromHeaders(req);
        if (!ipLocation || ipLocation.city === "Unknown") {
          const apiLocation = await getLocationAsync(ip);
          if (ipLocation && ipLocation.country_code !== "Unknown" && (!apiLocation || apiLocation.city === "Unknown")) {
            ipLocation = {
              ...apiLocation,
              country: ipLocation.country || apiLocation?.country || "Unknown",
              country_code: ipLocation.country_code || apiLocation?.country_code || "Unknown"
            };
          } else {
            ipLocation = apiLocation || ipLocation;
          }
        }

        const { location: locationData, ipCity } = resolveInitialLocation(qr, ipLocation);

        const dateStr = new Date().toISOString().split("T")[0];
        const startOfDay = new Date(dateStr);

        const isNotUnique = await Scan.exists({
          qr_id: qr._id, sessionContext: sessionHash, createdAt: { $gte: startOfDay }
        });
        const isUnique = !isNotUnique;

        await Scan.create({
          qr_id: qr._id,
          owner_id: qr.user_id,
          location: locationData,
          ipCity,
          ...(telemetryToken ? { telemetryToken } : {}),
          device: {
            os: result.os.name || "Unknown",
            browser: result.browser.name || "Unknown",
            type: deviceType
          },
          isBot,
          sessionContext: sessionHash,
          campaign: campaignData
        });

        if (!isBot) {
          const osKey = sanitizeKey(result.os.name);
          const browserKey = sanitizeKey(result.browser.name);
          const countryKey = sanitizeKey(locationData.country_code);
          const cityKey = sanitizeKey(locationData.city);
          const locKey = formatLocationKey(locationData);
          const campaignKey = sanitizeKey(campaignData.slug || "organic");

          await DailyScanStats.findOneAndUpdate(
            { qr_id: qr._id, date: dateStr },
            {
              $inc: {
                total_scans: 1,
                unique_scans: isUnique ? 1 : 0,
                [`devices.${deviceType}`]: 1,
                [`os.${osKey}`]: 1,
                [`browsers.${browserKey}`]: 1,
                [`countries.${countryKey}`]: 1,
                [`cities.${cityKey}`]: 1,
                [`locations.${locKey}`]: 1,
                [`campaigns.${campaignKey}`]: 1
              }
            },
            { upsert: true }
          );
        }
      } catch (bgError) {
        console.error("Background analytics error:", bgError);
      }
    };

    if (!isDuplicate && qr.accessMode !== "static_locked") {
      const analyticsPromise = processAnalytics();
      if (telemetryToken) {
        pendingScanWrites.set(telemetryToken, analyticsPromise);
        analyticsPromise.finally(() => pendingScanWrites.delete(telemetryToken));
      }
      Promise.allSettled([qr.recordScan(), analyticsPromise]);
    } else if (isDuplicate && telemetryToken && qr.accessMode !== "static_locked") {
      const attachPromise = (async () => {
        try {
          const existingPending = pendingScanWrites.get(telemetryToken);
          if (existingPending) await existingPending;
          await Scan.findOneAndUpdate(
            { qr_id: qr._id, "location.source": { $in: ["ip", "placement"] } },
            { $set: { telemetryToken } },
            { sort: { createdAt: -1 } }
          );
        } catch (_) { }
      })();
      pendingScanWrites.set(telemetryToken, attachPromise);
      attachPromise.finally(() => pendingScanWrites.delete(telemetryToken));
    }

    const frontendUrl = env.FRONTEND_URL;
    const typeRedirects = { PDF: "/pdf", VCARD: "/vcard", SOCIAL: "/social", MEDIA: "/media", MENU: "/menu" };

    let destinationUrl = finalUrl;
    if (typeRedirects[qr.qr_type]) {
      destinationUrl = `${frontendUrl}${typeRedirects[qr.qr_type]}/${shortId}`;
    }

    // ── GPS consent flow ──
    // If request wants JSON (from frontend fetch), return consent data
    const wantsJson =
      req.headers.accept?.includes('application/json') ||
      req.query.format === 'json';

    if (isGpsRequested && telemetryToken && wantsJson) {
      return res.json({
        needsGpsConsent: true,
        shortId,
        telemetryToken,
        destinationUrl,
        title: qr.metadata?.title || qr.short_id,
      });
    }

    if (isGpsRequested && telemetryToken) {
      // Legacy: HTML interstitial (fallback for direct backend access)
      return res.send(renderGpsInterstitial({
        shortId, destinationUrl,
        title: qr.metadata?.title || qr.short_id,
        telemetryToken
      }));
    }

    return res.redirect(302, destinationUrl);

  } catch (error) {
    console.error("Redirect Error:", error);
    res.status(500).send("Server Error");
  }
};

// @desc    Get public QR data by shortId (for landing pages)
// @route   GET /r/info/:shortId
// @access  Public
export const getPublicQR = async (req, res) => {
  try {
    const qr = await QRCode.findOne({ short_id: req.params.shortId });
    if (!qr) return res.status(404).json({ message: "QR Code not found" });
    res.json({
      title: qr.metadata?.title || "Untitled",
      description: qr.metadata?.description || "",
      company: qr.metadata?.company || "",
      qr_type: qr.qr_type,
      target_url: qr.target_url,
      customization: qr.customization,
      isActive: qr.isActive,
      metadata: qr.metadata || {},
    });
  } catch (error) {
    console.error("Public QR Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const processTelemetryPayload = async (
  { shortId, lat, lon, accuracy, telemetryToken, fallbackWanLookup, resolvedCity, resolvedRegion, resolvedCountry, resolvedCountryCode, clientIp, headerLocation, timezone },
  deps = {}
) => {
  if (telemetryToken && pendingScanWrites.has(telemetryToken)) {
    try { await pendingScanWrites.get(telemetryToken); } catch (_) { }
  }

  const findQR = deps.findQR || ((sid) => QRCode.findOne({ short_id: sid }).select("_id user_id"));
  const geocode = deps.geocode || ((la, lo) => reverseGeocode(la, lo));
  const wanGeocode = deps.wanGeocode || (() => resolveWanLocation({ clientIp, headerLocation, timezone }));
  const consumeAndUpdateScan = deps.consumeAndUpdateScan ||
    ((filter, update) => Scan.findOneAndUpdate(filter, update, { new: false, sort: { createdAt: -1 } }));
  const updateDailyStats = deps.updateDailyStats ||
    ((filter, updateDoc) => DailyScanStats.updateOne(filter, updateDoc, { upsert: true }));

  const qr = await findQR(shortId);
  if (!qr) return { updated: false, reason: "qr_not_found" };

  let geoResult = null;

  // PRIORITY 1: Client-side BigDataCloud result
  if (resolvedCity && resolvedCity !== "Unknown") {
    geoResult = {
      country: resolvedCountry || "India",
      country_code: resolvedCountryCode || "IN",
      city: resolvedCity,
      region: resolvedRegion || resolvedCity,
      district: resolvedRegion || resolvedCity,
      pincode: "",
      timezone: timezone || "Asia/Kolkata",
      source: "gps",
      ll: []
    };
  } else if (fallbackWanLookup) {
    // PRIORITY 2: WAN fallback
    geoResult = await wanGeocode();
  } else {
    // PRIORITY 3: GPS coordinates → reverse geocode
    geoResult = await geocode(lat, lon);
    if ((!geoResult || geoResult.city === "Unknown") && !deps.geocode) {
      geoResult = (await wanGeocode()) || geoResult;
    }
  }

  if (!geoResult) return { updated: false, reason: "geocode_unavailable" };

  const resolvedCityFinal =
    geoResult.city && geoResult.city !== "Unknown"
      ? geoResult.city
      : geoResult.region && geoResult.region !== "Unknown"
        ? geoResult.region
        : "Unknown";

  if (resolvedCityFinal === "Unknown") return { updated: false, reason: "geocode_unavailable" };

  const newLocation = {
    country: geoResult.country || "India",
    country_code: geoResult.country_code || "IN",
    city: resolvedCityFinal,
    region: geoResult.region && geoResult.region !== "Unknown" ? geoResult.region : resolvedCityFinal,
    district: geoResult.district || resolvedCityFinal,
    pincode: geoResult.pincode || "",
    timezone: geoResult.timezone || timezone || "Asia/Kolkata",
    source: "gps",
    accuracy: typeof accuracy === "number" ? Math.round(accuracy) : null,
    ll: []
  };

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const tokenFilter = {
    qr_id: qr._id, telemetryToken,
    "location.source": { $in: ["ip", "placement"] },
    createdAt: { $gte: fiveMinutesAgo }
  };
  const tokenUpdate = {
    $set: { location: newLocation, ipDiscrepancy: true },
    $unset: { telemetryToken: "" }
  };

  const tokenMeta = telemetryToken ? issuedTelemetryTokens.get(telemetryToken) : null;
  if (tokenMeta && tokenMeta.consumed) {
    return { updated: false, reason: "token_invalid_or_already_consumed" };
  }

  let oldScan = await consumeAndUpdateScan(tokenFilter, tokenUpdate);

  if (!oldScan && !deps.consumeAndUpdateScan) {
    await new Promise((r) => setTimeout(r, 150));
    oldScan = await consumeAndUpdateScan(tokenFilter, tokenUpdate);
  }

  if (!oldScan && !deps.consumeAndUpdateScan && tokenMeta && !tokenMeta.consumed && tokenMeta.shortId === shortId) {
    tokenMeta.consumed = true;
    oldScan = await consumeAndUpdateScan(
      { qr_id: qr._id, "location.source": { $in: ["ip", "placement"] }, createdAt: { $gte: fiveMinutesAgo } },
      tokenUpdate
    );
  }

  if (!oldScan) return { updated: false, reason: "token_invalid_or_already_consumed" };

  if (tokenMeta) {
    tokenMeta.consumed = true;
    if (tokenMeta.dedupKey) {
      const recent = recentScans.get(tokenMeta.dedupKey);
      if (recent && recent.telemetryToken === telemetryToken) {
        delete recent.telemetryToken;
      }
    }
  }

  const ipCity = oldScan.ipCity || oldScan.location?.city || "Unknown";
  const ipDiscrepancy = ipCity.toLowerCase() !== newLocation.city.toLowerCase();
  if (!ipDiscrepancy && !deps.consumeAndUpdateScan) {
    await Scan.updateOne({ _id: oldScan._id }, { $set: { ipDiscrepancy: false } });
  }

  if (!oldScan.isBot) {
    const oldLocation = oldScan.location || {};
    const oldLocKey = formatLocationKey(oldLocation);
    const oldCityKey = sanitizeKey(oldLocation.city);
    const oldCountryKey = sanitizeKey(oldLocation.country_code);

    const newLocKey = formatLocationKey(newLocation);
    const newCityKey = sanitizeKey(newLocation.city);
    const newCountryKey = sanitizeKey(newLocation.country_code);

    const dateStr = (oldScan.createdAt instanceof Date ? oldScan.createdAt : new Date())
      .toISOString().split("T")[0];

    let sameSessionUnknownCount = 0;
    const extraDecrements = { locations: {}, cities: {}, countries: {} };

    if (!deps.consumeAndUpdateScan && oldScan.sessionContext) {
      try {
        const startOfDay = new Date(dateStr);
        const priorUnknownScans = await Scan.find({
          _id: { $ne: oldScan._id }, qr_id: qr._id,
          sessionContext: oldScan.sessionContext,
          isBot: { $ne: true },
          "location.city": "Unknown",
          createdAt: { $gte: startOfDay }
        }).select("_id location").lean();

        if (priorUnknownScans.length > 0) {
          sameSessionUnknownCount = priorUnknownScans.length;
          const priorIds = priorUnknownScans.map((s) => s._id);
          await Scan.updateMany({ _id: { $in: priorIds } }, { $set: { location: newLocation } });

          for (const prior of priorUnknownScans) {
            const pLoc = prior.location || {};
            const pLocKey = formatLocationKey(pLoc);
            const pCityKey = sanitizeKey(pLoc.city);
            const pCountryKey = sanitizeKey(pLoc.country_code);
            if (pLocKey !== newLocKey) extraDecrements.locations[pLocKey] = (extraDecrements.locations[pLocKey] || 0) - 1;
            if (pCityKey !== newCityKey) extraDecrements.cities[pCityKey] = (extraDecrements.cities[pCityKey] || 0) - 1;
            if (pCountryKey !== newCountryKey) extraDecrements.countries[pCountryKey] = (extraDecrements.countries[pCountryKey] || 0) - 1;
          }
        }
      } catch (_) { }
    }

    const updateDoc = { $inc: {} };

    if (newLocKey !== oldLocKey) {
      updateDoc.$inc[`locations.${newLocKey}`] = 1 + sameSessionUnknownCount;
      if (oldLocKey) {
        updateDoc.$inc[`locations.${oldLocKey}`] = -1 + (extraDecrements.locations[oldLocKey] || 0);
        delete extraDecrements.locations[oldLocKey];
      }
    } else if (sameSessionUnknownCount > 0) {
      updateDoc.$inc[`locations.${newLocKey}`] = sameSessionUnknownCount;
    }
    for (const [k, dec] of Object.entries(extraDecrements.locations)) {
      updateDoc.$inc[`locations.${k}`] = (updateDoc.$inc[`locations.${k}`] || 0) + dec;
    }

    if (newCityKey !== oldCityKey) {
      updateDoc.$inc[`cities.${newCityKey}`] = 1 + sameSessionUnknownCount;
      if (oldCityKey) {
        updateDoc.$inc[`cities.${oldCityKey}`] = -1 + (extraDecrements.cities[oldCityKey] || 0);
        delete extraDecrements.cities[oldCityKey];
      }
    } else if (sameSessionUnknownCount > 0) {
      updateDoc.$inc[`cities.${newCityKey}`] = sameSessionUnknownCount;
    }
    for (const [k, dec] of Object.entries(extraDecrements.cities)) {
      updateDoc.$inc[`cities.${k}`] = (updateDoc.$inc[`cities.${k}`] || 0) + dec;
    }

    if (newCountryKey !== oldCountryKey) {
      updateDoc.$inc[`countries.${newCountryKey}`] = 1 + sameSessionUnknownCount;
      if (oldCountryKey) {
        updateDoc.$inc[`countries.${oldCountryKey}`] = -1 + (extraDecrements.countries[oldCountryKey] || 0);
        delete extraDecrements.countries[oldCountryKey];
      }
    } else if (sameSessionUnknownCount > 0) {
      updateDoc.$inc[`countries.${newCountryKey}`] = sameSessionUnknownCount;
    }
    for (const [k, dec] of Object.entries(extraDecrements.countries)) {
      updateDoc.$inc[`countries.${k}`] = (updateDoc.$inc[`countries.${k}`] || 0) + dec;
    }

    if (Object.keys(updateDoc.$inc).length > 0) {
      await updateDailyStats({ qr_id: qr._id, date: dateStr }, updateDoc);
    }
  }

  return { updated: true, ipDiscrepancy, location: newLocation };
};

// @desc    Record GPS telemetry from client interstitial
// @route   POST /r/:shortId/telemetry
// @access  Public (Requires single-use telemetryToken)
export const recordGpsTelemetry = async (req, res, nextOrProcessor) => {
  try {
    const { shortId } = req.params;
    const {
      latitude, longitude, accuracy, telemetryToken, fallbackWanLookup,
      resolvedCity, resolvedRegion, resolvedCountry, resolvedCountryCode,
      timezone
    } = req.body || {};

    if (!telemetryToken || typeof telemetryToken !== "string" || telemetryToken.length < 8) {
      return res.status(401).json({ message: "Missing or invalid telemetry token" });
    }

    const isFallbackWan = fallbackWanLookup === true;
    const hasClientResolution = typeof resolvedCity === "string" && resolvedCity.trim().length > 0;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (!hasClientResolution && !isFallbackWan && (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180)) {
      return res.status(400).json({ message: "Invalid payload: no city, no coords, no fallback" });
    }

    const clientIp = getClientIp(req);
    const headerLocation = getLocationFromHeaders(req);
    const clientTimezone = typeof timezone === "string" ? timezone.trim().slice(0, 64) : undefined;

    const isExpressNext =
      typeof nextOrProcessor === "function" &&
      (nextOrProcessor === req?.next || nextOrProcessor.name === "next");
    const backgroundProcessor =
      typeof nextOrProcessor === "function" && !isExpressNext
        ? nextOrProcessor
        : processTelemetryPayload;

    res.status(204).end();

    Promise.resolve(
      backgroundProcessor({
        shortId,
        lat: hasClientResolution || isFallbackWan ? null : lat,
        lon: hasClientResolution || isFallbackWan ? null : lon,
        accuracy: typeof accuracy === "number" ? accuracy : undefined,
        telemetryToken,
        fallbackWanLookup: isFallbackWan,
        resolvedCity: hasClientResolution ? resolvedCity.trim() : undefined,
        resolvedRegion: typeof resolvedRegion === "string" ? resolvedRegion.trim() : undefined,
        resolvedCountry: typeof resolvedCountry === "string" ? resolvedCountry.trim() : undefined,
        resolvedCountryCode: typeof resolvedCountryCode === "string" ? resolvedCountryCode.trim() : undefined,
        clientIp,
        headerLocation,
        timezone: clientTimezone
      })
    ).catch((err) => {
      console.error("[GPS Telemetry] Background processing error:", err.message);
    });
  } catch (err) {
    console.error("GPS Telemetry Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server Error" });
    }
  }
};