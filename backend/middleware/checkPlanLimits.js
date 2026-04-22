import { PLAN_LIMITS } from "../config/planConfig.js";
import { QRCode } from "../models/QRCode.js";

export const checkPlanLimits = async (req, res, next) => {
    try {
        const user = req.user;
        const plan = user.subscription?.plan || "starter";
        const limits = PLAN_LIMITS[plan];

        // 1. Check if Trial is Expired
        if (user.subscription?.status === "trialing") {
            const now = new Date();
            const trialEnd = new Date(user.subscription.trialEndsAt);
            if (now > trialEnd) {
                // Use atomic update to avoid race conditions and correctly demote plan
                await User.updateOne(
                    { _id: user._id },
                    { 
                        $set: { 
                            "subscription.status": "expired",
                            "subscription.plan": "starter" 
                        } 
                    }
                );
                // Update local memory object for immediate response
                user.subscription.status = "expired";
                user.subscription.plan = "starter";
                return res.status(403).json({ 
                    message: "Free trial expired. Please upgrade your plan to create more QR codes.",
                    code: "TRIAL_EXPIRED"
                });
            }
        }

        // 2. Count existing Dynamic QRs
        const qrCount = await QRCode.countDocuments({ user_id: user._id });

        // 3. Check Limit
        if (qrCount >= limits.maxDynamicQR) {
            return res.status(403).json({ 
                message: `You have reached the limit of ${limits.maxDynamicQR} QR codes on the ${plan} plan.`,
                code: "LIMIT_REACHED",
                upgradeRequired: true
            });
        }

        // 4. (Optional) Check content type
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
