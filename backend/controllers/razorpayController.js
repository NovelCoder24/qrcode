import Razorpay from "razorpay";
import crypto from "crypto";
import { User } from "../models/User.js";
import { RAZORPAY_PLANS } from "../config/razorpayConfig.js";

// Check if we're in test/dummy mode
const isTestMode = !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID.includes('dummy') ||
    process.env.RAZORPAY_KEY_ID === 'rzp_test_dummy123';

// Only initialize Razorpay if we have real credentials
let razorpay = null;
if (!isTestMode) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

// @desc    Create a subscription with UPI AutoPay
// @route   POST /api/razorpay/create-subscription
// @access  Private
export const createSubscription = async (req, res) => {
    try {
        const { plan, cycle } = req.body; // plan: 'pro' | 'business', cycle: 'monthly' | 'annual'
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!RAZORPAY_PLANS[plan] || !RAZORPAY_PLANS[plan][cycle]) {
            return res.status(400).json({ message: "Invalid plan or billing cycle" });
        }

        // TEST MODE: Return mock response
        if (isTestMode) {
            const mockSubscriptionId = `sub_test_${Date.now()}`;
            user.subscription.razorpaySubscriptionId = mockSubscriptionId;
            user.subscription.plan = plan;
            user.subscription.status = "active";
            user.subscription.trialEndsAt = null;
            await user.save();

            return res.status(200).json({
                subscriptionId: mockSubscriptionId,
                shortUrl: null,
                status: "active",
                testMode: true,
                message: "Test mode: Subscription activated instantly. Configure real Razorpay keys for production."
            });
        }

        // Create or get Razorpay customer
        let customerId = user.subscription.razorpayCustomerId;
        if (!customerId) {
            const customer = await razorpay.customers.create({
                name: user.name,
                email: user.email,
                contact: user.whatsappNumber || undefined,
                notes: {
                    userId: user._id.toString()
                }
            });
            customerId = customer.id;
            user.subscription.razorpayCustomerId = customerId;
            await user.save();
        }

        // Create subscription
        const planId = RAZORPAY_PLANS[plan][cycle];
        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_id: customerId,
            total_count: cycle === "annual" ? 1 : 12, // Annual = 1 charge, Monthly = 12 charges per year
            customer_notify: 1,
            notes: {
                userId: user._id.toString(),
                plan: plan,
                cycle: cycle
            }
        });

        // Store subscription ID
        user.subscription.razorpaySubscriptionId = subscription.id;
        await user.save();

        res.status(200).json({
            subscriptionId: subscription.id,
            shortUrl: subscription.short_url, // Razorpay hosted checkout page
            status: subscription.status
        });
    } catch (error) {
        console.error("[Razorpay] Create subscription error:", error);
        res.status(500).json({ message: error.message || "Failed to create subscription" });
    }
};

