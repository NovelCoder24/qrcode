import cron from 'node-cron';
import axios from 'axios';
import { QRCode } from '../models/QRCode.js';
import { User } from '../models/User.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Configure simple mock nodemailer transport
// (In production, use Resend, Amazon SES, etc.)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
        user: process.env.SMTP_USER || 'dummy',
        pass: process.env.SMTP_PASS || 'dummy'
    }
});

// Configure Twilio (requires env vars in production)
const twilioClient = process.env.TWILIO_ACCOUNT_SID 
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const sendHealthAlert = async (user, qrCode, reason) => {
    const title = qrCode.metadata?.title || 'Untitled';
    const message = `
    🚨 QRVibe Health Alert: Your QR Code "${title}" is experiencing issues.
    
    The destination link (${qrCode.target_url}) returned: ${reason}
    
    Please log in to your dashboard to update the destination link immediately so your QR scans continue to function perfectly.
    `;

    try {
        await transporter.sendMail({
            from: '"QRVibe Monitoring" <alerts@qrvibe.io>',
            to: user.email,
            subject: `🚨 URGENT: Broken Link Detected for QR "${title}"`,
            text: message
        });
        
        console.log(`[Health Monitor] Email alert dispatched to ${user.email} for QR Code: ${qrCode.short_id}`);
    } catch (error) {
        console.error("[Health Monitor] Failed to send alert email", error.message);
    }

    // Try to send WhatsApp via Twilio if configured and user has a number
    if (twilioClient && user.whatsappNumber) {
        try {
            const shortMessage = `🚨 *QRVibe Alert*\nYour QR Code "${title}" is broken. The provided link returned: ${reason}.\nPlease log in to fix it immediately.`;
            await twilioClient.messages.create({
                body: shortMessage,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_SENDER || '+14155238886'}`,
                to: `whatsapp:${user.whatsappNumber}`
            });
            console.log(`[Health Monitor] WhatsApp alert dispatched to ${user.whatsappNumber} for QR Code`);
        } catch (waError) {
            console.error("[Health Monitor] Failed to send WhatsApp alert:", waError.message);
        }
    }
}

export const runHealthCheck = async () => {
    console.log(`[Health Monitor] Starting manual URL ping routine at ${new Date().toISOString()}`);

    try {
        // Check all QRs that redirect directly to a real external URL
        const qrcodes = await QRCode.find({
            isActive: true, // Only if not manually paused by user
            qr_type: { $in: ['URL', 'Video', 'Audio', 'Image', 'Instagram', 'Facebook', 'WhatsApp'] },
            target_url: { $exists: true, $ne: "" }
        }).populate('user_id'); // Populate user for email sending

        for (let qr of qrcodes) {
            try {
                // Perform GET ping
                const response = await axios.get(qr.target_url, { 
                    timeout: 10000, 
                    maxRedirects: 3,
                    validateStatus: status => status >= 200 && status < 400, // Valid range
                    headers: {
                        'User-Agent': 'QRVibe-HealthBot/1.0'
                    }
                });

                // Passed tests
                qr.health_status = 'active';
            } catch (error) {
                // Failed tests (500s, 404s, timeouts, ENOTFOUND)
                const errorReason = error.response ? `HTTP ${error.response.status}` : error.message;
                
                // Only alert them the FIRST time it breaks, don't spam them daily
                if (qr.health_status !== 'broken') {
                    await sendHealthAlert(qr.user_id, qr, errorReason);
                }
                qr.health_status = 'broken';
            }

            qr.last_pinged_at = new Date();
            await qr.save();
        }
        console.log(`[Health Monitor] Cycle complete. Checked ${qrcodes.length} links.`);

    } catch (jobError) {
        console.error(`[Health Monitor] Fatal error running Health Check:`, jobError);
    }
};

export const runTrialExpirationCheck = async () => {
    console.log(`[Trial Monitor] Running trial expiration check at ${new Date().toISOString()}`);
    try {
        const result = await User.updateMany(
            {
                "subscription.status": "trialing",
                "subscription.trialEndsAt": { $lt: new Date() }
            },
            {
                $set: {
                    "subscription.plan": "starter",
                    "subscription.status": "expired"
                }
            }
        );
        if (result.modifiedCount > 0) {
            console.log(`[Trial Monitor] Automatically downgraded ${result.modifiedCount} expired trials to free starter plan.`);
        }
    } catch (error) {
        console.error(`[Trial Monitor] Error running trial expiration check:`, error);
    }
};

export const initHealthMonitor = () => {
    // Schedule to run every 24 hours at midnight
    // Cron timing: '0 0 * * *' means "At 00:00 every day"
    cron.schedule('0 0 * * *', runHealthCheck);
    cron.schedule('0 0 * * *', runTrialExpirationCheck);

    console.log("[Service] Automatic Health Monitor & Trial Verification active (cron set to midnight).");
};
