import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Check, Crown, Zap, Building2, Loader, CreditCard, FileText, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const PLANS = {
    starter: {
        name: "Starter",
        price: { monthly: 0, annual: 0 },
        features: [
            "5 Dynamic QR Codes",
            "10 Static QR Codes",
            "500 scans/month",
            "Basic analytics"
        ],
        icon: Zap,
        popular: false
    },
    pro: {
        name: "Pro Vibe",
        price: { monthly: 899, annual: 699 },
        features: [
            "Unlimited QR Codes",
            "50,000 scans/month",
            "Full analytics & insights",
            "Custom patterns & logos",
            "SVG export",
            "Health monitoring alerts"
        ],
        icon: Crown,
        popular: true
    },
    business: {
        name: "Agency",
        price: { monthly: 1999, annual: 1666 },
        features: [
            "Everything in Pro",
            "Unlimited scans",
            "Bulk QR creation",
            "Team members",
            "API access",
            "Custom domain",
            "Priority support"
        ],
        icon: Building2,
        popular: false
    }
};

const BillingPage = () => {
    const { user } = useSelector((state) => state.auth);
    const [billingCycle, setBillingCycle] = useState('annual');
    const [loading, setLoading] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [gstNumber, setGstNumber] = useState('');
    const [billingAddress, setBillingAddress] = useState({
        companyName: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });
    const [savingBilling, setSavingBilling] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSubscriptionStatus();
    }, []);

    const fetchSubscriptionStatus = async () => {
        try {
            const { data } = await api.get('/razorpay/subscription-status');
            setSubscriptionStatus(data);
            if (data.billing?.gstNumber) setGstNumber(data.billing.gstNumber);
            if (data.billing?.address) setBillingAddress(prev => ({ ...prev, ...data.billing.address, companyName: data.billing.companyName || prev.companyName }));
        } catch (err) {
            console.error('Failed to fetch subscription status:', err);
        }
    };

    const handleSubscribe = async (plan) => {
        if (plan === 'starter') return;

        setLoading(true);
        setError(null);

        try {
            const { data } = await api.post('/razorpay/create-subscription', {
                plan,
                cycle: billingCycle
            });

            // Test mode: subscription is instant, just refresh
            if (data.testMode) {
                fetchSubscriptionStatus();
                setLoading(false);
                return;
            }

            // Redirect to Razorpay hosted checkout
            if (data.shortUrl) {
                window.location.href = data.shortUrl;
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create subscription');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
            return;
        }

        setLoading(true);
        try {
            await api.post('/razorpay/cancel');
            fetchSubscriptionStatus();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel subscription');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBillingInfo = async () => {
        setSavingBilling(true);
        setError(null);

        try {
            await api.put('/razorpay/update-billing-info', {
                gstNumber: gstNumber || null,
                billingAddress
            });
            fetchSubscriptionStatus();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update billing info');
        } finally {
            setSavingBilling(false);
        }
    };

    const currentPlan = subscriptionStatus?.subscription?.plan || user?.subscription?.plan || 'starter';
    const isTrialing = subscriptionStatus?.subscription?.status === 'trialing';
    const trialEndsAt = subscriptionStatus?.subscription?.trialEndsAt ? new Date(subscriptionStatus.subscription.trialEndsAt) : null;
    const daysLeftInTrial = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24))) : 0;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Billing & Plans</h1>
                <p className="text-slate-500 mt-1">Manage your subscription and billing details</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Test Mode Banner */}
            {subscriptionStatus?.testMode && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold">Test Mode Active</p>
                        <p className="text-xs">Razorpay is not configured. Subscriptions activate instantly for testing.</p>
                    </div>
                </div>
            )}

            {/* Current Plan Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Current Plan</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-slate-900">{PLANS[currentPlan]?.name || 'Starter'}</span>
                            {isTrialing && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                                    Trial: {daysLeftInTrial} days left
                                </span>
                            )}
                            {subscriptionStatus?.subscription?.status === 'active' && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                    Active
                                </span>
                            )}
                        </div>
                    </div>
                    {subscriptionStatus?.subscription?.razorpaySubscriptionId && subscriptionStatus?.subscription?.status === 'active' && (
                        <button
                            onClick={handleCancelSubscription}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Cancel Subscription
                        </button>
                    )}
                </div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1 rounded-xl inline-flex">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                            billingCycle === 'monthly'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                            billingCycle === 'annual'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Annual <span className="text-green-600 ml-1">Save 20%</span>
                    </button>
                </div>
            </div>

            {/* Plan Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
                {Object.entries(PLANS).map(([key, plan]) => {
                    const Icon = plan.icon;
                    const price = plan.price[billingCycle];
                    const isCurrentPlan = currentPlan === key;

                    return (
                        <div
                            key={key}
                            className={`relative bg-white rounded-2xl border-2 p-6 transition-all ${
                                plan.popular
                                    ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                                        MOST POPULAR
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    plan.popular ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                            </div>

                            <div className="mb-6">
                                <span className="text-3xl font-bold text-slate-900">
                                    {price === 0 ? 'Free' : `₹${price}`}
                                </span>
                                {price > 0 && (
                                    <span className="text-slate-500 text-sm">/month</span>
                                )}
                                {billingCycle === 'annual' && price > 0 && (
                                    <p className="text-xs text-slate-400 mt-1">Billed annually</p>
                                )}
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(key)}
                                disabled={loading || isCurrentPlan || key === 'starter'}
                                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                    isCurrentPlan
                                        ? 'bg-slate-100 text-slate-500 cursor-default'
                                        : key === 'starter'
                                            ? 'bg-slate-100 text-slate-500 cursor-default'
                                            : plan.popular
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                            >
                                {loading && <Loader className="w-4 h-4 animate-spin" />}
                                {isCurrentPlan ? 'Current Plan' : key === 'starter' ? 'Free Forever' : 'Upgrade'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* GST & Billing Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">GST & Billing Details</h3>
                        <p className="text-sm text-slate-500">For GST-compliant invoices</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">GST Number</label>
                        <input
                            type="text"
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                            placeholder="22AAAAA0000A1Z5"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                        <input
                            type="text"
                            value={billingAddress.companyName}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, companyName: e.target.value }))}
                            placeholder="Acme Corp Pvt. Ltd."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                        <input
                            type="text"
                            value={billingAddress.address}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="123, Business Park, Sector 5"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                        <input
                            type="text"
                            value={billingAddress.city}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Mumbai"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                        <input
                            type="text"
                            value={billingAddress.state}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                            placeholder="Maharashtra"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                        <input
                            type="text"
                            value={billingAddress.pincode}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, pincode: e.target.value }))}
                            placeholder="400001"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSaveBillingInfo}
                    disabled={savingBilling}
                    className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    {savingBilling && <Loader className="w-4 h-4 animate-spin" />}
                    Save Billing Details
                </button>
            </div>
        </div>
    );
};

export default BillingPage;
