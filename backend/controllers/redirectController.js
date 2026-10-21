import { QRCode } from "../models/QRCode.js";
import { Scan } from "../models/Scan.js";
import { DailyScanStats } from "../models/DailyScanStats.js";
import { User } from "../models/User.js";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import mongoose from "mongoose";
import { getClientIp, getLocationAsync, getLocationFromHeaders, resolveIpGeo } from "../services/Geolocation.js";
import { reverseGeocode, resolveWanLocation } from "../services/ReverseGeocode.js";
import { env } from "../config/env.js";

// ── Bot signatures to filter out from analytics ──
const BOT_PATTERN = /whatsapp|slack|telegram|bot|crawler|spider|crawl|preview|fetch|headless|lighthouse/i;

// ── In-App WebViews that suppress or break geolocation permission prompts (Fix 3.9) ──
const IN_APP_BROWSER_PATTERN = /Instagram|FBAN|FBAV|WhatsApp|Snapchat|Line\/|LinkedInApp|wv\)|WebView/i;

export const isInAppBrowser = (ua) => {
    if (!ua || typeof ua !== "string") return false;
    return IN_APP_BROWSER_PATTERN.test(ua);
};

const sanitizeKey = (str) => {
    if (!str) return "unknown";
    return String(str).replace(/[.$]/g, "_").toLowerCase().trim();
};

const formatLocationKey = (loc) => {
    const city = String(loc?.city || "Unknown").replace(/[.$]/g, "_").trim();
    const region = String(loc?.region || "Unknown").replace(/[.$]/g, "_").trim();
    const code = String(loc?.country_code || "Unknown").replace(/[.$]/g, "_").trim();
    const name = String(loc?.country || "Unknown").replace(/[.$]/g, "_").trim();
    return `${city}::${region}::${code}::${name}`;
};

/**
 * Resolves initial scan location using hierarchy: QR Placement Metadata > Coarse IP.
 * Preserves ipCity for discrepancy telemetry when GPS enrichment arrives.
 */
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
                accuracy: 0,
                ll: []
            },
            ipCity,
            confidence: "HIGH"
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
            accuracy: ipLocation?.accuracyRadius ?? 999,
            ll: []
        },
        ipCity,
        confidence: ipLocation?.confidence || "MEDIUM"
    };
};

// ── Scan Deduplication Cache, Pending Scan Write Tracker & Issued Token Registry ──
// Prevents Chrome's speculative preload from registering double scans while preserving telemetryToken & scanId binding.
// Key: "ip|shortId", auto-expires after 5 seconds.
const recentScans = new Map();
const pendingScanWrites = new Map();
const issuedTelemetryTokens = new Map();
const DEDUP_WINDOW_MS = 5000;
const TOKEN_TTL_MS = 5 * 60 * 1000;

