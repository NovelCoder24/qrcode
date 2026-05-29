"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import {
  Check,
  CreditCard,
  Download,
  HelpCircle,
  Info,
  Minus,
  QrCode,
  Smartphone,
  Users,
  Zap,
  Loader,
  AlertCircle
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Badge } from "@/components/UI/badge"
import { Progress } from "@/components/UI/progress"
import { cn } from "@/lib/utils"

import api from "../api/axios"
import { loadUser } from "../redux/authSlice"

// ==========================================
// INLINE COMPONENTS & HELPERS
// ==========================================
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNumber(num) {
  return new Intl.NumberFormat("en-IN").format(num || 0)
}

function formatDate(dateString) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.toLocaleString("en-US", { month: "short" })
  const year = date.getFullYear()
  return `${day} ${month}, ${year}`
}

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
))
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...props} />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
))
TableCell.displayName = "TableCell"

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

// ==========================================
// MOCK DATA
// ==========================================
const mockInvoices = [
  { id: "inv_0001X", date: "2024-01-01T10:00:00Z", amount: 1499, status: "Paid" },
]

const plans = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, annual: 0 },
    description: "For individuals getting started",
    features: [
      { text: "1 Dynamic QR Code", included: true },
      { text: "100 Scans (lifetime)", included: true },
      { text: "Basic Redirect", included: true },
      { text: "Full Analytics", included: false },
      { text: "Email Health Alerts", included: false },
      { text: "WhatsApp Alerts", included: false },
    ],
  },
  {
    id: "local",
    name: "Local",
    price: { monthly: 149, annual: 99 },
    description: "For local shops",
    features: [
      { text: "1 Dynamic QR Code", included: true },
      { text: "Unlimited Scans", included: true },
      { text: "Full Analytics", included: true },
      { text: "Email Health Alerts", included: true },
      { text: "WhatsApp Alerts", included: false },
      { text: "Custom Branding", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 399, annual: 299 },
    description: "For growing businesses",
    popular: true,
    features: [
      { text: "10 Dynamic QR Codes", included: true },
      { text: "25,000 Scans/month", included: true },
      { text: "Full Analytics", included: true },
      { text: "WhatsApp Alerts (10/mo)", included: true },
      { text: "Custom Branding", included: true },
      { text: "API Access", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: { monthly: 799, annual: 599 },
    description: "For scaling brands",
    features: [
      { text: "50 Dynamic QR Codes", included: true },
      { text: "Unlimited Scans", included: true },
      { text: "Full Analytics", included: true },
      { text: "Unlimited WhatsApp Alerts", included: true },
      { text: "Custom Branding", included: true },
      { text: "API Access", included: true },
    ],
  },
]

// ==========================================
// COMPONENTS
// ==========================================

function CurrentPlanCard({ user, subscriptionStatus, onCancel, loading }) {
  const currentPlanId = subscriptionStatus?.plan || user?.subscription?.plan || 'free'
  const isTrialing = (subscriptionStatus?.subscriptionStatus || user?.subscription?.status) === 'trialing'
  const subStatus = subscriptionStatus?.subscriptionStatus || user?.subscription?.status
  const trialEndsAt = (subscriptionStatus?.trialEndsAt || user?.subscription?.trialEndsAt) ? new Date(subscriptionStatus?.trialEndsAt || user?.subscription?.trialEndsAt) : null
  const daysLeftInTrial = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24))) : 0

  const planDetails = plans.find(p => p.id === currentPlanId) || plans[0]

  // Usage mapped to actual user data when available
  const usage = {
    dynamicQRs: { used: user?.activeQrCount || 0, limit: planDetails.id === 'free' || planDetails.id === 'local' ? 1 : planDetails.id === 'starter' ? 10 : 50 },
    scans: { used: user?.totalScans || 0, limit: planDetails.id === 'free' ? 100 : planDetails.id === 'starter' ? 25000 : 'Unlimited' },
    whatsapp: { used: user?.subscription?.whatsappAlertsUsedThisMonth || 0, limit: planDetails.id === 'starter' ? 10 : (planDetails.id === 'growth' ? 'Unlimited' : 0) }
  }

  const qrsLimit = typeof usage.dynamicQRs.limit === 'number' ? usage.dynamicQRs.limit : 1;
  const qrsPercent = typeof usage.dynamicQRs.limit === 'number' ? (usage.dynamicQRs.used / qrsLimit) * 100 : (usage.dynamicQRs.used > 0 ? 5 : 0);
  const scansPercent = typeof usage.scans.limit === 'number' ? (usage.scans.used / usage.scans.limit) * 100 : 0;
  const waLimit = typeof usage.whatsapp.limit === 'number' && usage.whatsapp.limit > 0 ? usage.whatsapp.limit : 1;
  const waPercent = typeof usage.whatsapp.limit === 'number' && usage.whatsapp.limit > 0 ? (usage.whatsapp.used / waLimit) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Current Plan</CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {planDetails.name}
            </Badge>
            {isTrialing && (
              <span className="text-[10px] text-amber-600 font-bold">Trial: {daysLeftInTrial}d left</span>
            )}
            {subStatus === 'canceled' && (
              <span className="text-[10px] text-destructive font-bold">Canceled</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{formatCurrency(planDetails.price?.monthly || 0)}</span>
          <span className="text-muted-foreground">/month</span>
        </div>

        {/* Usage Meters */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <span>Dynamic QR Codes</span>
              </div>
              <span className="font-medium">{usage.dynamicQRs.used}/{usage.dynamicQRs.limit}</span>
            </div>
            <Progress value={qrsPercent} className="mt-2 h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span>Monthly Scans</span>
              </div>
              <span className="font-medium">{formatNumber(usage.scans.used)}/{usage.scans.limit === 'Unlimited' ? 'Unlimited' : formatNumber(usage.scans.limit)}</span>
            </div>
            <Progress value={scansPercent} className="mt-2 h-2" />
            {scansPercent > 80 && (
              <p className="mt-1 text-xs text-amber-600 font-medium">Approaching limit. Consider upgrading.</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>WhatsApp Alerts</span>
              </div>
              <span className="font-medium">{usage.whatsapp.used}/{usage.whatsapp.limit}</span>
            </div>
            <Progress value={waPercent} className="mt-2 h-2" />
            {isTrialing && (
                <p className="mt-1 text-xs text-muted-foreground font-medium">Trial includes 5 WhatsApp alerts. Upgrade to Growth for unlimited.</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 border-t pt-6">
        {subscriptionStatus?.razorpaySubscriptionId && subStatus === 'active' && (
          <Button 
            variant="outline" 
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel Subscription
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function PlanComparison({ currentPlanId, handleSubscribe, isTrialing, loading, isAnnual, setIsAnnual }) {
  return (
    <Card>
      <CardHeader className="pb-3 border-b mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <CardTitle className="text-base font-semibold">Compare Plans</CardTitle>
                <CardDescription>Choose the plan that fits your needs</CardDescription>
            </div>
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                <button
                    onClick={() => setIsAnnual(false)}
                    className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                        !isAnnual ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setIsAnnual(true)}
                    className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                        isAnnual ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Annual
                    <span className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Save 25%</span>
                </button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-lg border p-4 transition-all shadow-sm flex flex-col",
                plan.id === currentPlanId && "border-primary bg-primary/5",
                plan.popular && plan.id !== currentPlanId && "border-primary"
              )}
            >
              {plan.popular && plan.id !== currentPlanId && (
                <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground">
                  Popular
                </Badge>
              )}
              {plan.id === currentPlanId && (
                <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground">
                  Current
                </Badge>
              )}

              <div className="mb-4">
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
              </div>

              <div className="mb-4">
                <span className="text-2xl font-bold">{formatCurrency(isAnnual ? plan.price.annual : plan.price.monthly)}</span>
                {plan.price.monthly > 0 && <span className="text-muted-foreground text-sm">/mo</span>}
                {isAnnual && plan.price.annual > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                        Billed {formatCurrency(plan.price.annual * 12)} yearly
                    </div>
                )}
              </div>

              <ul className="mb-6 space-y-2 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm leading-tight">
                    {feature.included ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    ) : (
                      <Minus className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                    )}
                    <span className={cn(!feature.included && "text-muted-foreground")}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {plan.id === currentPlanId && !isTrialing ? (
                <Button variant="outline" className="w-full bg-background mt-auto" disabled>
                  Current Plan
                </Button>
              ) : plan.id === 'free' ? (
                <Button variant="outline" className="w-full mt-auto" disabled>
                  Free Forever
                </Button>
              ) : (
                <Button 
                    className="w-full mt-auto" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QRSafetyNotice() {
  return (
    <Card className="border-dashed bg-secondary/10">
      <CardContent className="flex items-start gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <QrCode className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-medium text-emerald-900">Your QR codes never suddenly die</p>
          <p className="mt-1 text-sm text-muted-foreground">
            If you downgrade or cancel, your QR codes keep scanning. Dynamic QRs become static-locked, 
            meaning they still redirect to the last saved destination. You just cannot edit them or view 
            new analytics until you upgrade again.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function InvoiceHistory() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Invoice History</CardTitle>
            <CardDescription>Download your past invoices</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-6">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="pl-6">
                  <span className="font-mono text-sm">{invoice.id.toUpperCase()}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(invoice.date)}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(invoice.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    Paid
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function GSTInformation({ gstNumber, setGstNumber, billingAddress, setBillingAddress, handleSave, saving }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">GST & Billing Info</CardTitle>
            <CardDescription>Tax details for your invoices</CardDescription>
          </div>
          <div title="GST will be added to your invoice if you provide a valid GSTIN.">
             <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-secondary/30 p-4">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Registered Business</p>
              <p className="text-xs text-muted-foreground">
                18% GST will be charged on all invoices. Input tax credit is available for registered businesses.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input 
                id="gstin" 
                placeholder="22AAAAA0000A1Z5" 
                value={gstNumber} 
                onChange={e => setGstNumber(e.target.value.toUpperCase())} 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="company">Company Name</Label>
            <Input 
                id="company" 
                placeholder="Acme Corp Pvt. Ltd." 
                value={billingAddress.companyName} 
                onChange={e => setBillingAddress({...billingAddress, companyName: e.target.value})} 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">Address</Label>
            <Input 
                id="address" 
                placeholder="123, Business Park, Sector 5" 
                value={billingAddress.address} 
                onChange={e => setBillingAddress({...billingAddress, address: e.target.value})} 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <Label htmlFor="city">City</Label>
                <Input 
                    id="city" 
                    placeholder="Mumbai" 
                    value={billingAddress.city} 
                    onChange={e => setBillingAddress({...billingAddress, city: e.target.value})} 
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="state">State</Label>
                <Input 
                    id="state" 
                    placeholder="Maharashtra" 
                    value={billingAddress.state} 
                    onChange={e => setBillingAddress({...billingAddress, state: e.target.value})} 
                />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full mt-2">
            {saving ? "Saving..." : "Save Billing Details"}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function BillingPage() {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [showCancelModal, setShowCancelModal] = useState(false);
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
    const [isAnnual, setIsAnnual] = useState(false);

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
        if (plan === 'free') return;
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.post('/razorpay/create-subscription', {
                plan,
                cycle: isAnnual ? 'annual' : 'monthly'
            });
            if (data.testMode) {
                fetchSubscriptionStatus();
                dispatch(loadUser());
                setLoading(false);
                return;
            }
            if (data.shortUrl) {
                window.location.href = data.shortUrl;
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create subscription');
        } finally {
            setLoading(false);
        }
    };

    const confirmCancelSubscription = async () => {
        setLoading(true);
        try {
            await api.post('/razorpay/cancel');
            fetchSubscriptionStatus();
            dispatch(loadUser());
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
            alert("Billing details saved successfully!");
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update billing info');
        } finally {
            setSavingBilling(false);
        }
    };

    const currentPlan = subscriptionStatus?.plan || user?.subscription?.plan || 'free';
    const isTrialing = (subscriptionStatus?.subscriptionStatus || user?.subscription?.status) === 'trialing';

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6 md:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing & Plans</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and view invoices.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {subscriptionStatus?.testMode && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
                <p className="text-sm font-semibold">Test Mode Active</p>
                <p className="text-xs">Razorpay is not configured. Subscriptions activate instantly for testing.</p>
            </div>
        </div>
      )}

      {/* QR Safety Notice */}
      <QRSafetyNotice />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current Plan - Takes 1/3 */}
        <div className="space-y-6">
          <CurrentPlanCard 
            user={user} 
            subscriptionStatus={subscriptionStatus} 
            onCancel={() => setShowCancelModal(true)} 
            loading={loading}
          />
          <GSTInformation 
            gstNumber={gstNumber}
            setGstNumber={setGstNumber}
            billingAddress={billingAddress}
            setBillingAddress={setBillingAddress}
            handleSave={handleSaveBillingInfo}
            saving={savingBilling}
          />
        </div>

        {/* Plan Comparison & Invoices - Takes 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          <PlanComparison 
            currentPlanId={currentPlan} 
            handleSubscribe={handleSubscribe} 
            isTrialing={isTrialing}
            loading={loading}
            isAnnual={isAnnual}
            setIsAnnual={setIsAnnual}
          />
          <InvoiceHistory />
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <Card className="w-full max-w-md shadow-2xl relative border-destructive/20 animate-in fade-in zoom-in duration-200">
                <CardHeader className="text-center pt-8">
                    <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <CardTitle className="text-xl">Cancel Subscription?</CardTitle>
                    <CardDescription className="pt-2">
                        Are you sure you want to cancel? You will lose access to premium features at the end of your current billing period.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pb-8">
                    <Button 
                        variant="destructive" 
                        onClick={confirmCancelSubscription} 
                        disabled={loading}
                        className="w-full py-6"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Yes, Cancel Subscription'}
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => setShowCancelModal(false)} 
                        disabled={loading}
                        className="w-full"
                    >
                        Keep My Subscription
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  )
}
