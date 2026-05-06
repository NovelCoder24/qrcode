import { JobLock } from '../models/JobLock.js';

/**
 * Wrapper for cron jobs to ensure they only run once across multiple instances.
 * @param {string} jobName - Unique identifier for the job
 * @param {number} timeoutMs - Max time lock is held before fallback TTL expires (e.g. 5 * 60 * 1000)
 * @param {Function} jobFunction - The async job to execute
 */
export const withJobLock = async (jobName, timeoutMs, jobFunction) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + timeoutMs);

    try {
        try {
            // Attempt 1: Try to create a brand new lock
            await JobLock.create({ jobName, lockedAt: now, expiresAt });
        } catch (error) {
            // E11000 means the lock document already exists
            if (error.code === 11000) {
                // Attempt 2: If the existing lock has expired, forcefully take it over atomically
                const existingLock = await JobLock.findOneAndUpdate(
                    { jobName, expiresAt: { $lt: now } }, // Condition: must be expired
                    { $set: { lockedAt: now, expiresAt } },
                    { new: true }
                );
                
                if (!existingLock) {
                    // Lock is active and held by another instance. Skip.
                    console.log(`[JobLock] Job '${jobName}' is currently locked by another instance. Skipping.`);
                    return;
                }
            } else {
                throw error; // Re-throw unhandled DB errors
            }
        }

        // --- WE ACQUIRED THE LOCK ---
        console.log(`[JobLock] Acquired lock for '${jobName}'. Executing job...`);

        try {
            await jobFunction();
        } finally {
            // Guarantee release: Delete lock whether job succeeds or fails
            await JobLock.deleteOne({ jobName });
            console.log(`[JobLock] Released lock for '${jobName}'.`);
        }

    } catch (err) {
        console.error(`[JobLock] Critical error in wrapper for '${jobName}':`, err);
    }
};
