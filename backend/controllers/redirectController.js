import { QRCode } from "../models/QRCode.js";
import { Scan } from "../models/Scan.js";
import { DailyScanStats } from "../models/DailyScanStats.js";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import { getClientIp, getLocationAsync } from "../services/Geolocation.js";
import { env } from "../config/env.js";

// ── Bot signatures to filter out from analytics ──
const BOT_PATTERN = /whatsapp|slack|telegram|bot|crawler|spider|crawl|preview|fetch|headless|lighthouse/i;

const sanitizeKey = (str) => {
    if (!str) return "unknown";
    return String(str).replace(/\./g, "_").replace(/\$/g, "_").toLowerCase();
};

const formatLocationKey = (loc) => {
    const city = String(loc.city || 'Unknown').replace(/\./g, "_").replace(/\$/g, "_");
    const region = String(loc.region || 'Unknown').replace(/\./g, "_").replace(/\$/g, "_");
    const code = String(loc.country_code || 'Unknown').replace(/\./g, "_").replace(/\$/g, "_");
    const name = String(loc.country || 'Unknown').replace(/\./g, "_").replace(/\$/g, "_");
    return `${city}::${region}::${code}::${name}`;
};

// ── Scan Deduplication Cache ──
// Prevents Chrome's speculative preload from registering double scans.
// Key: "ip|shortId", auto-expires after 5 seconds.
const recentScans = new Map();
const DEDUP_WINDOW_MS = 5000;

function isDuplicateScan(ip, shortId) {
    const key = `${ip}|${shortId}`;
    if (recentScans.has(key)) return true;
    recentScans.set(key, Date.now());
    // Auto-cleanup after the window expires
    setTimeout(() => recentScans.delete(key), DEDUP_WINDOW_MS);
    return false;
}

// @desc    Redirect to the target URL and log the scan
// @route   GET /r/:shortId
// @access  Public
export const redirectQR = async (req, res) => {
    try {
        const { shortId } = req.params;
        // 1. Find the QR Code by shortId and populate user to check plan
        const qr = await QRCode.findOne({ short_id: shortId }).populate('user_id', 'subscription.plan');
        if (!qr) return res.status(404).send("<h1>404 - QR Code Not Found</h1>");
        if (!qr.isActive || qr.accessMode === 'disabled') {
            return res.status(410).send("<h1>This QR Code is inactive</h1>");
        }

        // Free plan 100-scan soft-lock is now checked safely in the background processAnalytics promise.

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

        // 3. Extract client IP (synchronous — needed for session hash)
        const ip = getClientIp(req);

        // 4. Session hash for unique-scanner tracking (DPDP Compliant)
        const salt = env.ANALYTICS_SALT || "qrvibe-fallback-salt-7729";
        const sessionHash = crypto
            .createHash("sha256")
            .update(`${ip}|${ua}|${salt}`)
            .digest("hex");

        // 5. Auto UTM Builder & Campaign Extraction
        let finalUrl = qr.target_url;
        
        // Ensure URL has a valid protocol so res.redirect doesn't treat it as a relative path
        if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
            finalUrl = 'http://' + finalUrl;
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
                
                // Security Check: Only allow Pass-Through UTMs for Growth/Business plans
                const plan = qr.user_id?.subscription?.plan || 'free';
                const canPassThrough = plan === 'growth' || plan === 'business';

                // Read from Query Params (Pass-through)
                const queryUtms = canPassThrough ? {
                    source: req.query.utm_source,
                    medium: req.query.utm_medium,
                    campaign: req.query.utm_campaign,
                    content: req.query.utm_content,
                    term: req.query.utm_term
                } : {};

                // Read from QR Schema
                const storedUtms = qr.utm || {};

                // Determine final UTM values (Priority: Query > Stored > URL > Default)
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

                // Set them in the URL
                if (finalSource) urlObj.searchParams.set("utm_source", finalSource);
                if (finalMedium) urlObj.searchParams.set("utm_medium", finalMedium);
                if (finalCampaign) urlObj.searchParams.set("utm_campaign", finalCampaign);
                if (finalContent) urlObj.searchParams.set("utm_content", finalContent);
                if (finalTerm) urlObj.searchParams.set("utm_term", finalTerm);

                finalUrl = urlObj.toString();

                // Extract final UTMs for DB logging
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

        // 6. Background Analytics Processing (Fire and Forget)
        const processAnalytics = async () => {
            try {
                // ── FREE PLAN SCAN CAP (Background Enforcement) ──────────
                // Safe DB query in the background to check the plan and enforce the hard 100-scan limit.
                if (qr.stats.total_scans >= 99 && qr.accessMode === 'dynamic_active') {
                    // Import User if not imported (Wait, is User imported in redirectController? No. I need to import it at the top).
                    const { User } = await import('../models/User.js');
                    const user = await User.findById(qr.user_id).select('subscription.plan');
                    if (user && user.subscription.plan === 'free') {
                        await QRCode.updateOne(
                            { _id: qr._id },
                            { $set: { accessMode: 'static_locked' } }
                        );
                        console.log(`[ScanCap] Locked QR ${qr.short_id} for Free user exceeding 100 scans.`);
                    }
                }

                // Geo lookup: freeipapi.com first → geoip-lite fallback (async, non-blocking)
                const locationData = await getLocationAsync(ip);
                // strict lock DailyScanStats to YYYY-MM-DD
                const dateStr = new Date().toISOString().split('T')[0];
                const startOfDay = new Date(dateStr);
                
                // Determine Unique Scan via DB check
                const isNotUnique = await Scan.exists({
                    qr_id: qr._id,
                    sessionContext: sessionHash,
                    createdAt: { $gte: startOfDay }
                });
                const isUnique = !isNotUnique;

                // 1. Log Raw Scan (with DPDP hashing & campaign)
                await Scan.create({
                    qr_id: qr._id,
                    owner_id: qr.user_id,
                    location: locationData,
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
                console.error("Background analytics processing error:", bgError);
            }
        };

        // Execute background tasks without awaiting them (Promise.allSettled)
        // Dedup: skip analytics if this is a duplicate hit within 5s (Chrome preload)
        // Soft Downgrade: skip analytics entirely if accessMode is static_locked
        if (!isDuplicateScan(ip, shortId) && qr.accessMode !== 'static_locked') {
            Promise.allSettled([
                qr.recordScan(), // Increment QRCode raw total
                processAnalytics() // Execute raw Scan insert and materialized view upsert
            ]);
        }

        // 7. Instant Redirect Handling
        const frontendUrl = env.FRONTEND_URL;
        const typeRedirects = { PDF: "/pdf", VCARD: "/vcard", SOCIAL: "/social", MEDIA: "/media", MENU: "/menu" };
        
        if (typeRedirects[qr.qr_type]) {
            return res.redirect(302, `${frontendUrl}${typeRedirects[qr.qr_type]}/${shortId}`);
        }
        return res.redirect(302, finalUrl);

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

