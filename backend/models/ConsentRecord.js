import mongoose from 'mongoose';

const consentRecordSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    consentType: {
        type: String,
        enum: ['analytics', 'whatsapp', 'billing'],
        required: true
    },
    granted: {
        type: Boolean,
        required: true
    },
    ipHash: {
        type: String // Hashed IP for DPDP audit proof
    },
    userAgent: {
        type: String
    },
    version: {
        type: String,
        default: "1.0"
    }
}, {
    timestamps: true
});

// Maintain a historical ledger (not unique) for DPDP auditability
consentRecordSchema.index({ user_id: 1, consentType: 1, createdAt: -1 });

export const ConsentRecord = mongoose.model("ConsentRecord", consentRecordSchema);
