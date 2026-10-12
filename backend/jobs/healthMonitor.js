import cron from 'node-cron';
import axios from 'axios';
import { QRCode } from '../models/QRCode.js';
import { User } from '../models/User.js';
import { Scan } from '../models/Scan.js';
import { withJobLock } from '../utils/jobLock.js';
import { sendHealthAlert, sendRecoveryAlert, sendOverageWarningEmail } from '../services/AlertService.js';
import { getPlanLimits } from '../config/planConfig.js';

const HEALTH_PING_HEADERS = { 'User-Agent': 'QRVibe-HealthBot/1.0' };
const HEALTH_PING_TIMEOUT_MS = 8000;
const CONCURRENCY_LIMIT = 10;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const pingUrlOnce = async (targetUrl, httpClient = axios) => {
    try {
        await httpClient.head(targetUrl, {
            timeout: HEALTH_PING_TIMEOUT_MS,
            maxRedirects: 3,
            validateStatus: (status) => status >= 200 && status < 400,
            headers: HEALTH_PING_HEADERS
        });
        return { success: true, errorReason: null };
    } catch (headError) {
        const status = headError.response?.status;
        // Many servers block or reject HEAD with 403/405/501 — fallback to GET
        if (status === 405 || status === 403 || status === 501 || !headError.response) {
            try {
                await httpClient.get(targetUrl, {
                    timeout: HEALTH_PING_TIMEOUT_MS,
                    maxRedirects: 3,
                    validateStatus: (s) => s >= 200 && s < 400,
                    headers: HEALTH_PING_HEADERS
                });
                return { success: true, errorReason: null };
            } catch (getError) {
                const errorReason = getError.response
                    ? `HTTP ${getError.response.status}`
                    : (getError.code === 'ECONNABORTED' ? 'Timeout' : getError.message);
                return { success: false, errorReason };
            }
        }
        const errorReason = headError.response
            ? `HTTP ${headError.response.status}`
            : (headError.code === 'ECONNABORTED' ? 'Timeout' : headError.message);
        return { success: false, errorReason };
    }
};

export const checkSingleQrHealth = async (qr, options = {}) => {
    const { retryDelayMs = 3000, httpClient = axios } = options;

    if (!qr || qr.qr_type !== 'URL' || !qr.target_url || !/^https?:\/\//i.test(qr.target_url)) {
        if (qr && qr.health_status !== 'active') {
            qr.health_status = 'active';
            qr.last_pinged_at = new Date();
            await qr.save();
        }
        return { status: 'active', skipped: true };
    }

    const wasBroken = qr.health_status === 'broken';
    let result = await pingUrlOnce(qr.target_url, httpClient);

    // 2-Attempt Retry Verification: avoid false alarms from transient network blips
    if (!result.success) {
        if (retryDelayMs > 0) {
            await delay(retryDelayMs);
        }
        result = await pingUrlOnce(qr.target_url, httpClient);
    }

    const user = qr.user_id && typeof qr.user_id === 'object' && qr.user_id._id
        ? qr.user_id
        : await User.findById(qr.user_id);

    if (result.success) {
        qr.health_status = 'active';
        qr.last_pinged_at = new Date();
        await qr.save();

        if (wasBroken && user) {
            await sendRecoveryAlert(qr, user);
        }
        return { status: 'active', recovered: wasBroken };
    } else {
        qr.health_status = 'broken';
        qr.last_pinged_at = new Date();
        await qr.save();

        if (user) {
            await sendHealthAlert(qr, user, result.errorReason);
        }
        return { status: 'broken', errorReason: result.errorReason };
    }
};

export const runHealthCheck = async (options = {}) => {
    console.log(`[Health Monitor] Starting URL ping routine at ${new Date().toISOString()}`);

    try {
        // Check all active URL-type QR codes that redirect to an external website
        const qrcodes = await QRCode.find({
            isActive: true,
            accessMode: { $ne: 'disabled' },
            qr_type: 'URL',
            target_url: { $exists: true, $ne: "" }
        }).populate('user_id');

        for (let i = 0; i < qrcodes.length; i += CONCURRENCY_LIMIT) {
            const batch = qrcodes.slice(i, i + CONCURRENCY_LIMIT);
            await Promise.allSettled(batch.map((qr) => checkSingleQrHealth(qr, options)));
        }

        console.log(`[Health Monitor] Cycle complete. Checked ${qrcodes.length} links.`);
    } catch (jobError) {
        console.error(`[Health Monitor] Fatal error running Health Check:`, jobError);
    }
};

