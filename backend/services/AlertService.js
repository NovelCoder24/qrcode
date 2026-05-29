import { AlertEvent } from '../models/AlertEvent.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { getPlanLimits } from '../config/planConfig.js';
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

export const sendOverageWarningEmail = async (user, scanCount) => {
    const emailMessage = `
    🚨 QRVibe Fair-Use Limit Alert
    
    Hi ${user.name},
    
    Your account is currently on the Starter Plan. We noticed that your QR codes have generated ${scanCount.toLocaleString()} scans this month, which exceeds the 25,000 fair-use threshold for your plan.
    
    We have NOT blocked your QR codes — they are still redirecting normally so your business is not interrupted. However, consistent overages will require an upgrade.
    
    Please log in to your dashboard to view your analytics and upgrade to the Growth Plan for unlimited scans.
    
    Thank you,
    The QRVibe Team
    `;

    try {
        await transporter.sendMail({
            from: '"QRVibe Billing" <billing@qrvibe.io>',
            to: user.email,
            subject: `Action Required: Starter Plan Scan Limit Exceeded`,
            text: emailMessage
        });
        console.log(`[AlertService] Sent overage warning email to ${user.email} (Scans: ${scanCount})`);
    } catch (error) {
        console.error(`[AlertService] Failed to send overage email to ${user.email}`, error.message);
    }
};

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

    // ── Resolve plan limits for this user ────────────────
    const plan = user.subscription?.plan || 'free';
    const isTrial = user.subscription?.status === 'trialing';
    const limits = getPlanLimits(plan, isTrial);

    // 2. Dashboard Notification (always sent, all plans)
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

    // 3. Email Alert (local, starter, growth — not free)
    if (limits.emailAlerts) {
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
    }

    // 4. Meta WhatsApp Alert (with plan-aware cap enforcement)
    if (user.whatsappOptIn && user.whatsappNumber && env.META_WHATSAPP_TOKEN) {

        // ── WhatsApp Cap Check ───────────────────────────
        // Plan caps: free=0, local=0, starter=10/mo, growth=∞, trial=5
        if (!limits.whatsappAlerts) {
            console.log(`[AlertService] WhatsApp alerts not available on ${plan} plan. Skipping.`);
            return;
        }

        const currentUsed = user.subscription?.whatsappAlertsUsedThisMonth || 0;
        if (currentUsed >= limits.whatsappAlertsCap) {
            console.log(`[AlertService] WhatsApp cap reached (${currentUsed}/${limits.whatsappAlertsCap}) for user ${user.email}. Skipping.`);
            // Log as a soft-blocked event for dashboard visibility
            await AlertEvent.create({
                qr_id: qr._id,
                alertType: 'broken_link',
                channel: 'whatsapp',
                status: 'cap_reached',
                errorReason: `WhatsApp alert cap reached (${currentUsed}/${limits.whatsappAlertsCap})`
            });
            return;
        }

        // ── Atomic Increment BEFORE sending ──────────────
        // Prevents race condition where two alerts fire simultaneously
        const atomicResult = await User.findOneAndUpdate(
            { 
                _id: user._id, 
                "subscription.whatsappAlertsUsedThisMonth": { $lt: limits.whatsappAlertsCap } 
            },
            { $inc: { "subscription.whatsappAlertsUsedThisMonth": 1 } },
            { new: true }
        );

        if (!atomicResult) {
            console.log(`[AlertService] WhatsApp cap race-condition guard triggered for user ${user.email}. Skipping.`);
            return;
        }

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

            console.log(`[AlertService] WhatsApp alert dispatched to ${user.whatsappNumber} (${atomicResult.subscription.whatsappAlertsUsedThisMonth}/${limits.whatsappAlertsCap} used)`);
            
            await AlertEvent.create({
                qr_id: qr._id,
                alertType: 'broken_link',
                channel: 'whatsapp',
                status: 'sent',
                errorReason
            });
        } catch (waError) {
            console.error("[AlertService] Failed to send WhatsApp alert:", waError.response?.data || waError.message);
            
            // Rollback the counter on failure (best-effort)
            await User.updateOne(
                { _id: user._id },
                { $inc: { "subscription.whatsappAlertsUsedThisMonth": -1 } }
            ).catch(() => {});

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
