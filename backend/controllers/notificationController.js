import { Notification } from "../models/Notification.js";
import { QRCode } from "../models/QRCode.js";

// @desc    Get notifications for the logged-in user + unread count
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch user's active/existing QR codes to auto-prune orphaned alerts from deleted QRs
        const existingQrs = await QRCode.find({ user_id: userId })
            .select('_id target_url metadata health_status')
            .lean();

        const validQrIds = new Set(existingQrs.map((q) => String(q._id)));
        const brokenQrs = existingQrs.filter((q) => q.health_status === 'broken');

        const rawNotifications = await Notification.find({ user_id: userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const orphanIds = [];
        const validNotifications = [];

        for (const notif of rawNotifications) {
            const isQrAlert = notif.type === 'alert' || notif.type === 'recovery';
            if (isQrAlert) {
                if (notif.qr_id && !validQrIds.has(String(notif.qr_id))) {
                    orphanIds.push(notif._id);
                    continue;
                }
                // Legacy notifications created before qr_id was added to Notification schema:
                // only keep if the user currently has a broken QR whose hostname/URL appears in the message
                if (!notif.qr_id) {
                    const matchesCurrentBrokenQr = brokenQrs.some((q) => {
                        if (!q.target_url) return false;
                        try {
                            const host = new URL(q.target_url).hostname;
                            return host && notif.message?.includes(host);
                        } catch {
                            return notif.message?.includes(q.target_url);
                        }
                    });
                    if (!matchesCurrentBrokenQr) {
                        orphanIds.push(notif._id);
                        continue;
                    }
                }
            }
            validNotifications.push(notif);
        }

        if (orphanIds.length > 0) {
            await Notification.deleteMany({ _id: { $in: orphanIds } });
        }

        const notifications = validNotifications.slice(0, 25);
        const unreadCount = await Notification.countDocuments({ user_id: userId, isRead: false });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error("[NotificationController] Failed to fetch notifications:", error);
        res.status(500).json({ message: "Failed to load notifications" });
    }
};

// @desc    Mark all notifications as read for the logged-in user
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user_id: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: "All notifications marked as read", unreadCount: 0 });
    } catch (error) {
        console.error("[NotificationController] Failed to mark all read:", error);
        res.status(500).json({ message: "Failed to update notifications" });
    }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user._id },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const unreadCount = await Notification.countDocuments({
            user_id: req.user._id,
            isRead: false
        });

        res.json({ notification, unreadCount });
    } catch (error) {
        console.error("[NotificationController] Failed to mark notification read:", error);
        res.status(500).json({ message: "Failed to update notification" });
    }
};

// @desc    Delete/dismiss a single notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
    try {
        const deleted = await Notification.findOneAndDelete({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!deleted) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const unreadCount = await Notification.countDocuments({
            user_id: req.user._id,
            isRead: false
        });

        res.json({ message: "Notification dismissed", unreadCount });
    } catch (error) {
        console.error("[NotificationController] Failed to delete notification:", error);
        res.status(500).json({ message: "Failed to dismiss notification" });
    }
};
