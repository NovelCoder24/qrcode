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
    plan: {
        type: String,
        enum: ["starter", "basic", "pro", "business"],
        default: "starter"
    },
    trialEndsAt: { 
        type: Date, 
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
    },
    stripeCustomerId: { 
        type: String, 
        default: null 
    },
    stripeSubscriptionId: { 
        type: String, 
        default: null 
    },
    subscriptionStatus: {
        type: String,
        enum: ["trialing", "active", "past_due", "canceled", "expired"],
        default: "trialing"
    },
    // Razorpay fields
    razorpayCustomerId: {
        type: String,
        default: null
    },
    razorpaySubscriptionId: {
        type: String,
        default: null
    },
    // GST fields for invoicing
    gstNumber: {
        type: String,
        default: null
    },
    billingAddress: {
        companyName: { type: String, default: null },
        address: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        pincode: { type: String, default: null }
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