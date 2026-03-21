import { QRCode } from "../models/QRCode.js";
import { User } from "../models/User.js";
import { nanoid } from "nanoid";

// @desc    Create a new QR Code
// @route   POST /api/qrcodes
// @access  Private
export const createQR = async (req, res) => {
    try {
        const { target_url, title, qr_type, customization } = req.body;

        if (!target_url) {
            return res.status(400).json({ message: "Target URL is required" });
        }
 
        const short_id = nanoid(6);

        const qrCode = await QRCode.create({
            user_id: req.user._id,
            short_id,
            target_url,
            qr_type: qr_type || "URL",
            customization,
            metadata: {
                title: title || "Untitled QR",
            },
        });

        // Mark user's first QR creation for onboarding
        if (!req.user.hasCreatedFirstQR) {
            await User.findByIdAndUpdate(req.user._id, { hasCreatedFirstQR: true });
        }

        res.status(201).json(qrCode);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all QR Codes for the logged-in user
// @route   GET /api/qrcodes
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

        // Update fields
        const updatedQR = await QRCode.findByIdAndUpdate(
            req.params.id,
            req.body, // We can just pass the whole body, Mongoose ignores fields not in schema
            { new: true } // Return the updated document
        );

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

        await qr.deleteOne();
        res.json({ message: "QR Code removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
