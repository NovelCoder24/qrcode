// Razorpay plan configuration
// Plan IDs should be created in Razorpay Dashboard and added to .env

export const RAZORPAY_PLANS = {
    pro: {
        monthly: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID || "plan_pro_monthly_test",
        annual: process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID || "plan_pro_annual_test",
        price: {
            monthly: 89900, // Rs 899 in paise
            annual: 839900  // Rs 8399 in paise (Rs 699/mo * 12)
        }
    },
    business: {
        monthly: process.env.RAZORPAY_BUSINESS_MONTHLY_PLAN_ID || "plan_business_monthly_test",
        annual: process.env.RAZORPAY_BUSINESS_ANNUAL_PLAN_ID || "plan_business_annual_test",
        price: {
            monthly: 199900, // Rs 1999 in paise
            annual: 1999900  // Rs 19999 in paise
        }
    }
};

// Map internal plan names to display names
export const PLAN_DISPLAY_NAMES = {
    starter: "Starter (Free)",
    pro: "Pro Vibe",
    business: "Agency"
};

// Features per plan (for display on billing page)
export const PLAN_FEATURES = {
    starter: [
        "5 Dynamic QR Codes",
        "10 Static QR Codes",
        "500 scans/month",
        "Basic analytics"
    ],
    pro: [
        "Unlimited QR Codes",
        "50,000 scans/month",
        "Full analytics & insights",
        "Custom patterns & logos",
        "SVG export",
        "Health monitoring alerts"
    ],
    business: [
        "Everything in Pro",
        "Unlimited scans",
        "Bulk QR creation",
        "Team members",
        "API access",
        "Custom domain",
        "Priority support"
    ]
};
