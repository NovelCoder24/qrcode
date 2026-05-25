import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { QRCode } from "../models/QRCode.js";
import { Scan } from "../models/Scan.js";
import { DailyScanStats } from "../models/DailyScanStats.js";
import { AlertEvent } from "../models/AlertEvent.js";
import { ConsentRecord } from "../models/ConsentRecord.js";
import { Notification } from "../models/Notification.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Helper: Cookie options for refresh token
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
};

// Helper: Send token pair (access in body, refresh as cookie)
const sendTokens = (res, user, statusCode = 200) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(statusCode).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: accessToken,
        subscription: user.subscription,
        billing: user.billing,
        whatsappNumber: user.whatsappNumber,
        whatsappOptIn: user.whatsappOptIn,
        hasCreatedFirstQR: user.hasCreatedFirstQR,
    });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill in all fields" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ name, email, password });

        if (user) {
            sendTokens(res, user, 201);
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            sendTokens(res, user);
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user with Google OAuth
// @route   POST /api/users/google
// @access  Public
export const googleAuth = async (req, res) => {
    try {
        const { accessToken } = req.body;
        console.log('[GoogleAuth] Received request, accessToken present:', !!accessToken);
        console.log('[GoogleAuth] Request origin:', req.get('Origin') || req.get('origin'));
        console.log('[GoogleAuth] Request method:', req.method);

        if (!accessToken) {
            console.log('[GoogleAuth] No access token provided');
            return res.status(400).json({ message: "No access token provided" });
        }

        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log('[GoogleAuth] Google API response status:', googleRes.status);

        if (!googleRes.ok) {
            const errorBody = await googleRes.text();
            console.log('[GoogleAuth] Google API error body:', errorBody);
            return res.status(401).json({ message: "Invalid Google access token" });
        }

        const googleData = await googleRes.json();
        const { email, name } = googleData;
        console.log('[GoogleAuth] User info from Google:', { email, name });

        let user = await User.findOne({ email });

        if (user) {
            console.log('[GoogleAuth] Existing user found, logging in');
            sendTokens(res, user);
        } else {
            console.log('[GoogleAuth] Creating new user');
            user = await User.create({ name, email, authProvider: "google" });
            sendTokens(res, user, 201);
        }
    } catch (error) {
        console.error('[GoogleAuth] Error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            message: "Google authentication failed",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Refresh access token using refresh token cookie
// @route   POST /api/users/refresh
// @access  Public (uses cookie)
export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Issue a new token pair (rotate refresh token for extra security)
        sendTokens(res, user);
    } catch (error) {
        // Clear the bad cookie
        res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
        res.status(401).json({ message: "Invalid or expired refresh token" });
    }
};

// @desc    Logout user (clear refresh token cookie)
// @route   POST /api/users/logout
// @access  Public
export const logoutUser = async (req, res) => {
    res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
    res.json({ message: "Logged out successfully" });
};

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private (Needs middleware)
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const activeQrCount = await QRCode.countDocuments({ user_id: user._id, accessMode: 'dynamic_active' });

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                subscription: user.subscription,
                billing: user.billing,
                whatsappNumber: user.whatsappNumber,
                whatsappOptIn: user.whatsappOptIn,
                hasCreatedFirstQR: user.hasCreatedFirstQR,
                activeQrCount,
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.whatsappNumber = req.body.whatsappNumber !== undefined ? req.body.whatsappNumber : user.whatsappNumber;
            
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                whatsappNumber: updatedUser.whatsappNumber
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// PHASE 6: DPDP & PRIVACY CONTROLLERS
// ==========================================

// @desc    Dismiss trial expired warning popup
// @route   PUT /api/users/dismiss-trial-warning
// @access  Private
export const dismissTrialWarning = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.subscription.hasSeenTrialExpiredPopup = true;
        await user.save();

        res.json({ message: "Warning dismissed successfully" });
    } catch (error) {
        console.error("Dismiss warning error:", error);
        res.status(500).json({ message: "Failed to dismiss warning" });
    }
};

