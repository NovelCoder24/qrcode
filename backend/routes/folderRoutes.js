import express from 'express';
import { createFolder, getFolders, updateFolder, deleteFolder, moveQRToFolder } from '../controllers/folderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePremiumFeature } from '../middleware/requirePremiumFeature.js';

const router = express.Router();

// All folder routes require authentication and a premium plan (Local, Starter, Growth)
router.use(protect);
router.use(requirePremiumFeature);

router.post('/', createFolder);
router.get('/', getFolders);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);
router.patch('/qr/:shortId', moveQRToFolder);

export default router;
