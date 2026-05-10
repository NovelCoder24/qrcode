/**
 * Manual Health Check Test Script
 * 
 * Connects to MongoDB and runs a single health check cycle.
 * Usage: node scripts/testHealthCheck.js
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { runHealthCheck } from '../jobs/healthMonitor.js';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set in .env");
    process.exit(1);
}

console.log("🔌 Connecting to MongoDB...");

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("✅ MongoDB connected.");
        console.log("🏥 Running Health Check...\n");

        await runHealthCheck();

        console.log("\n✅ Health Check complete. Check your WhatsApp & Email!");
        await mongoose.disconnect();
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });
