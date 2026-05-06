import express from 'express';
import { verifyMetaSignature, verifyWebhookSetup, handleMetaWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// GET for Meta to verify the webhook URL during setup
router.get('/meta/whatsapp', verifyWebhookSetup);

// POST for receiving actual webhooks from Meta
// Notice we don't apply express.raw() here because we will apply it globally
// to the entire `/api/webhooks` path in app.js before express.json()
router.post('/meta/whatsapp', verifyMetaSignature, handleMetaWebhook);

export default router;
