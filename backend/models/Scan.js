import mongoose from "mongoose";

const scanSchema = new mongoose.Schema({
    qr_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QRCode",
        required: true,
        index: true
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    location: {
        country: String,
        country_code: String,
        city: String,
        region: String,
        district: String,
        pincode: String,
        timezone: String,
        source: { type: String, default: "ip" }, // "ip", "placement", or "gps"
        accuracy: Number,
        ll: [Number]
    },
    ipCity: String,
    ipDiscrepancy: Boolean,
    telemetryToken: {
        type: String,
        index: { sparse: true }
    },
    // Architecture D: Atomic Telemetry Reconciliation fields
    dateBucket: {
        type: String,
        index: true
    },
    appliedCityKey: {
        type: String,
        default: "unknown"
    },
    appliedLocationKey: {
        type: String,
        default: "unknown"
    },
    geoConfidence: {
        type: String,
        enum: ["HIGH", "MEDIUM", "LOW", "TELEMETRY_VERIFIED", "GPS_EXACT"],
        default: "MEDIUM"
    },
    telemetryReconciled: {
        type: Boolean,
        default: false
    },
    device: {
        os: String,
        browser: String,
        type: { type: String }
    },
    isBot: {
        type: Boolean,
        default: false,
        index: true
    },
    sessionContext: String,
    campaign: {
        category: String,
        slug: String,
        channel: String,
        source: String, // utm_source
        medium: String, // utm_medium
        content: String, // utm_content
        term: String // utm_term
    }
}, {
    timestamps: true,
    versionKey: false
});

// Minimal indexes for raw exports, drill-downs, and telemetry lookup
scanSchema.index({ qr_id: 1, createdAt: -1 });
scanSchema.index({ owner_id: 1, "campaign.category": 1, createdAt: -1 });

export const Scan = mongoose.model("Scan", scanSchema);