// @desc    Update specific privacy/consent settings
// @route   PUT /api/users/privacy
// @access  Private
export const updatePrivacySettings = async (req, res) => {
    try {
        const { whatsappOptIn, whatsappNumber } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: "User not found" });

        // If a new whatsappNumber is provided, save it first
        if (whatsappNumber !== undefined) {
            user.whatsappNumber = whatsappNumber;
        }

        if (typeof whatsappOptIn === 'boolean' && user.whatsappOptIn !== whatsappOptIn) {
            // VALIDATION: Cannot enable alerts without a number on file
            if (whatsappOptIn === true && !user.whatsappNumber) {
                return res.status(400).json({ message: "A valid WhatsApp number is required to enable alerts." });
            }

            user.whatsappOptIn = whatsappOptIn;
            
            // Create a NEW ledger entry for DPDP compliance (no upsert)
            const ipHash = crypto.createHash('sha256').update(req.ip || '0.0.0.0').digest('hex');
            await ConsentRecord.create({
                user_id: user._id,
                consentType: 'whatsapp',
                granted: whatsappOptIn,
                ipHash,
                userAgent: req.headers['user-agent']
            });
        }

        const updatedUser = await user.save();
        res.json({ whatsappOptIn: updatedUser.whatsappOptIn, whatsappNumber: updatedUser.whatsappNumber });
    } catch (error) {
        console.error("Update Privacy Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Export User Data (Data Portability)
// @route   GET /api/users/export
// @access  Private
export const exportUserData = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch User profile (excluding password)
        const user = await User.findById(userId).select('-password').lean();
        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch remaining associated data using Promise.all for speed
        // NOTE: We intentionally OMIT raw `Scan` collection to prevent OOM crashes on large accounts.
        const [qrcodes, dailyStats, alerts, consents] = await Promise.all([
            QRCode.find({ user_id: userId }).lean(),
            DailyScanStats.find({ qr_id: { $in: await QRCode.find({ user_id: userId }).distinct('_id') } }).lean(),
            AlertEvent.find({ qr_id: { $in: await QRCode.find({ user_id: userId }).distinct('_id') } }).lean(),
            ConsentRecord.find({ user_id: userId }).lean()
        ]);

        const exportPayload = {
            exportDate: new Date().toISOString(),
            user,
            qrcodes,
            dailyScanStats: dailyStats,
            alertEvents: alerts,
            consentLedger: consents
        };

        // Send as downloadable JSON file
        res.setHeader('Content-disposition', `attachment; filename=qrvibe_data_${userId}.json`);
        res.setHeader('Content-type', 'application/json');
        res.status(200).send(JSON.stringify(exportPayload, null, 2));

    } catch (error) {
        console.error("Data Export Error:", error);
        res.status(500).json({ message: "Failed to generate export file" });
    }
};

// @desc    Erasure Request (Right to be Forgotten)
// @route   DELETE /api/users/erasure
// @access  Private
export const requestDataErasure = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user._id;

        // Security: Fetch user WITH password hash explicitly
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // For local-auth users: password is MANDATORY
        if (user.authProvider === 'local') {
            if (!password) {
                return res.status(400).json({ message: "Password is required for account deletion." });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Incorrect password." });
            }
        }
        // For Google OAuth users: no password exists, skip the check

        const userQRs = await QRCode.find({ user_id: userId }).distinct('_id');

        console.log(`[DPDP Erasure] Initiating data purge for user ${userId}`);

        // Run all deletions concurrently
        await Promise.all([
            Scan.deleteMany({ qr_id: { $in: userQRs } }),
            DailyScanStats.deleteMany({ qr_id: { $in: userQRs } }),
            AlertEvent.deleteMany({ qr_id: { $in: userQRs } }),
            QRCode.deleteMany({ user_id: userId }),
            ConsentRecord.deleteMany({ user_id: userId }),
            Notification.deleteMany({ user_id: userId })
        ]);

        // Finally delete the user account
        await User.findByIdAndDelete(userId);

        // Clear tokens
        res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
        
        console.log(`[DPDP Erasure] Wipe complete for user ${userId}`);
        res.status(200).json({ message: "All personal data has been permanently erased." });

    } catch (error) {
        console.error("Data Erasure Error:", error);
        res.status(500).json({ message: "Server Error during erasure" });
    }
};
