import { env } from "./config/env.js";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import { initHealthMonitor } from "./jobs/healthMonitor.js";
import { initDowngradeSweep } from "./jobs/downgradeSweep.js";

const startWorker = async () => {
    if (!env.RUN_WORKER) {
        console.log("RUN_WORKER is false. Exiting worker process.");
        process.exit(0);
    }

    console.log("Starting Background Worker Process...");
    await connectDB();

    console.log("[Worker] Initializing cron jobs...");
    initHealthMonitor();
    initDowngradeSweep();

    console.log("[Worker] Background Worker is running and waiting for jobs.");
};

startWorker().catch(err => {
    console.error("[Worker] Failed to start:", err);
    process.exit(1);
});

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
    console.log(`\n[${signal}] Received. Closing worker and database connections gracefully...`);
    
    try {
        await mongoose.connection.close();
        console.log('[Worker] MongoDB connection closed.');
        process.exit(0);
    } catch (err) {
        console.error('[Worker] Error during MongoDB disconnection', err);
        process.exit(1);
    }

    // Force exit if hanging
    setTimeout(() => {
        console.error('[Worker] Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
