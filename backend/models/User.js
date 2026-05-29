import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function () { return this.authProvider === 'local'; }
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    whatsappNumber: {
        type: String,
        default: null
    },
    whatsappOptIn: {
        type: Boolean,
        default: false
    },
    subscription: {
        plan: {
            type: String,
            default: "growth" // Reverse Trial: 30-day Growth experience
        },
        status: {
            type: String,
            enum: ["trialing", "active", "past_due", "canceled", "expired"],
            default: "trialing"
        },
        trialEndsAt: { 
            type: Date, 
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30-Day trial
        },
        hasSeenTrialExpiredPopup: {
            type: Boolean,
            default: false
        },
        cancelAtPeriodEnd: {
            type: Boolean,
            default: false
        },
        planExpiresAt: {
            type: Date,
            default: null
        },
        currentPeriodStart: {
            type: Date,
            default: Date.now
        },
        currentPeriodEnd: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        dynamicQrLimit: {
            type: Number,
            default: 50 // Growth tier limit during trial
        },
        analyticsEnabled: {
            type: Boolean,
            default: true // Growth trial has full analytics
        },
        whatsappAlertsUsedThisMonth: {
            type: Number,
            default: 0
        },
        hasReceivedOverageWarningThisMonth: {
            type: Boolean,
            default: false
        },
        downgradeAppliedAt: {
            type: Date,
            default: null
        },
        gateway: {
            type: String,
            enum: ["razorpay", "stripe"],
            default: "razorpay"
        },
        currency: {
            type: String,
            default: "INR"
        },
        stripeCustomerId: { type: String, default: null },
        stripeSubscriptionId: { type: String, default: null },
        razorpayCustomerId: { type: String, default: null },
        razorpaySubscriptionId: { type: String, default: null }
    },
    billing: {
        companyName: { type: String, default: null },
        gstNumber: { type: String, default: null },
        address: {
            line1: { type: String, default: null },
            city: { type: String, default: null },
            state: { type: String, default: null },
            pincode: { type: String, default: null }
        }
    },
    // Onboarding
    hasCreatedFirstQR: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

// 1. middleware
userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;
    const salt = await bcrypt.genSalt(5);
    this.password = await bcrypt.hash(this.password, salt);
});

// 2. Insatance methods
// Method to verify password during login
userSchema.methods.comparePassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};
// Method to generate a short-lived access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({ id: this._id }, env.JWT_SECRET, { expiresIn: "15m" });
};

// Method to generate a long-lived refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({ id: this._id }, env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export const User = mongoose.model("User", userSchema);