export const runTrialExpirationCheck = async () => {
    console.log(`[Trial Monitor] Running trial expiration check at ${new Date().toISOString()}`);
    try {
        const expiredUsers = await User.find({
            "subscription.status": "trialing",
            "subscription.trialEndsAt": { $lt: new Date() }
        });

        const freeLimit = getPlanLimits('free').maxQR; // 1

        if (expiredUsers.length > 0) {
            for (const user of expiredUsers) {
                user.subscription.plan = "free";
                user.subscription.status = "expired";
                user.subscription.hasSeenTrialExpiredPopup = false;
                user.subscription.dynamicQrLimit = freeLimit;
                user.subscription.analyticsEnabled = false;
                user.subscription.whatsappAlertsUsedThisMonth = 0;
                await user.save();

                // Enforce QR limit by locking excess QRs to static_locked
                // (not isActive: false, which would break printed QR codes)
                const activeQRs = await QRCode.find({ 
                    user_id: user._id,
                    isActive: true,
                    accessMode: 'dynamic_active'
                }).sort({ 'stats.total_scans': -1 }); // Keep highest-traffic ones active

                if (activeQRs.length > freeLimit) {
                    const qrsToLock = activeQRs.slice(freeLimit);
                    const qrIds = qrsToLock.map(qr => qr._id);
                    await QRCode.updateMany(
                        { _id: { $in: qrIds } },
                        { $set: { accessMode: 'static_locked' } }
                    );
                    console.log(`[Trial Monitor] Locked ${qrIds.length} QR codes to static_locked for expired user ${user._id}`);
                }
            }
            console.log(`[Trial Monitor] Automatically downgraded ${expiredUsers.length} expired trials to free plan.`);
        }
    } catch (error) {
        console.error(`[Trial Monitor] Error running trial expiration check:`, error);
    }
};

// ── Daily Billing Cycle Counter Reset ─────────────────
// Runs daily. Resets usage limits for users whose billing cycle ended.
export const runBillingCycleReset = async () => {
    console.log(`[Billing Cycle Reset] Running daily billing cycle check at ${new Date().toISOString()}`);
    try {
        const now = new Date();
        const usersToReset = await User.find({
            "subscription.currentPeriodEnd": { $lte: now }
        });

        if (usersToReset.length > 0) {
            for (const user of usersToReset) {
                user.subscription.whatsappAlertsUsedThisMonth = 0;
                user.subscription.hasReceivedOverageWarningThisMonth = false;
                
                // Roll cycle forward by 30 days safely
                let nextEnd = new Date(user.subscription.currentPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
                let nextStart = new Date(user.subscription.currentPeriodEnd);
                
                while (nextEnd <= now) {
                    nextStart = new Date(nextEnd);
                    nextEnd = new Date(nextEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
                }
                
                user.subscription.currentPeriodStart = nextStart;
                user.subscription.currentPeriodEnd = nextEnd;
                await user.save();
            }
            console.log(`[Billing Cycle Reset] Reset ${usersToReset.length} users' usage counters.`);
        }
    } catch (error) {
        console.error(`[Billing Cycle Reset] Error:`, error);
    }
};

export const runStarterOverageCheck = async () => {
    console.log(`[Overage Monitor] Running daily starter plan overage check at ${new Date().toISOString()}`);
    try {
        // Find users on starter plan who haven't received a warning this month
        const starterUsers = await User.find({ 
            "subscription.plan": "starter",
            "subscription.hasReceivedOverageWarningThisMonth": { $ne: true }
        });

        if (starterUsers.length > 0) {
            let warningsSent = 0;
            for (const user of starterUsers) {
                const periodStart = user.subscription.currentPeriodStart || new Date(new Date().setDate(1));
                const monthlyScans = await Scan.countDocuments({
                    owner_id: user._id,
                    createdAt: { $gte: periodStart }
                });

                if (monthlyScans > 25000) {
                    await sendOverageWarningEmail(user, monthlyScans);
                    user.subscription.hasReceivedOverageWarningThisMonth = true;
                    await user.save();
                    warningsSent++;
                }
            }
            console.log(`[Overage Monitor] Sent ${warningsSent} overage warnings out of ${starterUsers.length} starter users checked.`);
        }
    } catch (error) {
        console.error(`[Overage Monitor] Error running overage check:`, error);
    }
};

export const initHealthMonitor = () => {
    // We use a 5-minute timeout for the lock as a fallback
    const FIVE_MINUTES = 5 * 60 * 1000;

    // Every 6 hours: Automated link health sweep
    cron.schedule('0 */6 * * *', async () => {
        await withJobLock('daily_health_check', FIVE_MINUTES, runHealthCheck);
    });

    cron.schedule('0 0 * * *', async () => {
        await withJobLock('daily_trial_check', FIVE_MINUTES, runTrialExpirationCheck);
    });

    cron.schedule('0 0 * * *', async () => {
        await withJobLock('daily_overage_check', FIVE_MINUTES, runStarterOverageCheck);
    });

    // Daily: Reset counters for expired billing cycles
    cron.schedule('0 0 * * *', async () => {
        await withJobLock('daily_billing_cycle_reset', FIVE_MINUTES, runBillingCycleReset);
    });

    console.log("[Service] Automatic Health Monitor, Trial Verification & Billing Cycle Monitor active with Mutex Locks.");
};
