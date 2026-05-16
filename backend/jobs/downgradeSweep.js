import cron from 'node-cron';
import { User } from '../models/User.js';
import SubscriptionManager from '../services/SubscriptionManager.js';
import { withJobLock } from '../utils/jobLock.js';

/**
 * Sweeps for users whose plans have expired or whose trial has ended,
 * and triggers the soft-downgrade architecture to lock excess QR codes.
 */
const runDowngradeSweep = async () => {
    const JOB_NAME = 'downgrade-sweep';
    
    await withJobLock(JOB_NAME, 5 * 60 * 1000, async () => {
        console.log(`[Job: ${JOB_NAME}] Starting sweep for expired subscriptions...`);
        const startTime = Date.now();

        try {
            const now = new Date();

            // Find users who need downgrading:
            // 1. Plan has expired (planExpiresAt is in the past)
            // 2. Not already downgraded (downgradeAppliedAt is null)
            // 3. Or, trial has ended and they haven't upgraded
            const usersToDowngrade = await User.find({
                $or: [
                    {
                        planExpiresAt: { $lt: now, $ne: null },
                        'subscription.downgradeAppliedAt': null
                    },
                    {
                        'subscription.status': 'trialing',
                        'subscription.trialEndsAt': { $lt: now },
                        'subscription.downgradeAppliedAt': null
                    }
                ]
            });

            console.log(`[Job: ${JOB_NAME}] Found ${usersToDowngrade.length} users to downgrade.`);

            for (const user of usersToDowngrade) {
                try {
                    await SubscriptionManager.downgradeUser(user._id);
                    console.log(`[Job: ${JOB_NAME}] Successfully downgraded user ${user.email}`);
                } catch (err) {
                    console.error(`[Job: ${JOB_NAME}] Failed to downgrade user ${user.email}:`, err);
                }
            }

            const duration = Date.now() - startTime;
            console.log(`[Job: ${JOB_NAME}] Completed in ${duration}ms. Processed ${usersToDowngrade.length} users.`);

        } catch (error) {
            console.error(`[Job: ${JOB_NAME}] Fatal Error:`, error);
        }
    });
};

// Run daily at midnight (server time)
cron.schedule('0 0 * * *', runDowngradeSweep);

export default runDowngradeSweep;
