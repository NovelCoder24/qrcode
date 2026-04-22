import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    subscription: {
        plan: {
            type: String,
            enum: ["starter", "basic", "pro", "business"],
            default: "business" // Reverse Trial Strategy
        },
        status: {
            type: String,
            enum: ["trialing", "active", "past_due", "canceled", "expired"],
            default: "trialing"
        },
        trialEndsAt: { 
            type: Date, 
            default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14-Day trial
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
    return await bcrypt.compare(enteredPassword, this.password);
};
// Method to generate a short-lived access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// Method to generate a long-lived refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export const User = mongoose.model("User", userSchema);