// ── Architecture D: Zero-Prompt Inline Micro-Bridge Template (~900 bytes, <15ms client execution) ──
export const renderMicroBridgeHtml = ({ shortId, destinationUrl, scanId, telemetryToken }) => {
    const safeUrl = JSON.stringify(destinationUrl);
    const safeShortId = encodeURIComponent(shortId);
    const safeScanId = String(scanId || "").replace(/"/g, "");
    const safeToken = String(telemetryToken || "").replace(/"/g, "");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Connecting...</title>
<script>
(function(){
  try {
    var conn = navigator.connection || {};
    var payload = JSON.stringify({
      scanId: "${safeScanId}",
      telemetryToken: "${safeToken}",
      tz: (Intl && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone || "" : "",
      lang: (navigator.languages && navigator.languages[0]) || navigator.language || "",
      net: conn.effectiveType || "",
      rtt: conn.rtt || 0
    });
    var url = "/r/${safeShortId}/telemetry";
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], {type: "application/json"}));
    } else if (typeof fetch === "function") {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true
      }).catch(function(){});
    }
  } catch(e){}
  window.location.replace(${safeUrl});
})();
</script>
<noscript><meta http-equiv="refresh" content="0;url=${destinationUrl}"></noscript>
</head><body style="background:#0b0f19;"></body></html>`;
};

// ── DPDP-Compliant Tap-to-Consent GPS Interstitial Template (Fixes 3.1, 3.2, 3.9, 3.10) ──
export const renderGpsInterstitial = ({ shortId, destinationUrl, title, telemetryToken, scanId }) => {
    const safeTitle = (title || "Redirecting...").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeDest = destinationUrl.replace(/"/g, "&quot;");
    const safeToken = String(telemetryToken || "").replace(/"/g, "");
    const safeScanId = String(scanId || "").replace(/"/g, "");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} | Connecting...</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(22, 29, 47, 0.85);
      --border: rgba(255, 255, 255, 0.1);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #5B3FF4;
      --primary-hover: #4f35d8;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f8fafc;
        --card-bg: #ffffff;
        --border: #e2e8f0;
        --text: #0f172a;
        --text-muted: #475569;
        --primary: #5B3FF4;
        --primary-hover: #432ad0;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 2rem 1.75rem;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.2);
    }
    .icon-box {
      width: 56px;
      height: 56px;
      margin: 0 auto 1.25rem auto;
      border-radius: 50%;
      background: rgba(91, 63, 244, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
    }
    .icon-box svg {
      width: 28px;
      height: 28px;
    }
    h1 {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .btn-primary {
      background: var(--primary);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-primary:hover {
      background: var(--primary-hover);
    }
    .btn-secondary {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.65rem 1rem;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
    }
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
      var scanId = "${safeScanId}";
      var redirected = false;
      var acquisitionStarted = false;
      var permState = "prompt";

      function redirectNow() {
        if (redirected) return;
        redirected = true;
        window.location.replace(dest);
      }

      // Feature-detect geolocation immediately (Fix 3.9)
      if (!("geolocation" in navigator)) {
        redirectNow();
        return;
      }

      var skip = document.getElementById('skipLink');
      if (skip) {
        skip.addEventListener('click', function(e) {
          e.preventDefault();
          redirectNow();
        });
      }

      // Auto-continue if untouched after 15s (gives user time to read DPDP notice)
      var idleTimer = setTimeout(redirectNow, 15000);

      function sendTelemetryAndRedirect(bodyObj) {
        try {
          if (scanId && !bodyObj.scanId) bodyObj.scanId = scanId;
          try {
            var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz) bodyObj.timezone = tz;
          } catch (_) {}
          var payload = JSON.stringify(bodyObj);
          var url = '/r/' + encodeURIComponent(shortId) + '/telemetry';
          var safetyTimer = setTimeout(redirectNow, 1500);
          if (typeof window.fetch === 'function') {
            fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              keepalive: true,
              body: payload
            }).then(function() {
              clearTimeout(safetyTimer);
              redirectNow();
            }).catch(function() {
              clearTimeout(safetyTimer);
              if (navigator.sendBeacon) {
                try {
                  var blob = new Blob([payload], { type: 'application/json' });
                  navigator.sendBeacon(url, blob);
                } catch (_) {}
              }
              redirectNow();
            });
          } else if (navigator.sendBeacon) {
            var blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
            clearTimeout(safetyTimer);
            redirectNow();
          } else {
            clearTimeout(safetyTimer);
            redirectNow();
          }
        } catch (err) {
          redirectNow();
        }
      }

      var shareBtn = document.getElementById('shareBtn');

      function startLocationAcquisition() {
        if (acquisitionStarted || redirected) return;
        acquisitionStarted = true;
        clearTimeout(idleTimer);
        if (shareBtn) {
          shareBtn.textContent = "Connecting...";
          shareBtn.disabled = true;
        }

        // If running on non-HTTPS LAN IP where browsers block navigator.geolocation,
        // still honor the user's explicit consent via WAN/IP fallback.
        if (window.isSecureContext === false) {
          sendTelemetryAndRedirect({
            scanId: scanId,
            telemetryToken: token,
            fallbackWanLookup: true
          });
          return;
        }

        // Allow 15s ceiling for permission prompt + OS location acquisition
        var geoTimer = setTimeout(redirectNow, 15000);

        if (navigator.permissions && typeof navigator.permissions.query === 'function') {
          navigator.permissions.query({ name: 'geolocation' }).then(function(perm) {
            permState = perm.state || permState;
            perm.onchange = function() {
              permState = perm.state || permState;
              if (perm.state === 'denied') {
                clearTimeout(geoTimer);
                redirectNow();
              } else if (perm.state === 'granted') {
                clearTimeout(geoTimer);
                geoTimer = setTimeout(redirectNow, 10000);
              }
            };
          }).catch(function() {});
        }

        function onGeoSuccess(pos) {
          clearTimeout(geoTimer);
          sendTelemetryAndRedirect({
            scanId: scanId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            telemetryToken: token
          });
        }

        // Start with fast Wi-Fi/cell triangulation (3.5s)
        navigator.geolocation.getCurrentPosition(
          onGeoSuccess,
          function(err) {
            if (err && err.code === 1 && permState === 'denied') {
              clearTimeout(geoTimer);
              redirectNow();
              return;
            }
            // Retry with high-accuracy fix (5s for satellite lock), then WAN fallback.
            navigator.geolocation.getCurrentPosition(
              onGeoSuccess,
              function() {
                clearTimeout(geoTimer);
                sendTelemetryAndRedirect({
                  scanId: scanId,
                  telemetryToken: token,
                  fallbackWanLookup: true
                });
              },
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
          },
          { enableHighAccuracy: false, timeout: 3500, maximumAge: 30000 }
        );
      }

      if (shareBtn) {
        shareBtn.addEventListener('click', startLocationAcquisition);
      }

      // If the user has already granted geolocation permission on this origin, acquire immediately
      if (navigator.permissions && typeof navigator.permissions.query === 'function') {
        navigator.permissions.query({ name: 'geolocation' }).then(function(perm) {
          permState = perm.state || permState;
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
        // 1. Find the QR Code by shortId and populate user to check plan
        const qr = await QRCode.findOne({ short_id: shortId }).populate("user_id", "subscription.plan");
        if (!qr) return res.status(404).send("<h1>404 - QR Code Not Found</h1>");
        if (!qr.isActive || qr.accessMode === "disabled") {
            return res.status(410).send("<h1>This QR Code is inactive</h1>");
        }

        // 2. Parse User-Agent — safe fallback to empty string
        const ua = req.headers["user-agent"] || "";
        const isBot = BOT_PATTERN.test(ua);

        const parser = new UAParser(ua);
        const result = parser.getResult();

        let deviceType = "desktop";
        if (result.device.type === "mobile") deviceType = "mobile";
        else if (result.device.type === "tablet") deviceType = "tablet";
        else if (result.device.type === "smarttv") deviceType = "smarttv";
        else if (result.device.type === "console") deviceType = "console";
        else if (result.device.type === "wearable") deviceType = "wearable";
        else if (!result.device.type) deviceType = "unknown";

        // 3. Extract client IP & Confidence-Tiered GeoIP (synchronous — needed for session hash & adaptive routing)
        const ip = getClientIp(req);
        const geo = resolveIpGeo(ip, req.headers);

        // Pre-allocate Scan _id in memory (0ms I/O) so telemetry can reference it precisely
        const dedupKey = `${ip}|${shortId}`;
        const existingScanEntry = recentScans.get(dedupKey);
        const isDuplicate = Boolean(existingScanEntry);

        const scanId = existingScanEntry?.scanId || new mongoose.Types.ObjectId();
        const dateStr = new Date().toISOString().split("T")[0];

        // 4. Session hash for unique-scanner tracking (DPDP Compliant)
        const salt = env.ANALYTICS_SALT || "qrvibe-fallback-salt-7729";
        const sessionHash = crypto
            .createHash("sha256")
            .update(`${ip}|${ua}|${salt}`)
            .digest("hex");

        // 5. Auto UTM Builder & Campaign Extraction
        let finalUrl = qr.target_url;
        if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
            finalUrl = "http://" + finalUrl;
        }

        let campaignData = {
            category: "organic",
            slug: "organic",
            channel: "qr",
            source: "qrvibe",
            medium: "qr_code",
            content: "",
            term: ""
        };

        if (qr.qr_type === "URL" || qr.qr_type?.includes("Social")) {
            try {
                const urlObj = new URL(finalUrl);
                const plan = qr.user_id?.subscription?.plan || "free";
                const canPassThrough = plan === "growth" || plan === "business";

                const queryUtms = canPassThrough ? {
                    source: req.query.utm_source,
                    medium: req.query.utm_medium,
                    campaign: req.query.utm_campaign,
                    content: req.query.utm_content,
                    term: req.query.utm_term
                } : {};

                const storedUtms = qr.utm || {};

                const finalSource = queryUtms.source || storedUtms.source || urlObj.searchParams.get("utm_source") || "qrvibe";
                const finalMedium = queryUtms.medium || storedUtms.medium || urlObj.searchParams.get("utm_medium") || "qr_code";

                const defaultCampaign = (qr.metadata?.title || qr.short_id)
                    .toString().toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^\w-]+/g, "")
                    .replace(/--+/g, "-")
                    .replace(/^-+/, "")
                    .replace(/-+$/, "") || "qr_campaign";

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
                    category: finalCampaign,
                    slug: finalCampaign,
                    channel: "qr",
                    source: finalSource,
                    medium: finalMedium,
                    content: finalContent,
                    term: finalTerm
                };
            } catch (urlError) {
                console.warn(`Could not build/extract UTMs for ${finalUrl}`, urlError.message);
            }
        }

        // Determine whether GPS interstitial should be served (skip bots and in-app webviews)
        const isGpsRequested =
            (qr.gpsLocationEnabled || req.query.gps === "1") &&
            req.query.skip_gps !== "1" &&
            !isBot &&
            !isInAppBrowser(ua);

        // Deduplication check with telemetryToken & scanId preservation
        const reusableToken =
            existingScanEntry?.telemetryToken &&
            !issuedTelemetryTokens.get(existingScanEntry.telemetryToken)?.consumed
                ? existingScanEntry.telemetryToken
                : undefined;

        // Generate telemetryToken if GPS is requested OR if micro-bridge telemetry will fire (confidence !== HIGH)
        const effectiveConfidence = qr.placement?.city ? "HIGH" : geo.confidence;
        const needsTelemetry = isGpsRequested || (effectiveConfidence !== "HIGH");

        const telemetryToken = needsTelemetry
            ? (reusableToken || crypto.randomBytes(16).toString("hex"))
            : undefined;

        if (telemetryToken && !issuedTelemetryTokens.has(telemetryToken)) {
            issuedTelemetryTokens.set(telemetryToken, {
                shortId,
                qrId: qr._id,
                sessionHash,
                dedupKey,
                scanId,
                consumed: false,
                createdAt: Date.now()
            });
            setTimeout(() => issuedTelemetryTokens.delete(telemetryToken), TOKEN_TTL_MS);
        }

        if (!isDuplicate) {
            recentScans.set(dedupKey, { timestamp: Date.now(), telemetryToken, scanId });
            setTimeout(() => recentScans.delete(dedupKey), DEDUP_WINDOW_MS);
        } else {
            if (telemetryToken && existingScanEntry) {
                existingScanEntry.telemetryToken = telemetryToken;
            }
            if (scanId && existingScanEntry) {
                existingScanEntry.scanId = scanId;
            }
        }

        // 6. Background Analytics Processing (Fire and Forget)
        const processAnalytics = async () => {
            try {
                // Free plan 100-scan soft-lock check
                if (qr.stats?.total_scans >= 99 && qr.accessMode === "dynamic_active") {
                    const user = await User.findById(qr.user_id).select("subscription.plan");
                    if (user && user.subscription.plan === "free") {
                        await QRCode.updateOne(
                            { _id: qr._id },
                            { $set: { accessMode: "static_locked" } }
                        );
                        console.log(`[ScanCap] Locked QR ${qr.short_id} for Free user exceeding 100 scans.`);
                    }
                }

                // Coarse IP lookup: Edge headers first, then single-flight cached IP lookup
                let ipLocation = getLocationFromHeaders(req);
                if (!ipLocation || ipLocation.city === "Unknown") {
                    const apiLocation = await getLocationAsync(ip);
                    if (ipLocation && ipLocation.country_code !== "Unknown" && (!apiLocation || apiLocation.city === "Unknown")) {
                        ipLocation = {
                            ...apiLocation,
                            country: ipLocation.country || apiLocation?.country || geo.country || "Unknown",
                            country_code: ipLocation.country_code || apiLocation?.country_code || geo.country_code || "Unknown"
                        };
                    } else {
                        ipLocation = apiLocation || ipLocation || geo;
                    }
                }

                // Apply hierarchy: QR Placement Metadata > Coarse IP
                const { location: locationData, ipCity, confidence: initialConfidence } = resolveInitialLocation(qr, ipLocation);

                const startOfDay = new Date(dateStr);

                const isNotUnique = await Scan.exists({
                    qr_id: qr._id,
                    sessionContext: sessionHash,
                    createdAt: { $gte: startOfDay }
                });
                const isUnique = !isNotUnique;

                const safeCityKey = sanitizeKey(locationData.city);
                const safeLocationKey = formatLocationKey(locationData);

                // 1. Log Raw Scan (with DPDP hashing, scanId, and Architecture D tracking)
                await Scan.create({
                    _id: scanId,
                    qr_id: qr._id,
                    owner_id: qr.user_id,
                    location: locationData,
                    ipCity,
                    dateBucket: dateStr,
                    appliedCityKey: safeCityKey,
                    appliedLocationKey: safeLocationKey,
                    geoConfidence: initialConfidence,
                    telemetryReconciled: false,
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

                // 2. Materialized View Update (Skipped for Bots)
                if (!isBot) {
                    const osKey = sanitizeKey(result.os.name);
                    const browserKey = sanitizeKey(result.browser.name);
                    const countryKey = sanitizeKey(locationData.country_code);
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
                                [`cities.${safeCityKey}`]: 1,
                                [`locations.${safeLocationKey}`]: 1,
                                [`campaigns.${campaignKey}`]: 1
                            }
                        },
                        { upsert: true }
                    );
                }
            } catch (bgError) {
                console.error("Background analytics processing error:", bgError);
            }
        };

        if (!isDuplicate && qr.accessMode !== "static_locked") {
            const analyticsPromise = processAnalytics();
            if (telemetryToken) {
                pendingScanWrites.set(telemetryToken, analyticsPromise);
                analyticsPromise.finally(() => {
                    pendingScanWrites.delete(telemetryToken);
                });
            }
            Promise.allSettled([
                qr.recordScan(),
                analyticsPromise
            ]);
        } else if (isDuplicate && telemetryToken && qr.accessMode !== "static_locked") {
            // Ensure the deduplicated scan has the telemetryToken attached if it was initially created without one
            const attachPromise = (async () => {
                try {
                    const existingPending = pendingScanWrites.get(telemetryToken);
                    if (existingPending) await existingPending;
                    await Scan.findOneAndUpdate(
                        {
                            qr_id: qr._id,
                            "location.source": { $in: ["ip", "placement"] }
                        },
                        { $set: { telemetryToken } },
                        { sort: { createdAt: -1 } }
                    );
                } catch (_) {}
            })();
            pendingScanWrites.set(telemetryToken, attachPromise);
            attachPromise.finally(() => {
                pendingScanWrites.delete(telemetryToken);
            });
        }

        // 7. Destination Resolution & Adaptive 3-Path Dispatcher
        const frontendUrl = env.FRONTEND_URL;
        const typeRedirects = { PDF: "/pdf", VCARD: "/vcard", SOCIAL: "/social", MEDIA: "/media", MENU: "/menu" };

        let destinationUrl = finalUrl;
        if (typeRedirects[qr.qr_type]) {
            destinationUrl = `${frontendUrl}${typeRedirects[qr.qr_type]}/${shortId}`;
        }

        // Fix 1: Non-HTTP Schemes (upi://, mailto:, tel:, whatsapp://) must force Path 1 (302)
        const isHttpDestination = /^https?:\/\//i.test(destinationUrl);

        // Path 3: DPDP Tap-to-Consent GPS Interstitial
        if (isGpsRequested && telemetryToken) {
            return res.send(renderGpsInterstitial({
                shortId,
                destinationUrl,
                title: qr.metadata?.title || qr.short_id,
                telemetryToken,
                scanId
            }));
        }

        // Path 1: Instant HTTP 302 (High Confidence Broadband / Bot / Non-HTTP Schemes / Placement)
        if (effectiveConfidence === "HIGH" || isBot || !isHttpDestination) {
            return res.redirect(302, destinationUrl);
        }

        // Path 2: Zero-Prompt Inline Micro-Bridge (~900 bytes, <15ms execution) for Mobile CGNAT
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(renderMicroBridgeHtml({
            shortId,
            destinationUrl,
            scanId,
            telemetryToken
        }));

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

/**
 * Background processor for GPS and Micro-Bridge telemetry.
 * Reconciles scanId / telemetryToken atomically, updates DailyScanStats via key swap (-1 old, +1 new),
 * and avoids double-counting.
 */
export const processTelemetryPayload = async (
    { shortId, scanId, lat, lon, accuracy, telemetryToken, fallbackWanLookup, clientIp, headerLocation, timezone, tz, lang, net, rtt },
    deps = {}
) => {
    // Wait for any in-flight initial Scan.create / DailyScanStats upsert for this token
    if (telemetryToken && pendingScanWrites.has(telemetryToken)) {
        try {
            await pendingScanWrites.get(telemetryToken);
        } catch (_) {}
    }

    const findQR = deps.findQR || ((sid) => QRCode.findOne({ short_id: sid }).select("_id user_id"));
    const geocode = deps.geocode || ((la, lo) => reverseGeocode(la, lo));
    const wanGeocode =
        deps.wanGeocode ||
        (() => resolveWanLocation({ clientIp, headerLocation, timezone: tz || timezone }));
    const consumeAndUpdateScan =
        deps.consumeAndUpdateScan ||
        ((filter, update) => Scan.findOneAndUpdate(filter, update, { new: false, sort: { createdAt: -1 } }));
    const updateDailyStats =
        deps.updateDailyStats ||
        ((filter, updateDoc) => DailyScanStats.updateOne(filter, updateDoc, { upsert: true }));

    const qr = await findQR(shortId);
    if (!qr) return { updated: false, reason: "qr_not_found" };

    const clientTz = tz || timezone;

    // Check if token was already marked consumed in memory
    const tokenMeta = telemetryToken ? issuedTelemetryTokens.get(telemetryToken) : null;
    if (tokenMeta && tokenMeta.consumed) {
        return { updated: false, reason: "token_invalid_or_already_consumed" };
    }

    // 1. Locate the Scan document to reconcile
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    let oldScan = null;
    const targetScanId = scanId || tokenMeta?.scanId;

    if (deps.findScan) {
        oldScan = await deps.findScan({ scanId: targetScanId, telemetryToken });
    } else if (!deps.consumeAndUpdateScan) {
        if (targetScanId && mongoose.Types.ObjectId.isValid(targetScanId)) {
            oldScan = await Scan.findOne({
                _id: targetScanId,
                telemetryReconciled: false
            });
            if (!oldScan) {
                await new Promise((r) => setTimeout(r, 150));
                oldScan = await Scan.findOne({
                    _id: targetScanId,
                    telemetryReconciled: false
                });
            }
        }

        if (!oldScan && telemetryToken) {
            oldScan = await Scan.findOne({
                qr_id: qr._id,
                telemetryToken,
                telemetryReconciled: false,
                createdAt: { $gte: fiveMinutesAgo }
            });
            if (!oldScan) {
                await new Promise((r) => setTimeout(r, 150));
                oldScan = await Scan.findOne({
                    qr_id: qr._id,
                    telemetryToken,
                    telemetryReconciled: false,
                    createdAt: { $gte: fiveMinutesAgo }
                });
            }
        }

        if (!oldScan || oldScan.telemetryReconciled) {
            return { updated: false, reason: "scan_not_found_or_already_reconciled" };
        }
    }

    let newLocation = null;
    let newConfidence = "TELEMETRY_VERIFIED";

    // Case A: User provided GPS coordinates
    if (typeof lat === "number" && typeof lon === "number") {
        let geoResult = await geocode(lat, lon);
        if ((!geoResult || geoResult.city === "Unknown") && !deps.geocode) {
            geoResult = (await wanGeocode()) || geoResult;
        }

        if (geoResult) {
            const resolvedCity =
                geoResult.city && geoResult.city !== "Unknown"
                    ? geoResult.city
                    : geoResult.region && geoResult.region !== "Unknown"
                        ? geoResult.region
                        : "Unknown";

            if (resolvedCity !== "Unknown") {
                newLocation = {
                    country: geoResult.country || "India",
                    country_code: geoResult.country_code || "IN",
                    city: resolvedCity,
                    region: geoResult.region && geoResult.region !== "Unknown" ? geoResult.region : resolvedCity,
                    district: geoResult.district || resolvedCity,
                    pincode: geoResult.pincode || "",
                    timezone: geoResult.timezone || clientTz || "Asia/Kolkata",
                    source: "gps",
                    accuracy: typeof accuracy === "number" ? Math.round(accuracy) : null,
                    ll: [] // DPDP Fix 3.1: never store raw GPS coordinates
                };
                newConfidence = "GPS_EXACT";
            }
        }
    } else if (fallbackWanLookup) {
        // Case B: Fallback WAN lookup
        const geoResult = await wanGeocode();
        if (geoResult && geoResult.city && geoResult.city !== "Unknown") {
            newLocation = {
                country: geoResult.country || "India",
                country_code: geoResult.country_code || "IN",
                city: geoResult.city,
                region: geoResult.region || geoResult.city,
                district: geoResult.district || geoResult.city,
                pincode: geoResult.pincode || "",
                timezone: geoResult.timezone || clientTz || "Asia/Kolkata",
                source: "gps",
                accuracy: typeof accuracy === "number" ? Math.round(accuracy) : null,
                ll: []
            };
            newConfidence = "TELEMETRY_VERIFIED";
        }
    } else if (clientTz) {
        // Case C: Micro-Bridge Telemetry (Timezone & Masked VPN Detection)
        if (clientTz === "Asia/Kolkata" || clientTz === "Asia/Calcutta") {
            const countryCode = oldScan?.location?.country_code;
            if (countryCode && countryCode !== "IN") {
                // Foreign VPN / Apple Relay masking an Indian scanner
                newLocation = {
                    country: "India",
                    country_code: "IN",
                    region: "India (VPN Masked)",
                    city: "India (VPN Masked)",
                    district: "India (VPN Masked)",
                    pincode: "",
                    timezone: "Asia/Kolkata",
                    source: "telemetry",
                    accuracy: 999,
                    ll: []
                };
                newConfidence = "TELEMETRY_VERIFIED";
            } else if (oldScan && oldScan.geoConfidence !== "HIGH") {
                newLocation = {
                    ...oldScan.location,
                    timezone: "Asia/Kolkata",
                    source: "telemetry"
                };
                newConfidence = "TELEMETRY_VERIFIED";
            }
        }
    }

    if (!newLocation && oldScan) {
        // Mark reconciled so duplicate beacons no-op
        await Scan.updateOne(
            { _id: oldScan._id },
            { $set: { telemetryReconciled: true }, $unset: { telemetryToken: "" } }
        );
        if (tokenMeta) tokenMeta.consumed = true;
        return { updated: true, location: oldScan.location };
    }

    if (!newLocation) {
        return { updated: false, reason: "geocode_unavailable" };
    }

    const newCityKey = sanitizeKey(newLocation.city);
    const newLocKey = formatLocationKey(newLocation);
    const prevIpCity = oldScan?.ipCity || "Unknown";
    const ipDiscrepancy = prevIpCity.toLowerCase() !== newLocation.city.toLowerCase();

    // Capture old keys BEFORE calling consumeAndUpdateScan to avoid in-memory object reference mutations
    const priorCityKey = oldScan ? (oldScan.appliedCityKey || sanitizeKey(oldScan.location?.city)) : null;
    const priorLocKey = oldScan ? (oldScan.appliedLocationKey || formatLocationKey(oldScan.location)) : null;
    const priorIsBot = oldScan ? oldScan.isBot : null;
    const priorDateBucket = oldScan?.dateBucket || (oldScan?.createdAt instanceof Date ? oldScan.createdAt.toISOString().split("T")[0] : null);

    const updateFilter = oldScan
        ? { _id: oldScan._id, telemetryReconciled: false }
        : targetScanId
            ? { _id: targetScanId }
            : { telemetryToken, "location.source": { $in: ["ip", "placement"] }, createdAt: { $gte: fiveMinutesAgo } };

    const updateDoc = {
        $set: {
            location: newLocation,
            appliedCityKey: newCityKey,
            appliedLocationKey: newLocKey,
            geoConfidence: newConfidence,
            telemetryReconciled: true,
            ipDiscrepancy
        },
        $unset: { telemetryToken: "" }
    };

    // Atomically consume and update Scan document
    const updatedScan = await consumeAndUpdateScan(updateFilter, updateDoc);

    if (!updatedScan) {
        return { updated: false, reason: "token_invalid_or_already_consumed" };
    }

    const effectiveOldScan = oldScan || updatedScan;
    const oldCityKey = priorCityKey || updatedScan.appliedCityKey || sanitizeKey(updatedScan.location?.city);
    const oldLocKey = priorLocKey || updatedScan.appliedLocationKey || formatLocationKey(updatedScan.location);
    const isBot = priorIsBot !== null ? priorIsBot : !!updatedScan.isBot;
    const dateBucket = priorDateBucket || updatedScan.dateBucket || (updatedScan.createdAt instanceof Date ? updatedScan.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);

    // Mark token consumed in memory & clear from 5s dedup cache
    if (tokenMeta) {
        tokenMeta.consumed = true;
        if (tokenMeta.dedupKey) {
            const recent = recentScans.get(tokenMeta.dedupKey);
            if (recent && recent.telemetryToken === telemetryToken) {
                delete recent.telemetryToken;
            }
        }
    }

    // Atomic delta swap on DailyScanStats (Zero double-counting!)
    if (!isBot) {
        const incPatch = {};
        if (oldCityKey !== newCityKey) {
            incPatch[`cities.${oldCityKey}`] = -1;
            incPatch[`cities.${newCityKey}`] = 1;
        }
        if (oldLocKey !== newLocKey) {
            incPatch[`locations.${oldLocKey}`] = -1;
            incPatch[`locations.${newLocKey}`] = 1;
        }

        if (Object.keys(incPatch).length > 0) {
            await updateDailyStats(
                { qr_id: qr._id, date: dateBucket },
                { $inc: incPatch }
            );
        }
    }

    return { updated: true, ipDiscrepancy, location: newLocation };
};

// @desc    Record GPS & Micro-Bridge telemetry from client (Fast 204 response + background processing)
// @route   POST /r/:shortId/telemetry
// @access  Public (Requires single-use telemetryToken or valid scanId)
export const recordGpsTelemetry = async (req, res, nextOrProcessor) => {
    try {
        const { shortId } = req.params;

        // Fix 4: Express JSON Body Parsing on navigator.sendBeacon
        let body = req.body || {};
        if (typeof body === "string") {
            try {
                body = JSON.parse(body);
            } catch (_) {}
        }

        const {
            scanId,
            latitude,
            longitude,
            accuracy,
            telemetryToken,
            fallbackWanLookup,
            timezone,
            tz,
            lang,
            net,
            rtt
        } = body;

        // Require either scanId or telemetryToken
        if ((!scanId || typeof scanId !== "string") && (!telemetryToken || typeof telemetryToken !== "string")) {
            return res.status(401).json({ message: "Missing scanId or telemetry token" });
        }

        const isFallbackWan = fallbackWanLookup === true;
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const hasCoords = !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

        const clientIp = getClientIp(req);
        const headerLocation = getLocationFromHeaders(req);
        const clientTimezone = (typeof tz === "string" ? tz : typeof timezone === "string" ? timezone : undefined)?.trim().slice(0, 64);

        // Distinguish Express's 3rd parameter `next` from a custom processor passed in unit tests
        const isExpressNext =
            typeof nextOrProcessor === "function" &&
            (nextOrProcessor === req?.next || nextOrProcessor.name === "next");
        const backgroundProcessor =
            typeof nextOrProcessor === "function" && !isExpressNext
                ? nextOrProcessor
                : processTelemetryPayload;

        // Fast 204 No Content response immediately so client never waits
        res.status(204).end();

        Promise.resolve(
            backgroundProcessor({
                shortId,
                scanId,
                lat: hasCoords ? lat : null,
                lon: hasCoords ? lon : null,
                accuracy: typeof accuracy === "number" ? accuracy : undefined,
                telemetryToken,
                fallbackWanLookup: isFallbackWan,
                clientIp,
                headerLocation,
                timezone: clientTimezone,
                tz: clientTimezone,
                lang,
                net,
                rtt
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
