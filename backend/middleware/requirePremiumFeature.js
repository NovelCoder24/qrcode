export const requirePremiumFeature = (req, res, next) => {
    // protect middleware should have already populated req.user
    if (!req.user) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const plan = req.user.subscription?.plan || "free";

    // Allow Starter, Growth, Business. Block Free and Local.
    if (plan === "free" || plan === "local") {
        return res.status(403).json({
            message: "This feature is only available on Starter, Growth, or Business plans.",
            errorCode: "UPGRADE_REQUIRED"
        });
    }

    next();
};
