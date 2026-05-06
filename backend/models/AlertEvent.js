import mongoose from 'mongoose';

const alertEventSchema = new mongoose.Schema({
    qr_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QRCode",
        required: true
    },
    alertType: {
        type: String,
        enum: ['broken_link', 'health_warning'],
        required: true
    },
    channel: {
        type: String,
        enum: ['email', 'whatsapp'],
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'failed'],
        required: true
    },
    errorReason: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index to quickly find the most recent alert for a specific QR code
// This is essential for the application-level 12-hour cooldown query
alertEventSchema.index({ qr_id: 1, createdAt: -1 });

export const AlertEvent = mongoose.model("AlertEvent", alertEventSchema);
