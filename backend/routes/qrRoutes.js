import express from 'express';
import multer from 'multer';
import { createQR, getMyQRs, checkMyQRsHealth, getQRById, updateQR, deleteQR, parseMenuPhoto } from '../controllers/qrController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPlanLimits } from '../middleware/checkPlanLimits.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createQRSchema, updateQRSchema } from '../validators/qrValidator.js';

const router = express.Router();

const menuPhotoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 8 }
});

const handleMenuPhotoUpload = (req, res, next) => {
    menuPhotoUpload.any()(req, res, (err) => {
        if (err) {
            console.error('[qrRoutes] Menu photo upload error:', err.message);
            const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
            return res.status(status).json({
                message: err instanceof multer.MulterError
                    ? `Upload error: ${err.message}`
                    : (err.message || 'File upload failed'),
            });
        }
        next();
    });
};

router.post('/create', protect, checkPlanLimits, validate(createQRSchema), createQR);
router.get('/myqrs', protect, getMyQRs);
router.post('/check-health', protect, checkMyQRsHealth);
router.post('/parse-menu-photo', protect, handleMenuPhotoUpload, parseMenuPhoto);
router.get('/:id', protect, getQRById);
router.put('/:id', protect, validate(updateQRSchema), updateQR);
router.delete('/:id', protect, deleteQR);

export default router;