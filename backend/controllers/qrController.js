import { QRCode } from "../models/QRCode.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { AlertEvent } from "../models/AlertEvent.js";
import { Scan } from "../models/Scan.js";
import { DailyScanStats } from "../models/DailyScanStats.js";
import { nanoid } from "nanoid";
import { checkSingleQrHealth } from "../jobs/healthMonitor.js";

// Per-user cooldown map for manual "Check Links" sweeps (60 seconds)
const manualHealthCheckCooldowns = new Map();
const MANUAL_CHECK_COOLDOWN_MS = 60 * 1000;

// @desc    Create a new QR Code
// @route   POST /api/qrcodes/create
// @access  Private
export const createQR = async (req, res) => {
    try {
        const { target_url, title, qr_type, customization, metadata, gpsLocationEnabled, placement, folder_id, utm } = req.body;

        if (!target_url) {
            return res.status(400).json({ message: "Target URL is required" });
        }

        // Check limits for free plan
        if (req.user.subscription?.plan === 'free') {
            const activeQrCount = await QRCode.countDocuments({ user_id: req.user._id, accessMode: 'dynamic_active' });
            if (activeQrCount >= req.user.subscription.dynamicQrLimit) {
                return res.status(403).json({ message: "Limit reached. Upgrade to Pro." });
            }
        }
 
        const short_id = nanoid(6);

        const qrCode = await QRCode.create({
            user_id: req.user._id,
            short_id,
            target_url,
            qr_type: qr_type || "URL",
            customization,
            gpsLocationEnabled: !!gpsLocationEnabled,
            placement: placement || {},
            folder_id: folder_id || null,
            utm: utm || {},
            metadata: {
                ...metadata,
                title: metadata?.title || title || "Untitled QR",
            },
        });

        // Mark user's first QR creation for onboarding
        if (!req.user.hasCreatedFirstQR) {
            await User.findByIdAndUpdate(req.user._id, { hasCreatedFirstQR: true });
        }

        // Non-blocking initial link health check
        checkSingleQrHealth(qrCode, { retryDelayMs: 1000 }).catch((err) => {
            console.error(`[QRController] Initial health check failed for ${qrCode.short_id}:`, err.message);
        });

        res.status(201).json(qrCode);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all QR Codes for the logged-in user
// @route   GET /api/qrcodes/myqrs
// @access  Private
export const getMyQRs = async (req, res) => {
    try {
        const qrs = await QRCode.find({ user_id: req.user._id }).sort({
            createdAt: -1, // Newest first
        });
        res.json(qrs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Trigger an on-demand health check for the logged-in user's QR codes
// @route   POST /api/qrcodes/check-health
// @access  Private
export const checkMyQRsHealth = async (req, res) => {
    try {
        const userIdStr = req.user._id.toString();
        const lastCheck = manualHealthCheckCooldowns.get(userIdStr) || 0;
        const now = Date.now();

        if (now - lastCheck < MANUAL_CHECK_COOLDOWN_MS) {
            const waitSeconds = Math.ceil((MANUAL_CHECK_COOLDOWN_MS - (now - lastCheck)) / 1000);
            return res.status(429).json({
                message: `Please wait ${waitSeconds}s before running another manual link check.`
            });
        }

        manualHealthCheckCooldowns.set(userIdStr, now);

        const qrs = await QRCode.find({
            user_id: req.user._id,
            isActive: true,
            accessMode: { $ne: 'disabled' }
        });

        let checkedCount = 0;
        let brokenCount = 0;
        let recoveredCount = 0;

        await Promise.allSettled(
            qrs.map(async (qr) => {
                qr.user_id = req.user; // Pass populated user so AlertService has user context
                const result = await checkSingleQrHealth(qr, { retryDelayMs: 500 });
                if (!result.skipped) checkedCount += 1;
                if (result.status === 'broken') brokenCount += 1;
                if (result.recovered) recoveredCount += 1;
            })
        );

        const updatedQrs = await QRCode.find({ user_id: req.user._id }).sort({ createdAt: -1 });

        res.json({
            message: "Link health check complete",
            checkedCount,
            brokenCount,
            recoveredCount,
            qrs: updatedQrs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get a single QR Code by ID (for editing)
// @route   GET /api/qrcodes/:id
// @access  Private
export const getQRById = async (req, res) => {
    try {
        const qr = await QRCode.findById(req.params.id);

        if (!qr) return res.status(404).json({ message: "QR Code not found" });

        // Check ownership
        if (qr.user_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized to view this QR" });
        }

        res.json(qr);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a QR Code
// @route   PUT /api/qrcodes/:id
// @access  Private
export const updateQR = async (req, res) => {
    try {
        const qr = await QRCode.findById(req.params.id);

        if (!qr) return res.status(404).json({ message: "QR Code not found" });

        // Check ownership
        if (qr.user_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized to update this QR" });
        }

        // Prevent edits if the QR is locked due to downgrade or plan limits
        if (qr.accessMode === 'static_locked') {
            return res.status(403).json({ message: "QR code is locked. Please upgrade to edit." });
        }

        const urlChanged = req.body.target_url && req.body.target_url !== qr.target_url;

        // Update fields
        const updatedQR = await QRCode.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        // If target_url was updated (or QR was previously broken), re-verify health in background
        if (updatedQR && (urlChanged || updatedQR.health_status === 'broken')) {
            checkSingleQrHealth(updatedQR, { retryDelayMs: 500 }).catch((err) => {
                console.error(`[QRController] Post-update health check failed for ${updatedQR.short_id}:`, err.message);
            });
        }

        res.json(updatedQR);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a QR Code
// @route   DELETE /api/qrcodes/:id
// @access  Private
export const deleteQR = async (req, res) => {
    try {
        const qr = await QRCode.findById(req.params.id);

        if (!qr) return res.status(404).json({ message: "QR Code not found" });

        // Check ownership
        if (qr.user_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized to delete this QR" });
        }

        const qrId = qr._id;

        await Promise.all([
            qr.deleteOne(),
            Notification.deleteMany({ qr_id: qrId }),
            AlertEvent.deleteMany({ qr_id: qrId }),
            Scan.deleteMany({ qr_id: qrId }),
            DailyScanStats.deleteMany({ qr_id: qrId }),
        ]);

        res.json({ message: "QR Code removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Parse uploaded menu photos/PDF into structured digital menu items using Gemini Vision
// @route   POST /api/qrcodes/parse-menu-photo
// @access  Private
export const parseMenuPhoto = async (req, res) => {
    try {
        const rawFiles = req.files || (req.file ? [req.file] : []);
        if (!rawFiles || rawFiles.length === 0) {
            return res.status(400).json({ message: "Please upload at least one menu photo or PDF." });
        }

        const mode = req.body.mode === 'append' ? 'append' : 'replace';
        const autoFillPhotos = req.body.autoFillPhotos !== 'false' && req.body.autoFillPhotos !== false;

        let existingCategories = [];
        if (req.body.existingCategories) {
            try {
                existingCategories = typeof req.body.existingCategories === 'string'
                    ? JSON.parse(req.body.existingCategories)
                    : req.body.existingCategories;
            } catch (parseErr) {
                existingCategories = [];
            }
        }

        const { extractMenuFromPhoto } = await import("../services/MenuAiService.js");
        const result = await extractMenuFromPhoto({
            files: rawFiles,
            mode,
            autoFillPhotos,
            existingCategories,
        });

        res.status(200).json({
            message: "Menu extracted successfully",
            ...result,
        });
    } catch (error) {
        console.error("[qrController] parseMenuPhoto error:", error.message);
        const status = error.status && Number.isInteger(error.status) ? error.status : 500;
        res.status(status).json({
            message: error.message || "Failed to extract menu from photo.",
        });
    }
};

