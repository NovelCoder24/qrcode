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
        timezone: String,
        ll: [Number]
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

// Minimal indexes for raw exports and drill-downs
scanSchema.index({ qr_id: 1, createdAt: -1 });
scanSchema.index({ owner_id: 1, "campaign.category": 1, createdAt: -1 });

export const Scan = mongoose.model("Scan", scanSchema);
