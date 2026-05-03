import { QRCode } from "../models/QRCode.js";
import { Scan } from "../models/Scan.js";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import crypto from "crypto";

// ── Bot signatures to filter out from analytics ──
const BOT_PATTERN = /whatsapp|slack|telegram|bot|crawler|spider|crawl|preview|fetch|headless|lighthouse/i;

// @desc    Redirect to the target URL and log the scan
// @route   GET /r/:shortId
// @access  Public
export const redirectQR = async (req, res) => {
    try {
        const { shortId } = req.params;

        // 1. Find the QR Code by shortId
        const qr = await QRCode.findOne({ short_id: shortId });
        if (!qr) return res.status(404).send("<h1>404 - QR Code Not Found</h1>");
        if (!qr.isActive) return res.status(410).send("<h1>This QR Code is inactive</h1>");

        // Increment scan counter in background
        qr.recordScan().catch(err => console.error("Error updating scan count:", err));

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

        // 3. Geolocation — geoip-lite only (synchronous, local DB)
        let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
        if (ip.includes(",")) ip = ip.split(",")[0].trim();
        if (ip === "::1" || ip === "127.0.0.1") ip = "49.36.12.94";

        const geo = geoip.lookup(ip);
        const locationData = {
            country: geo?.country || "Unknown",
            country_code: geo?.country || "Unknown",
            city: geo?.city || "Unknown",
            region: geo?.region || "Unknown",
            timezone: geo?.timezone || "UTC",
            ll: geo?.ll || []
        };

        // 4. Session hash for unique-scanner tracking
        const sessionHash = crypto
            .createHash("sha256")
            .update(`${ip}|${ua}`)
            .digest("hex");

        // 5. Single database write — fire-and-forget
        Scan.create({
            qr_id: qr._id,
            owner_id: qr.user_id,
            location: locationData,
            device: {
                os: result.os.name || "Unknown",
                browser: result.browser.name || "Unknown",
                type: deviceType
            },
            isBot,
            sessionContext: sessionHash
        }).catch(err => console.error("Background scan logging error:", err));

        // 6. Auto UTM Builder
        let finalUrl = qr.target_url;
        if (qr.qr_type === "URL" || qr.qr_type?.includes("Social")) {
            try {
                const urlObj = new URL(finalUrl);
                if (!urlObj.searchParams.has("utm_source")) {
                    urlObj.searchParams.set("utm_source", "qrvibe");
                    urlObj.searchParams.set("utm_medium", "qr_code");
                    const campaignName = (qr.metadata?.title || qr.short_id)
                        .toString().toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^\w-]+/g, "")
                        .replace(/--+/g, "-")
                        .replace(/^-+/, "")
                        .replace(/-+$/, "");
                    urlObj.searchParams.set("utm_campaign", campaignName || "qr_campaign");
                    finalUrl = urlObj.toString();
                }
            } catch (urlError) {
                console.warn(`Could not build UTMs for ${finalUrl}`, urlError.message);
            }
        }

        // 7. Redirect Handling
        const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:5173";
        const typeRedirects = { PDF: "/pdf", VCARD: "/vcard", SOCIAL: "/social", MEDIA: "/media" };
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

