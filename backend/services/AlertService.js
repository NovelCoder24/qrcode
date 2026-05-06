import { AlertEvent } from '../models/AlertEvent.js';
import { Notification } from '../models/Notification.js';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: env.SMTP_PORT || 2525,
    auth: {
        user: env.SMTP_USER || 'dummy',
        pass: env.SMTP_PASS || 'dummy'
    }
});

export const sendHealthAlert = async (qr, user, errorReason) => {
    const title = qr.metadata?.title || 'Untitled';
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    // 1. 12-Hour Cooldown Check
    const recentAlert = await AlertEvent.findOne({
        qr_id: qr._id,
        alertType: 'broken_link',
        createdAt: { $gte: twelveHoursAgo }
    }).sort({ createdAt: -1 });

    if (recentAlert) {
        console.log(`[AlertService] Skipping alert for QR ${qr.short_id}: Cooldown active.`);
        return; // Prevent flapping URL spam
    }

    console.log(`[AlertService] Initiating alerts for QR ${qr.short_id} (Reason: ${errorReason})`);

    // 2. Dashboard Notification
    try {
        await Notification.create({
            user_id: user._id,
            title: `QR Code Broken: ${title}`,
            message: `The destination link returned: ${errorReason}. Please update it to resume scans.`,
            type: 'alert'
        });
    } catch (err) {
        console.error("[AlertService] Failed to create dashboard notification", err);
    }

    // 3. Email Alert
    const emailMessage = `
    🚨 QRVibe Health Alert: Your QR Code "${title}" is experiencing issues.
    
    The destination link (${qr.target_url}) returned: ${errorReason}
    
    Please log in to your dashboard to update the destination link immediately so your QR scans continue to function perfectly.
    `;

    try {
        await transporter.sendMail({
            from: '"QRVibe Monitoring" <alerts@qrvibe.io>',
            to: user.email,
            subject: `🚨 URGENT: Broken Link Detected for QR "${title}"`,
            text: emailMessage
        });
        
        await AlertEvent.create({
            qr_id: qr._id,
            alertType: 'broken_link',
            channel: 'email',
            status: 'sent',
            errorReason
        });
    } catch (error) {
        console.error("[AlertService] Failed to send alert email", error.message);
        await AlertEvent.create({
            qr_id: qr._id,
            alertType: 'broken_link',
            channel: 'email',
            status: 'failed',
            errorReason: error.message
        });
    }

    // 4. Meta WhatsApp Alert
    if (user.whatsappOptIn && user.whatsappNumber && env.META_WHATSAPP_TOKEN) {
        const templateName = env.META_WHATSAPP_TEMPLATE_NAME || 'qr_health_alert';
        const languageCode = env.META_WHATSAPP_LANGUAGE_CODE || 'en_US';
        
        try {
            const waPayload = {
                messaging_product: "whatsapp",
                to: user.whatsappNumber,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: languageCode },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: title },
                                { type: "text", text: errorReason }
                            ]
                        }
                    ]
                }
            };

            await axios.post(
                `https://graph.facebook.com/v18.0/${env.META_PHONE_NUMBER_ID}/messages`,
                waPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${env.META_WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`[AlertService] WhatsApp alert dispatched to ${user.whatsappNumber}`);
            
            await AlertEvent.create({
                qr_id: qr._id,
                alertType: 'broken_link',
                channel: 'whatsapp',
                status: 'sent',
                errorReason
            });
        } catch (waError) {
            console.error("[AlertService] Failed to send WhatsApp alert:", waError.response?.data || waError.message);
            await AlertEvent.create({
                qr_id: qr._id,
                alertType: 'broken_link',
                channel: 'whatsapp',
                status: 'failed',
                errorReason: JSON.stringify(waError.response?.data || waError.message)
            });
        }
    }
};
