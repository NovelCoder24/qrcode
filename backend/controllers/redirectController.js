import { QRCode } from "../models/QRCode.js";
import { Scan } from "../models/Scan.js";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import crypto from "crypto";

// @desc    Redirect to the target URL and log the scan
// @route   GET /r/:shortId
// @access  Public
export const redirectQR = async (req, res) => {
    try {
        const { shortId } = req.params;

        // 1. Find the QR Code by shortId
        const qr = await QRCode.findOne({ short_id: shortId });

        if (!qr) {
            return res.status(404).send("<h1>404 - QR Code Not Found</h1>");
        }

        if (!qr.isActive) {
            return res.status(410).send("<h1>This QR Code is inactive</h1>");
        }

        qr.recordScan().catch(err => console.error("Error updating scan count:",err));

        // 2. Parse User-Agent for Device Breakdown
        const parser = new UAParser(req.headers["user-agent"]);
        const result = parser.getResult();
        
        let deviceType = "desktop";
        if (result.device.type === "mobile") deviceType = "mobile";
        else if (result.device.type === "tablet") deviceType = "tablet";
        else if (result.device.type === "smarttv") deviceType = "smarttv";
        else if (result.device.type === "console") deviceType = "console";
        else if (result.device.type === "wearable") deviceType = "wearable";

        // 3. Geolocation parsing using geoip-lite
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "";
        if (ip && ip.includes(',')) {
            ip = ip.split(',')[0].trim();
        }
        if (ip === "::1" || ip === "127.0.0.1") {
            ip = "49.36.12.94"; 
        }

        const geo = geoip.lookup(ip);
        const locationData = {
            country: geo ? geo.country : "Unknown",
            country_code: geo ? geo.country : "Unknown",
            city: geo ? geo.city : "Unknown",
            region: geo ? geo.region : "Unknown",
            timezone: geo ? geo.timezone : "UTC",
            ll: geo ? geo.ll : []
        };

        // 4. Create Detailed Scan Log async
        const rawContext = `${ip}|${req.headers["user-agent"] || ''}`;
        const sessionHash = crypto.createHash("sha256").update(rawContext).digest("hex");

        Scan.create({
            qr_id: qr._id,
            owner_id: qr.user_id,
            location: locationData,
            device: {
                os: result.os.name || "Unknown",
                browser: result.browser.name || "Unknown",
                type: deviceType
            },
            sessionContext: sessionHash
        }).catch(err => console.error("Background scan logging error:", err));

        // 5. Auto UTM Builder
        let finalUrl = qr.target_url;
        
        if (qr.qr_type === 'URL' || qr.qr_type?.includes('Social')) {
            try {
                const urlObj = new URL(finalUrl);
                
                // Append UTMs only if missing 
                if (!urlObj.searchParams.has("utm_source")) {
                    urlObj.searchParams.set("utm_source", "qrvibe");
                    urlObj.searchParams.set("utm_medium", "qr_code");
                    
                    const campaignName = (qr.metadata?.title || qr.short_id)
                        .toString().toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w\-]+/g, '')
                        .replace(/\-\-+/g, '-')
                        .replace(/^-+/, '')
                        .replace(/-+$/, '');

                    urlObj.searchParams.set("utm_campaign", campaignName || "qr_campaign");
                    finalUrl = urlObj.toString();
                }
            } catch (urlError) {
                console.warn(`Could not build UTMs for ${finalUrl}`, urlError.message);
            }
        }

        // 6. Redirect Handling
        if (qr.qr_type === 'PDF') {
            const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
            return res.redirect(302, `${frontendUrl}/pdf/${shortId}`);
        }

        if (qr.qr_type === 'VCARD') {
            const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
            return res.redirect(302, `${frontendUrl}/vcard/${shortId}`);
        }

        if (qr.qr_type === 'SOCIAL') {
            const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
            return res.redirect(302, `${frontendUrl}/social/${shortId}`);
        }

        if (qr.qr_type === 'MEDIA') {
            const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
            return res.redirect(302, `${frontendUrl}/media/${shortId}`);
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
            title: qr.metadata?.title || 'Untitled',
            description: qr.metadata?.description || '',
            company: qr.metadata?.company || '',
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
