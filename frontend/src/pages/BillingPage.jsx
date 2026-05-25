import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../redux/authSlice';
import { Check, Crown, Zap, Building2, Loader, CreditCard, FileText, AlertCircle, ShieldCheck } from 'lucide-react';
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
    const dispatch = useDispatch();
    const [showCancelModal, setShowCancelModal] = useState(false);
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
                dispatch(loadUser()); // Sync sidebar
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

    const handleCancelSubscription = () => {
        setShowCancelModal(true);
    };

    const confirmCancelSubscription = async () => {
        setLoading(true);
        try {
            await api.post('/razorpay/cancel');
            fetchSubscriptionStatus();
            dispatch(loadUser()); // Sync sidebar
            setShowCancelModal(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel subscription');
            setShowCancelModal(false);
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

    const currentPlan = subscriptionStatus?.plan || user?.subscription?.plan || 'starter';
    const isTrialing = (subscriptionStatus?.subscriptionStatus || user?.subscription?.status) === 'trialing';
    const trialEndsAt = (subscriptionStatus?.trialEndsAt || user?.subscription?.trialEndsAt) ? new Date(subscriptionStatus?.trialEndsAt || user?.subscription?.trialEndsAt) : null;
    const daysLeftInTrial = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24))) : 0;
    const subStatus = subscriptionStatus?.subscriptionStatus || user?.subscription?.status;

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900">Billing & Plans</h1>
                <p className="text-slate-500 mt-1">Manage subscription access, invoices, and GST details.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Test Mode Banner */}
            {subscriptionStatus?.testMode && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold">Test Mode Active</p>
                        <p className="text-xs">Razorpay is not configured. Subscriptions activate instantly for testing.</p>
                    </div>
                </div>
            )}

            {/* Current Plan Status */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Current Plan</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xl font-bold text-slate-900">
                                {PLANS[currentPlan]?.name || 'Starter'}
                                {isTrialing && (
                                    <span className="text-amber-600 font-semibold text-base ml-1">
                                        (Trial - {daysLeftInTrial} {daysLeftInTrial === 1 ? 'day' : 'days'} left)
                                    </span>
                                )}
                            </span>
                            {subStatus === 'active' && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                    Active
                                </span>
                            )}
                            {subStatus === 'expired' && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                                    Expired
                                </span>
                            )}
                            {subStatus === 'canceled' && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                                    Canceled
                                </span>
                            )}
                        </div>
                    </div>
                    {subscriptionStatus?.razorpaySubscriptionId && subStatus === 'active' && (
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
                <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                            billingCycle === 'monthly'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
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
                            className={`relative bg-white rounded-lg border p-6 transition-all shadow-sm ${
                                plan.popular
                                    ? 'border-slate-900 ring-1 ring-slate-900'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 bg-slate-950 text-white text-xs font-bold rounded-md">
                                        MOST POPULAR
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                                    plan.popular ? 'bg-slate-100 text-slate-900' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                            </div>

                            <div className="mb-6">
                                <span className="text-3xl font-bold text-slate-900">
                                    {price === 0 ? 'Free' : `Rs.${price}`}
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
                                disabled={loading || (isCurrentPlan && !isTrialing) || key === 'starter'}
                                className={`w-full py-3 rounded-md font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                    (isCurrentPlan && !isTrialing)
                                        ? 'bg-slate-100 text-slate-500 cursor-default'
                                        : key === 'starter'
                                            ? 'bg-slate-100 text-slate-500 cursor-default'
                                            : plan.popular
                                                ? 'bg-slate-950 text-white hover:bg-slate-800'
                                                : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                            >
                                {loading && <Loader className="w-4 h-4 animate-spin" />}
                                {(isCurrentPlan && !isTrialing) ? 'Current Plan' : key === 'starter' ? 'Free Forever' : 'Upgrade'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Money-Back Guarantee */}
            <div className="flex items-center justify-center gap-3 mb-12 py-4 px-6 bg-emerald-50 border border-emerald-200 rounded-lg max-w-lg mx-auto">
                <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-emerald-800">7-Day Money-Back Guarantee</p>
                    <p className="text-xs text-emerald-600">Not satisfied? Get a full refund within 7 days of your first payment. No questions asked.</p>
                </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center">
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
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                        <input
                            type="text"
                            value={billingAddress.companyName}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, companyName: e.target.value }))}
                            placeholder="Acme Corp Pvt. Ltd."
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                        <input
                            type="text"
                            value={billingAddress.address}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="123, Business Park, Sector 5"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                        <input
                            type="text"
                            value={billingAddress.city}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Mumbai"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                        <input
                            type="text"
                            value={billingAddress.state}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                            placeholder="Maharashtra"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                        <input
                            type="text"
                            value={billingAddress.pincode}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, pincode: e.target.value }))}
                            placeholder="400001"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSaveBillingInfo}
                    disabled={savingBilling}
                    className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-md font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    {savingBilling && <Loader className="w-4 h-4 animate-spin" />}
                    Save Billing Details
                </button>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
                        <div className="p-6 text-center">
                            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-lg flex items-center justify-center mb-6 shadow-sm border border-red-100">
                                <AlertCircle size={32} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Cancel Subscription?</h2>
                            <p className="text-slate-500 mb-6 text-sm">
                                Are you sure you want to cancel? You will lose access to premium features at the end of your current billing period.
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmCancelSubscription}
                                    disabled={loading}
                                    className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors shadow-md shadow-red-200 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Yes, Cancel Subscription'}
                                </button>
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    disabled={loading}
                                    className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-md transition-colors"
                                >
                                    Keep My Subscription
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingPage;
