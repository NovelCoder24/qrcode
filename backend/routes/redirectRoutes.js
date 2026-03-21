import express from 'express';
import { redirectQR, getPublicQR } from '../controllers/redirectController.js';

const router = express.Router();

// Public endpoint to get QR data by shortId (for landing pages)
router.get('/info/:shortId', getPublicQR);

// The catch-all route for short IDs
// GET /r/x7d9Ak
router.get('/:shortId', redirectQR);

export default router;
