import cron from 'node-cron';
import axios from 'axios';
import { QRCode } from '../models/QRCode.js';
import { User } from '../models/User.js';
import { withJobLock } from '../utils/jobLock.js';
import { sendHealthAlert } from '../services/AlertService.js';

export const runHealthCheck = async () => {
    console.log(`[Health Monitor] Starting manual URL ping routine at ${new Date().toISOString()}`);

    try {
        // Check all QRs that redirect directly to a real external URL
        const qrcodes = await QRCode.find({
            isActive: true, // Only if not manually paused by user
            qr_type: { $in: ['URL', 'Video', 'Audio', 'Image', 'Instagram', 'Facebook', 'WhatsApp'] },
            target_url: { $exists: true, $ne: "" }
        }).populate('user_id'); // Populate user for alert sending

        for (let qr of qrcodes) {
            let errorReason = null;
            let success = false;

            try {
                // First try HEAD request to save bandwidth
                await axios.head(qr.target_url, { 
                    timeout: 8000, // strict 8s timeout
                    maxRedirects: 3,
                    validateStatus: status => status >= 200 && status < 400,
                    headers: { 'User-Agent': 'QRVibe-HealthBot/1.0' }
                });
                success = true;
            } catch (headError) {
                // If HEAD fails with 405 Method Not Allowed, or generic 403, fallback to GET
                if (headError.response?.status === 405 || headError.response?.status === 403 || headError.response?.status === 501) {
                    try {
                        await axios.get(qr.target_url, {
                            timeout: 8000, // strict 8s timeout
                            maxRedirects: 3,
                            validateStatus: status => status >= 200 && status < 400,
                            headers: { 'User-Agent': 'QRVibe-HealthBot/1.0' }
                        });
                        success = true;
                    } catch (getError) {
                        errorReason = getError.response ? `HTTP ${getError.response.status}` : (getError.code === 'ECONNABORTED' ? 'Timeout' : getError.message);
                    }
                } else {
                    errorReason = headError.response ? `HTTP ${headError.response.status}` : (headError.code === 'ECONNABORTED' ? 'Timeout' : headError.message);
                }
            }

            if (success) {
                qr.health_status = 'active';
            } else {
                // Trigger central alert service
                // It handles 12-hour cooldown checks internally
                await sendHealthAlert(qr, qr.user_id, errorReason);
                qr.health_status = 'broken';
            }

            qr.last_pinged_at = new Date();
            await qr.save();
        }
        console.log(`[Health Monitor] Cycle complete. Checked ${qrcodes.length} links.`);

    } catch (jobError) {
        console.error(`[Health Monitor] Fatal error running Health Check:`, jobError);
    }
};

export const runTrialExpirationCheck = async () => {
    console.log(`[Trial Monitor] Running trial expiration check at ${new Date().toISOString()}`);
    try {
        const result = await User.updateMany(
            {
                "subscription.status": "trialing",
                "subscription.trialEndsAt": { $lt: new Date() }
            },
            {
                $set: {
                    "subscription.plan": "starter",
                    "subscription.status": "expired"
                }
            }
        );
        if (result.modifiedCount > 0) {
            console.log(`[Trial Monitor] Automatically downgraded ${result.modifiedCount} expired trials to free starter plan.`);
        }
    } catch (error) {
        console.error(`[Trial Monitor] Error running trial expiration check:`, error);
    }
};

export const initHealthMonitor = () => {
    // We use a 5-minute timeout for the lock as a fallback
    const FIVE_MINUTES = 5 * 60 * 1000;

    cron.schedule('0 0 * * *', async () => {
        await withJobLock('daily_health_check', FIVE_MINUTES, runHealthCheck);
    });

    cron.schedule('0 0 * * *', async () => {
        await withJobLock('daily_trial_check', FIVE_MINUTES, runTrialExpirationCheck);
    });

    console.log("[Service] Automatic Health Monitor & Trial Verification active with Mutex Locks (cron set to midnight).");
};
