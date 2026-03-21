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
        type: String // mobile, tablet, desktop, smarttv, console, wearable
    },
    sessionContext: String // Used to track unique scanners (hash of IP + User-Agent)
}, {
    timestamps: true,
    versionKey: false
});

// Accurate indexing for scan analytics queries
scanSchema.index({ createdAt: -1 });
scanSchema.index({ owner_id: 1, createdAt: -1 });
scanSchema.index({ qr_id: 1, createdAt: -1 });

export const Scan = mongoose.model("Scan", scanSchema);
