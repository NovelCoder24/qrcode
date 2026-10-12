import { AlertEvent } from '../models/AlertEvent.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { getPlanLimits } from '../config/planConfig.js';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { env } from '../config/env.js';

const smtpPort = Number(env.SMTP_PORT) || 2525;
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: env.SMTP_USER || 'dummy',
        pass: env.SMTP_PASS || 'dummy'
    }
});

const getSenderAddress = (label, fallbackEmail) => {
    const email = env.SMTP_USER && env.SMTP_USER.includes('@') ? env.SMTP_USER : fallbackEmail;
    return `"${label}" <${email}>`;
};

export const sendOverageWarningEmail = async (user, scanCount) => {
    const emailMessage = `
    🚨 QRVibe Fair-Use Limit Alert
    
    Hi ${user.name},
    
    Your account is currently on the Starter Plan. We noticed that your QR codes have generated ${scanCount.toLocaleString()} scans this month, which exceeds the 25,000 fair-use threshold for your plan.
    
    We have NOT blocked your QR codes — they are still redirecting normally so your business is not interrupted. However, consistent overages will require an upgrade.
    
    Please log in to your dashboard (${env.FRONTEND_URL}/billing) to view your analytics and upgrade to the Growth Plan for unlimited scans.
    
    Thank you,
    The QRVibe Team
    `;

    try {
        await Notification.create({
            user_id: user._id,
            title: 'Starter Plan Scan Limit Reached',
            message: `Your QR codes reached ${scanCount.toLocaleString()} scans this month. Upgrade to Growth for unlimited scans.`,
            type: 'billing',
            actionUrl: '/billing'
        });
    } catch (notifErr) {
        console.error('[AlertService] Failed to create overage dashboard notification:', notifErr.message);
    }

    try {
        await transporter.sendMail({
            from: getSenderAddress('QRVibe Billing', 'billing@qrvibe.io'),
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
    if (!qr || !user) return { alerted: false, reason: 'missing_context' };

    const title = qr.metadata?.title || 'Untitled';
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    // 1. Smart 12-Hour Cooldown Check (only when an alert was successfully sent)
    const recentSentAlert = await AlertEvent.findOne({
        qr_id: qr._id,
        alertType: 'broken_link',
        status: 'sent',
        createdAt: { $gte: twelveHoursAgo }
    }).sort({ createdAt: -1 });

    if (recentSentAlert) {
        console.log(`[AlertService] Skipping alert for QR ${qr.short_id}: 12h cooldown active.`);
        return { alerted: false, reason: 'cooldown' };
    }

    console.log(`[AlertService] Initiating health alerts for QR ${qr.short_id} (Reason: ${errorReason})`);

    // ── Resolve plan limits for this user ────────────────
    const plan = user.subscription?.plan || 'free';
    const isTrial = user.subscription?.status === 'trialing';
    const limits = getPlanLimits(plan, isTrial);
    const fixUrl = `/qrcodes/${qr._id}`;

    // 2. In-Dashboard Notification (always sent across all plans, deduplicated over 12h)
    let dashboardNotified = false;
    try {
        const existingNotif = await Notification.findOne({
            user_id: user._id,
            qr_id: qr._id,
            type: 'alert',
            createdAt: { $gte: twelveHoursAgo }
        });

        if (!existingNotif) {
            await Notification.create({
                user_id: user._id,
                qr_id: qr._id,
                title: `QR Code Broken: ${title}`,
                message: `Destination (${qr.target_url}) returned ${errorReason}. Update it to keep scans working.`,
                type: 'alert',
                actionUrl: fixUrl
            });
        }
        dashboardNotified = true;
    } catch (err) {
        console.error("[AlertService] Failed to create dashboard notification", err);
    }

    // 3. Email Health Alert (enabled across all tiers including Free, respects user opt-in)
    const emailOptIn = user.emailAlertsOptIn !== false;
    if (limits.emailAlerts && emailOptIn && user.email) {
        const emailMessage = [
            `🚨 QRVibe Health Alert: Your QR Code "${title}" has a broken destination link.`,
            ``,
            `• QR Code: ${title} (/r/${qr.short_id})`,
            `• Destination URL: ${qr.target_url}`,
            `• Error Detected: ${errorReason}`,
            ``,
            `Fix this QR code immediately without reprinting:`,
            `${env.FRONTEND_URL}${fixUrl}`,
            ``,
            `— QRVibe Automated Link Monitor`
        ].join('\n');

        try {
            await transporter.sendMail({
                from: getSenderAddress('QRVibe Monitoring', 'alerts@qrvibe.io'),
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
            return { alerted: true, channel: 'email' };
        } catch (error) {
            console.error("[AlertService] Failed to send alert email:", error.message);
            await AlertEvent.create({
                qr_id: qr._id,
                alertType: 'broken_link',
                channel: 'email',
                status: 'failed',
                errorReason: error.message
            });
            return { alerted: dashboardNotified, channel: 'dashboard', emailError: error.message };
        }
    } else if (dashboardNotified) {
        // User opted out of email alerts; record dashboard event so 12h cooldown prevents spam
        await AlertEvent.create({
            qr_id: qr._id,
            alertType: 'broken_link',
            channel: 'dashboard',
            status: 'sent',
            errorReason
        });
        return { alerted: true, channel: 'dashboard' };
    }

    return { alerted: false, reason: 'no_channel_dispatched' };
};

export const sendRecoveryAlert = async (qr, user) => {
    if (!qr || !user) return;
    const title = qr.metadata?.title || 'Untitled';
    const fixUrl = `/qrcodes/${qr._id}`;

    try {
        // Mark previous unread broken-link notifications for this QR as read
        await Notification.updateMany(
            { user_id: user._id, qr_id: qr._id, type: 'alert', isRead: false },
            { $set: { isRead: true } }
        );

        await Notification.create({
            user_id: user._id,
            qr_id: qr._id,
            title: `QR Code Recovered: ${title}`,
            message: `Destination (${qr.target_url}) is back online and responding normally.`,
            type: 'recovery',
            actionUrl: fixUrl
        });

        await AlertEvent.create({
            qr_id: qr._id,
            alertType: 'link_recovered',
            channel: 'dashboard',
            status: 'sent',
            errorReason: 'Recovered (HTTP 2xx/3xx)'
        });
    } catch (error) {
        console.error("[AlertService] Failed to record recovery alert:", error.message);
    }
};

// ── Meta WhatsApp Cloud API Dispatch (Preserved for Weekly Reports) ──────────
export const sendWhatsAppTemplateMessage = async (user, {
    templateName = env.META_WHATSAPP_TEMPLATE_NAME || 'qr_weekly_report',
    languageCode = env.META_WHATSAPP_LANGUAGE_CODE || 'en_US',
    bodyParameters = [],
    qrId = null,
    alertType = 'weekly_report'
} = {}) => {
    if (!user?.whatsappOptIn || !user?.whatsappNumber || !env.META_WHATSAPP_TOKEN || !env.META_PHONE_NUMBER_ID) {
        return { sent: false, reason: 'whatsapp_not_configured_or_opted_out' };
    }

    try {
        const waPayload = {
            messaging_product: "whatsapp",
            to: user.whatsappNumber,
            type: "template",
            template: {
                name: templateName,
                language: { code: languageCode },
                components: bodyParameters.length > 0 ? [
                    {
                        type: "body",
                        parameters: bodyParameters.map(text => ({ type: "text", text: String(text) }))
                    }
                ] : []
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

        if (qrId) {
            await AlertEvent.create({
                qr_id: qrId,
                alertType,
                channel: 'whatsapp',
                status: 'sent'
            });
        }

        return { sent: true };
    } catch (waError) {
        const errMsg = JSON.stringify(waError.response?.data || waError.message);
        console.error("[AlertService] Failed to send WhatsApp message:", errMsg);
        if (qrId) {
            await AlertEvent.create({
                qr_id: qrId,
                alertType,
                channel: 'whatsapp',
                status: 'failed',
                errorReason: errMsg
            }).catch(() => {});
        }
        return { sent: false, error: errMsg };
    }
};
