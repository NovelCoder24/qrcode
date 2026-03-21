import express from "express";
import {
    createSubscription,
    getSubscriptionStatus,
    cancelSubscription,
    updateBillingInfo,
    handleWebhook
} from "../controllers/razorpayController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes (require auth)
router.post("/create-subscription", protect, createSubscription);
router.get("/subscription-status", protect, getSubscriptionStatus);
router.post("/cancel", protect, cancelSubscription);
router.put("/update-billing-info", protect, updateBillingInfo);

// Public route (webhook - verified via signature)
router.post("/webhook", express.json(), handleWebhook);

export default router;
