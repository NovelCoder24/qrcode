// ══════════════════════════════════════════════════════════
// Razorpay Plan Configuration
// ══════════════════════════════════════════════════════════
// Plan IDs must be created in Razorpay Dashboard and set in .env
// Pricing in smallest currency unit (paise for INR, cents for USD)
// ══════════════════════════════════════════════════════════

export const RAZORPAY_PLANS = {
    local: {
        monthly: process.env.RAZORPAY_LOCAL_MONTHLY_PLAN_ID || "plan_local_monthly_test",
        annual: process.env.RAZORPAY_LOCAL_ANNUAL_PLAN_ID || "plan_local_annual_test",
        price: {
            INR: { monthly: 14900, annual: 118800 },     // ₹149/mo, ₹1,188/yr
            USD: { monthly: 499, annual: 4788 },          // $4.99/mo, $47.88/yr
        }
    },
    starter: {
        monthly: process.env.RAZORPAY_STARTER_MONTHLY_PLAN_ID || "plan_starter_monthly_test",
        annual: process.env.RAZORPAY_STARTER_ANNUAL_PLAN_ID || "plan_starter_annual_test",
        price: {
            INR: { monthly: 39900, annual: 358800 },      // ₹399/mo, ₹3,588/yr
            USD: { monthly: 999, annual: 9588 },           // $9.99/mo, $95.88/yr
        }
    },
    growth: {
        monthly: process.env.RAZORPAY_GROWTH_MONTHLY_PLAN_ID || "plan_growth_monthly_test",
        annual: process.env.RAZORPAY_GROWTH_ANNUAL_PLAN_ID || "plan_growth_annual_test",
        price: {
            INR: { monthly: 79900, annual: 718800 },      // ₹799/mo, ₹7,188/yr
            USD: { monthly: 1999, annual: 19188 },         // $19.99/mo, $191.88/yr
        }
    }
};

// Map internal plan names to display names
export const PLAN_DISPLAY_NAMES = {
    free: "Free",
    local: "Local",
    starter: "Starter",
    growth: "Growth"
};

// Features per plan (for display on billing page)
export const PLAN_FEATURES = {
    free: [
        "1 Dynamic QR Code",
        "100 scans (lifetime)",
        "Basic redirect only",
    ],
    local: [
        "1 Dynamic QR Code",
        "Unlimited scans",
        "Full analytics",
        "Email health alerts",
    ],
    starter: [
        "10 Dynamic QR Codes",
        "25,000 scans/month",
        "Full analytics",
        "WhatsApp alerts (10/mo)",
        "Custom patterns & logos",
        "All QR types",
    ],
    growth: [
        "50 Dynamic QR Codes",
        "Unlimited scans",
        "Full analytics",
        "Unlimited WhatsApp alerts",
        "Custom patterns & logos",
        "SVG export",
        "API access",
        "Priority support",
    ]
};
