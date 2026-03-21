import express from 'express';
import { createQR, getMyQRs, getQRById, updateQR, deleteQR } from '../controllers/qrController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPlanLimits } from '../middleware/checkPlanLimits.js';

const router = express.Router();

router.post('/create', protect, checkPlanLimits, createQR);
router.get('/myqrs', protect, getMyQRs);
router.get('/:id', protect, getQRById);
router.put('/:id', protect, updateQR);
router.delete('/:id', protect, deleteQR);

export default router;