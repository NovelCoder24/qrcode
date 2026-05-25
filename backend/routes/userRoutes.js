import express from 'express';
import { 
    registerUser, loginUser, getMe, googleAuth, refreshToken, logoutUser, updateProfile,
    updatePrivacySettings, exportUserData, requestDataErasure, dismissTrialWarning
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { registerSchema, loginSchema, googleSchema } from '../validators/userValidator.js';

const router = express.Router();

// Public Routes (Anyone can access)
// POST /api/users/register
router.post('/register', validate(registerSchema), registerUser);

// POST /api/users/login
router.post('/login', validate(loginSchema), loginUser);

// POST /api/users/google
router.post('/google', validate(googleSchema), googleAuth);

// POST /api/users/refresh - Issue new token pair
router.post('/refresh', refreshToken);

// POST /api/users/logout - Clear refresh cookie
router.post('/logout', logoutUser);

// Protected Routes (Only logged in users)
// GET /api/users/me 
router.get('/me', protect, getMe);

// PUT /api/users/profile
router.put('/profile', protect, updateProfile);

// PUT /api/users/privacy - Toggle privacy settings & log consent
router.put('/privacy', protect, updatePrivacySettings);

// PUT /api/users/dismiss-trial-warning - Dismiss the trial expired popup
router.put('/dismiss-trial-warning', protect, dismissTrialWarning);

// GET /api/users/export - Export all user data (DPDP)
router.get('/export', protect, exportUserData);

// DELETE /api/users/erasure - Permanently wipe account and all data (DPDP)
router.delete('/erasure', protect, requestDataErasure);

export default router;
