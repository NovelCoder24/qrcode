import { getPlanLimits } from "../config/planConfig.js";
import { QRCode } from "../models/QRCode.js";
import { User } from "../models/User.js";

export const checkPlanLimits = async (req, res, next) => {
    try {
        const user = req.user;
        const plan = user.subscription?.plan || "free";
        const isTrial = user.subscription?.status === "trialing";

        // 1. Check if Trial is Expired
        if (isTrial) {
            const now = new Date();
            const trialEnd = new Date(user.subscription.trialEndsAt);
            if (now > trialEnd) {
                // Atomic update: demote to free plan
                await User.updateOne(
                    { _id: user._id },
                    { 
                        $set: { 
                            "subscription.status": "expired",
                            "subscription.plan": "free",
                            "subscription.dynamicQrLimit": 1,
                            "subscription.analyticsEnabled": false
                        } 
                    }
                );
                // Update local memory for immediate response
                user.subscription.status = "expired";
                user.subscription.plan = "free";
                return res.status(403).json({ 
                    message: "Free trial expired. Please upgrade your plan to create more QR codes.",
                    code: "TRIAL_EXPIRED"
                });
            }
        }

        // 2. Resolve limits (trial-aware)
        const limits = getPlanLimits(plan, isTrial);

        // 3. Count only dynamic_active QRs (static_locked codes must not count against the limit)
        const qrCount = await QRCode.countDocuments({ user_id: user._id, accessMode: 'dynamic_active' });

        // 4. Check QR Limit
        if (qrCount >= limits.maxQR) {
            return res.status(403).json({ 
                message: `You have reached the limit of ${limits.maxQR} QR codes on the ${plan} plan.`,
                code: "LIMIT_REACHED",
                upgradeRequired: true
            });
        }

        // 5. Check content type access
        if (req.body.qr_type && !limits.allowedTypes.includes(req.body.qr_type)) {
             return res.status(403).json({ 
                message: `${req.body.qr_type} QR codes are not available on the ${plan} plan.`,
                code: "FEATURE_LOCKED",
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        console.error("Plan Limits Error:", error);
        res.status(500).json({ message: "Error verifying plan limitations" });
    }
};
