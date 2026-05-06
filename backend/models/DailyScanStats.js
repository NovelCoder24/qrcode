import mongoose from 'mongoose';

const dailyScanStatsSchema = new mongoose.Schema({
    qr_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QRCode",
        required: true,
        index: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    total_scans: {
        type: Number,
        default: 0
    },
    unique_scans: {
        type: Number,
        default: 0
    },
    devices: {
        desktop: { type: Number, default: 0 },
        mobile: { type: Number, default: 0 },
        tablet: { type: Number, default: 0 },
        unknown: { type: Number, default: 0 }
    },
    os: {
        type: Map,
        of: Number,
        default: {}
    },
    browsers: {
        type: Map,
        of: Number,
        default: {}
    },
    countries: {
        type: Map,
        of: Number,
        default: {}
    },
    cities: {
        type: Map,
        of: Number,
        default: {}
    },
    campaigns: {
        type: Map,
        of: Number,
        default: {}
    }
}, {
    timestamps: true
});

// Unique compound index for atomic upserts per day per QR code
dailyScanStatsSchema.index({ qr_id: 1, date: -1 }, { unique: true });

export const DailyScanStats = mongoose.model("DailyScanStats", dailyScanStatsSchema);
