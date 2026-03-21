import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { runHealthCheck } from '../jobs/healthMonitor.js';

dotenv.config();

const triggerManualCheck = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected successfully.");

        console.log("Running manual Health Check cycle...");
        await runHealthCheck();
        
        console.log("Manual trigger finished. Check your terminal logs and Email/WhatsApp for any alerts.");
        process.exit(0);
    } catch (error) {
        console.error("Error triggering health check:", error);
        process.exit(1);
    }
};

triggerManualCheck();
