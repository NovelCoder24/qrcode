import express from 'express';
import { registerUser, loginUser, getMe, googleAuth, refreshToken, logoutUser, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Routes (Anyone can access)
// POST /api/users/register
router.post('/register', registerUser);

// POST /api/users/login
router.post('/login', loginUser);

// POST /api/users/google
router.post('/google', googleAuth);

// POST /api/users/refresh - Issue new token pair
router.post('/refresh', refreshToken);

// POST /api/users/logout - Clear refresh cookie
router.post('/logout', logoutUser);

// Protected Routes (Only logged in users)
// GET /api/users/me 
router.get('/me', protect, getMe);

// PUT /api/users/profile
router.put('/profile', protect, updateProfile);

export default router;
