import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['alert', 'recovery', 'billing', 'system'],
        default: 'alert'
    },
    qr_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QRCode",
        default: null
    },
    actionUrl: {
        type: String,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index to quickly fetch recent unread notifications for a user
notificationSchema.index({ user_id: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
