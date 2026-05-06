import crypto from 'crypto';
import { env } from '../config/env.js';

// Verify Meta Webhook Signature
export const verifyMetaSignature = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];
    
    if (!signature) {
        console.warn("[Webhook] Missing x-hub-signature-256");
        return res.status(401).send('Missing signature');
    }

    const appSecret = env.META_APP_SECRET;
    if (!appSecret) {
        console.error("[Webhook] META_APP_SECRET not configured");
        return res.status(500).send('Server misconfiguration');
    }

    // req.body must be a raw buffer from express.raw()
    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(req.body).digest('hex');

    if (signature !== expectedSignature) {
        console.warn("[Webhook] Invalid signature");
        return res.status(401).send('Invalid signature');
    }

    // Since we used express.raw(), we need to parse it to JSON for the actual handler
    try {
        req.parsedBody = JSON.parse(req.body.toString('utf8'));
    } catch (err) {
        console.error("[Webhook] Failed to parse JSON body:", err);
        return res.status(400).send('Invalid JSON');
    }

    next();
};

// Handle Verification Request from Meta during Webhook Setup
export const verifyWebhookSetup = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === env.META_WHATSAPP_TOKEN) {
        console.log('[Webhook] Webhook verified by Meta successfully!');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
};

// Handle incoming WhatsApp messages / statuses
export const handleMetaWebhook = async (req, res) => {
    // 1. Immediately return 200 OK to Meta to prevent retry spam
    res.status(200).send('EVENT_RECEIVED');

    // 2. Process payload asynchronously
    try {
        const body = req.parsedBody;
        
        if (body.object === 'whatsapp_business_account') {
            for (let entry of body.entry) {
                for (let change of entry.changes) {
                    const value = change.value;
                    
                    // Handle message statuses (delivered, read, failed)
                    if (value.statuses) {
                        for (let status of value.statuses) {
                            console.log(`[Webhook] Message ${status.id} status updated to: ${status.status}`);
                            // If status is failed, you could potentially update AlertEvent to mark it as hard-bounced
                        }
                    }
                    
                    // Handle incoming messages (replies to alerts)
                    if (value.messages) {
                        for (let message of value.messages) {
                            console.log(`[Webhook] Received message from ${message.from}`);
                            // We don't have conversational AI yet, so we just log it.
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("[Webhook] Error processing payload:", error);
    }
};
