import mongoose from 'mongoose';

const jobLockSchema = new mongoose.Schema({
    jobName: {
        type: String,
        required: true,
        unique: true
    },
    lockedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

// TTL Index for automatic cleanup if worker crashes and lock is orphaned
jobLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const JobLock = mongoose.model('JobLock', jobLockSchema);
