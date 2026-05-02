import express from 'express';
import { getDashboardAnalytics, getAnalyticsTable, getQRAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardAnalytics);
router.get('/table', protect, getAnalyticsTable);
router.get('/qrcodes/:id', protect, getQRAnalytics);

export default router;
