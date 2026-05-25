import { env } from "./config/env.js";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import app from "./app.js";
import { initHealthMonitor } from "./jobs/healthMonitor.js";
import { initDowngradeSweep } from "./jobs/downgradeSweep.js";

// Connect to database
connectDB();

const PORT = env.PORT;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT} in ${env.NODE_ENV} mode`);
    
    // Boot up the 24h cron checks ONLY if enabled for this instance
    if (env.ENABLE_IN_PROCESS_JOBS) {
        console.log("[Service] In-process jobs are enabled. Initializing health monitor.");
        initHealthMonitor();
        initDowngradeSweep();
    }
});

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
    console.log(`\n[${signal}] Received. Closing HTTP server and database connections gracefully...`);
    
    server.close(async () => {
        console.log('HTTP server closed.');
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed.');
            process.exit(0);
        } catch (err) {
            console.error('Error during MongoDB disconnection', err);
            process.exit(1);
        }
    });

    // Force exit if hanging
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