// @desc    Get current subscription status
// @route   GET /api/razorpay/subscription-status
// @access  Private
export const getSubscriptionStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let subscriptionDetails = null;

        // Only fetch from Razorpay if not in test mode and has subscription
        if (!isTestMode && razorpay && user.subscription.razorpaySubscriptionId) {
            try {
                subscriptionDetails = await razorpay.subscriptions.fetch(user.subscription.razorpaySubscriptionId);
            } catch (err) {
                console.error("[Razorpay] Fetch subscription error:", err);
            }
        }

        res.status(200).json({
            plan: user.subscription.plan,
            subscriptionStatus: user.subscription.status,
            trialEndsAt: user.subscription.trialEndsAt,
            razorpaySubscriptionId: user.subscription.razorpaySubscriptionId,
            subscriptionDetails: subscriptionDetails ? {
                status: subscriptionDetails.status,
                currentStart: subscriptionDetails.current_start,
                currentEnd: subscriptionDetails.current_end,
                chargeAt: subscriptionDetails.charge_at
            } : null,
            billingAddress: user.billing.address,
            gstNumber: user.billing.gstNumber,
            testMode: isTestMode
        });
    } catch (error) {
        console.error("[Razorpay] Get status error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel subscription
// @route   POST /api/razorpay/cancel
// @access  Private
export const cancelSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user || !user.subscription.razorpaySubscriptionId) {
            return res.status(400).json({ message: "No active subscription found" });
        }

        // TEST MODE: Just update local state
        if (isTestMode) {
            user.subscription.plan = "starter";
            user.subscription.status = "canceled";
            user.subscription.razorpaySubscriptionId = null;
            await user.save();

            return res.status(200).json({
                message: "Test mode: Subscription cancelled instantly.",
                testMode: true
            });
        }

        // Cancel at end of current billing period
        await razorpay.subscriptions.cancel(user.subscription.razorpaySubscriptionId, { cancel_at_cycle_end: 1 });

        res.status(200).json({ message: "Subscription will be cancelled at the end of the billing period" });
    } catch (error) {
        console.error("[Razorpay] Cancel subscription error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update billing info (GST number, address)
// @route   PUT /api/razorpay/update-billing-info
// @access  Private
export const updateBillingInfo = async (req, res) => {
    try {
        const { gstNumber, billingAddress } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (gstNumber !== undefined) {
            // Basic GST validation (15 alphanumeric characters)
            if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
                return res.status(400).json({ message: "Invalid GST number format" });
            }
            user.billing.gstNumber = gstNumber || null;
        }

        if (billingAddress) {
            user.billing.address = {
                ...user.billing.address,
                ...billingAddress
            };
        }

        await user.save();

        res.status(200).json({
            message: "Billing info updated",
            gstNumber: user.billing.gstNumber,
            billingAddress: user.billing.address
        });
    } catch (error) {
        console.error("[Razorpay] Update billing info error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Handle Razorpay webhooks
// @route   POST /api/razorpay/webhook
// @access  Public (verified via signature)
export const handleWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"];

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(JSON.stringify(req.body))
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("[Razorpay Webhook] Invalid signature");
            return res.status(400).json({ message: "Invalid signature" });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`[Razorpay Webhook] Received event: ${event}`);

        switch (event) {
            case "subscription.activated":
                await handleSubscriptionActivated(payload);
                break;

            case "subscription.charged":
                await handleSubscriptionCharged(payload);
                break;

            case "subscription.pending":
                await handleSubscriptionPending(payload);
                break;

            case "subscription.halted":
            case "subscription.cancelled":
                await handleSubscriptionCancelled(payload);
                break;

            case "payment.failed":
                await handlePaymentFailed(payload);
                break;

            default:
                console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error("[Razorpay Webhook] Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Helper: Handle subscription activated
async function handleSubscriptionActivated(payload) {
    const subscription = payload.subscription.entity;
    const userId = subscription.notes?.userId;

    if (!userId) {
        console.error("[Webhook] No userId in subscription notes");
        return;
    }

    const user = await User.findById(userId);
    if (!user) return;

    const plan = subscription.notes?.plan || "pro";

    user.subscription.plan = plan;
    user.subscription.status = "active";
    user.subscription.trialEndsAt = null;
    user.subscription.razorpaySubscriptionId = subscription.id;
    await user.save();

    console.log(`[Webhook] User ${user.email} upgraded to ${plan}`);
}

// Helper: Handle subscription charged (create invoice)
async function handleSubscriptionCharged(payload) {
    const subscription = payload.subscription.entity;
    const payment = payload.payment?.entity;
    const userId = subscription.notes?.userId;

    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) return;

    // Create invoice via Razorpay Invoice API
    if (user.billing.gstNumber && user.billing.address?.companyName) {
        try {
            const invoice = await razorpay.invoices.create({
                type: "invoice",
                customer_id: user.subscription.razorpayCustomerId,
                line_items: [{
                    name: `QRVibe ${user.subscription.plan} Plan`,
                    amount: payment?.amount || subscription.plan_amount,
                    currency: "INR",
                    quantity: 1
                }],
                customer_details: {
                    name: user.billing.companyName || user.name,
                    email: user.email,
                    gstin: user.billing.gstNumber,
                    billing_address: {
                        line1: user.billing.address.line1,
                        city: user.billing.address.city,
                        state: user.billing.address.state,
                        zipcode: user.billing.address.pincode,
                        country: "India"
                    }
                },
                notes: {
                    subscriptionId: subscription.id,
                    paymentId: payment?.id
                }
            });
            console.log(`[Webhook] Invoice created: ${invoice.id} for user ${user.email}`);
        } catch (err) {
            console.error("[Webhook] Invoice creation failed:", err);
        }
    }

    console.log(`[Webhook] Subscription charged for user ${user.email}`);
}

// Helper: Handle subscription pending (payment due)
async function handleSubscriptionPending(payload) {
    const subscription = payload.subscription.entity;
    const userId = subscription.notes?.userId;

    if (!userId) return;

    await User.findByIdAndUpdate(userId, { "subscription.status": "past_due" });
    console.log(`[Webhook] Subscription pending for userId ${userId}`);
}

// Helper: Handle subscription cancelled
async function handleSubscriptionCancelled(payload) {
    const subscription = payload.subscription.entity;
    const userId = subscription.notes?.userId;

    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) return;

    user.subscription.plan = "starter";
    user.subscription.status = "canceled";
    user.subscription.razorpaySubscriptionId = null;
    await user.save();

    console.log(`[Webhook] Subscription cancelled for user ${user.email}`);
}

// Helper: Handle payment failed
async function handlePaymentFailed(payload) {
    const payment = payload.payment?.entity;
    const subscriptionId = payment?.subscription_id;

    if (!subscriptionId) return;

    // Find user by subscription ID
    const user = await User.findOne({ "subscription.razorpaySubscriptionId": subscriptionId });
    if (!user) return;

    user.subscription.status = "past_due";
    await user.save();

    console.log(`[Webhook] Payment failed for user ${user.email}`);
}
