import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { QRCode } from './models/QRCode.js';
import { User } from './models/User.js';
import { Scan } from './models/Scan.js';

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        const user = await User.findOne();
        if (!user) return console.log('No user found');

        let qr = await QRCode.findOne({ user_id: user._id, target_url: { $exists: true, $ne: "" } });
        
        console.log(`Testing QR Redirect for ${qr.short_id}...`);
        
        const hitRedirect = async () => {
             const response = await fetch(`http://localhost:5000/r/${qr.short_id}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
                },
                redirect: 'manual'
            });
            console.log('Redirect Status:', response.status);
        }

        // Hit it twice with the same IP/UA
        await hitRedirect();
        await hitRedirect();

        // Check Dashboard Data directly via internal simulation (skipping auth middleware for test script)
        console.log("Checking dashboard data directly from the DB");
        setTimeout(async () => {
            const currentScans = await Scan.find({ qr_id: qr._id }).select('sessionContext');
            const uniqueScanners = new Set(currentScans.map(s => s.sessionContext)).size;
            console.log(`Total Scans in DB for this QR: ${currentScans.length}`);
            console.log(`Unique Scanners: ${uniqueScanners}`);

            process.exit(0);
        }, 3000);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

test();
