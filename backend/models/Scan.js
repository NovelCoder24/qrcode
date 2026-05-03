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
    sessionContext: String
}, {
    timestamps: true,
    versionKey: false
});

// Compound index for instant Top Cities aggregation (millions of rows)
scanSchema.index({ qr_id: 1, "location.city": 1 });

// Time-series indexes
scanSchema.index({ createdAt: -1 });
scanSchema.index({ owner_id: 1, createdAt: -1 });
scanSchema.index({ qr_id: 1, createdAt: -1 });

export const Scan = mongoose.model("Scan", scanSchema);
