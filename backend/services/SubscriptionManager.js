import { User } from "../models/User.js";
import { QRCode } from "../models/QRCode.js";

/**
 * Service to manage subscription state transitions, specifically
 * handling the soft-downgrade architecture for QR codes.
 */
class SubscriptionManager {
    /**
     * Executes a soft-downgrade for a user.
     * Keeps the Top N (based on dynamicQrLimit) QR codes dynamic,
     * and sets the rest to static_locked.
     * @param {string} userId - The user's ID
     */
    static async downgradeUser(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const limit = user.subscription?.dynamicQrLimit || 5;

        // 1. Find all active QRs for the user
        const qrs = await QRCode.find({
            user_id: userId,
            isActive: true,
            accessMode: 'dynamic_active'
        }).sort({ 'stats.total_scans': -1 }); // Sort by total scans Descending

        // 2. Identify which ones to lock
        if (qrs.length > limit) {
            const qrsToLock = qrs.slice(limit);
            const qrIdsToLock = qrsToLock.map(qr => qr._id);

            // 3. Bulk update to static_locked
            await QRCode.updateMany(
                { _id: { $in: qrIdsToLock } },
                { $set: { accessMode: 'static_locked' } }
            );
            console.log(`[SubscriptionManager] Downgraded ${qrIdsToLock.length} QR codes to static_locked for user ${userId}`);
        }

        // 4. Update User record
        user.subscription.status = 'expired'; // Or starter, depending on your logic, but typical downgrade goes to expired if trial, or past_due/canceled. Let's assume the caller manages the exact status, but we record the downgrade time.
        user.subscription.analyticsEnabled = false; // Disables account-wide advanced analytics if applicable
        user.subscription.downgradeAppliedAt = new Date();
        user.subscription.cancelAtPeriodEnd = false; // Reset this flag since it's processed
        await user.save();

        return {
            success: true,
            totalQrs: qrs.length,
            locked: Math.max(0, qrs.length - limit),
            keptActive: Math.min(qrs.length, limit)
        };
    }

    /**
     * Restores locked QR codes when a user upgrades.
     * @param {string} userId - The user's ID
     * @param {string} newPlan - The new plan name (e.g., 'pro')
     */
    static async upgradeUser(userId, newPlan = 'pro') {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        // 1. Restore all static_locked QRs back to dynamic_active
        const result = await QRCode.updateMany(
            { user_id: userId, accessMode: 'static_locked' },
            { $set: { accessMode: 'dynamic_active' } }
        );

        // 2. Update user limits and status
        user.subscription.plan = newPlan;
        user.subscription.status = 'active';
        user.subscription.analyticsEnabled = true;
        // Typically these would be based on plan tiers:
        user.subscription.dynamicQrLimit = newPlan === 'pro' ? 50 : (newPlan === 'business' ? 500 : 5); 
        user.subscription.downgradeAppliedAt = null;
        await user.save();

        console.log(`[SubscriptionManager] Upgraded user ${userId} to ${newPlan}. Restored ${result.modifiedCount} QR codes.`);

        return {
            success: true,
            restoredCount: result.modifiedCount
        };
    }
}

export default SubscriptionManager;
