import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Scan } from '../models/Scan.js';
import { DailyScanStats } from '../models/DailyScanStats.js';

dotenv.config();

const sanitizeKey = (str) => {
    if (!str) return 'Unknown';
    return String(str).replace(/\./g, '_').replace(/\$/g, '_');
};

const backfill = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        console.log("Clearing existing DailyScanStats...");
        await DailyScanStats.deleteMany({});
        console.log("Cleared.");

        console.log("Starting backfill via streaming cursor...");
        const cursor = Scan.find({}).cursor();

        // In-memory stats accumulator
        // Key: `${qr_id}|${YYYY-MM-DD}`
        const statsMap = new Map();
        
        let processed = 0;

        for await (const scan of cursor) {
            const dateStr = scan.createdAt.toISOString().split('T')[0];
            const qrIdStr = scan.qr_id.toString();
            const key = `${qrIdStr}|${dateStr}`;

            if (!statsMap.has(key)) {
                statsMap.set(key, {
                    qr_id: scan.qr_id,
                    date: dateStr,
                    total_scans: 0,
                    unique_scans: 0,
                    sessions: new Set(),
                    devices: { desktop: 0, mobile: 0, tablet: 0, unknown: 0 },
                    os: {},
                    browsers: {},
                    countries: {},
                    cities: {},
                    campaigns: {}
                });
            }

            const stat = statsMap.get(key);

            stat.total_scans++;

            if (scan.sessionContext) {
                if (!stat.sessions.has(scan.sessionContext)) {
                    stat.sessions.add(scan.sessionContext);
                    stat.unique_scans++;
                }
            }

            // Devices
            const deviceType = scan.device?.type || 'unknown';
            if (stat.devices[deviceType] !== undefined) {
                stat.devices[deviceType]++;
            } else {
                stat.devices.unknown++;
            }

            // OS
            const os = sanitizeKey(scan.device?.os);
            stat.os[os] = (stat.os[os] || 0) + 1;

            // Browser
            const browser = sanitizeKey(scan.device?.browser);
            stat.browsers[browser] = (stat.browsers[browser] || 0) + 1;

            // Location
            if (scan.location) {
                const country = sanitizeKey(scan.location.country_code);
                const city = sanitizeKey(scan.location.city);
                if (country !== 'Unknown') stat.countries[country] = (stat.countries[country] || 0) + 1;
                if (city !== 'Unknown') stat.cities[city] = (stat.cities[city] || 0) + 1;
            }

            // Campaigns
            if (scan.campaign && scan.campaign.slug) {
                const campaignSlug = sanitizeKey(scan.campaign.slug);
                stat.campaigns[campaignSlug] = (stat.campaigns[campaignSlug] || 0) + 1;
            } else if (scan.campaign && scan.campaign.campaign) {
                const campaignName = sanitizeKey(scan.campaign.campaign);
                stat.campaigns[campaignName] = (stat.campaigns[campaignName] || 0) + 1;
            } else {
                stat.campaigns['organic'] = (stat.campaigns['organic'] || 0) + 1;
            }

            processed++;
            if (processed % 10000 === 0) {
                console.log(`Processed ${processed} scans...`);
            }
        }

        console.log(`Finished reading cursor. Total scans processed: ${processed}`);
        console.log(`Preparing to write ${statsMap.size} daily stat documents...`);

        const bulkOps = [];
        for (const [key, stat] of statsMap.entries()) {
            // Remove the Set before saving to Mongo
            delete stat.sessions;
            
            bulkOps.push({
                updateOne: {
                    filter: { qr_id: stat.qr_id, date: stat.date },
                    update: { $set: stat },
                    upsert: true
                }
            });

            // Execute in batches of 1000 to prevent BSON size limits
            if (bulkOps.length >= 1000) {
                await DailyScanStats.bulkWrite(bulkOps);
                bulkOps.length = 0;
            }
        }

        // Flush remaining
        if (bulkOps.length > 0) {
            await DailyScanStats.bulkWrite(bulkOps);
        }

        console.log("Backfill completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Backfill failed:", error);
        process.exit(1);
    }
};

backfill();
