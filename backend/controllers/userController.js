import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

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
        plan: user.plan,
        trialEndsAt: user.trialEndsAt,
        subscriptionStatus: user.subscriptionStatus,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        whatsappNumber: user.whatsappNumber,
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

        if (!accessToken) {
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
        console.error('[GoogleAuth] Error:', error.message, error.stack);
        res.status(401).json({ message: "Google authentication failed", error: error.message });
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

        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
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
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                trialEndsAt: user.trialEndsAt,
                subscriptionStatus: user.subscriptionStatus,
                stripeCustomerId: user.stripeCustomerId,
                stripeSubscriptionId: user.stripeSubscriptionId,
                whatsappNumber: user.whatsappNumber,
                hasCreatedFirstQR: user.hasCreatedFirstQR,
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
            // Update fields if provided
            user.whatsappNumber = req.body.whatsappNumber !== undefined ? req.body.whatsappNumber : user.whatsappNumber;
            // Can add name, companyName, etc here later if needed
            
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
