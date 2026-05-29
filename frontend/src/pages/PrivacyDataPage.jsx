"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  Shield,
  Download,
  Trash2,
  Clock,
  Check,
  History,
  FileText,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Bell,
  X,
  Phone
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Badge } from "@/components/UI/badge"
import { cn } from "@/lib/utils"

import api from "../api/axios"
import { logout, loadUser } from "../redux/authSlice"

// ==========================================
// INLINE COMPONENTS & MOCKS
// ==========================================

const mockConsentSettings = {
  analyticsConsent: true,
  emailAlerts: true,
  billingCommunication: true,
  marketingEmails: false,
}

const mockConsentHistory = [
  { id: "1", type: "analytics", action: "enabled", timestamp: new Date().toISOString(), ipAddress: "192.168.1.1" },
  { id: "2", type: "whatsapp_alerts", action: "disabled", timestamp: new Date(Date.now() - 86400000).toISOString(), ipAddress: "192.168.1.1" },
]

function formatDate(dateString) {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.toLocaleString("en-US", { month: "short" })
  const year = date.getFullYear()
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const ampm = hours >= 12 ? "pm" : "am"
  const hour12 = hours % 12 || 12
  return `${day} ${month}, ${year} ${hour12}:${minutes} ${ampm}`
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

const Switch = React.forwardRef(({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange?.(!checked)}
    ref={ref}
    className={cn(
      "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-primary" : "bg-input",
      className
    )}
    {...props}
  >
    <span
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
        checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </button>
))
Switch.displayName = "Switch"


// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function PrivacyDataPage() {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Privacy toggles (Real Logic)
    const [whatsappOptIn, setWhatsappOptIn] = useState(false);
    const [savingPrivacy, setSavingPrivacy] = useState(false);
    const [privacyError, setPrivacyError] = useState(null);

    // WhatsApp number collection modal
    const [showNumberModal, setShowNumberModal] = useState(false);
    const [pendingNumber, setPendingNumber] = useState('');

    // Erasure modal
    const [showErasureModal, setShowErasureModal] = useState(false);
    const [erasurePassword, setErasurePassword] = useState('');
    const [erasureLoading, setErasureLoading] = useState(false);
    const [erasureError, setErasureError] = useState(null);

    // Export logic
    const [exportLoading, setExportLoading] = useState(false);

    // Dummy settings
    const [analytics, setAnalytics] = useState(mockConsentSettings.analyticsConsent)
    const [email, setEmail] = useState(mockConsentSettings.emailAlerts)
    const [billing, setBilling] = useState(mockConsentSettings.billingCommunication)
    const [marketing, setMarketing] = useState(mockConsentSettings.marketingEmails)

    useEffect(() => {
        if (user && user.whatsappOptIn !== undefined) {
            setWhatsappOptIn(user.whatsappOptIn);
        }
    }, [user]);

    const handleToggleWhatsapp = async () => {
        setPrivacyError(null);
        const newState = !whatsappOptIn;

        if (newState === true && !user?.whatsappNumber) {
            setPendingNumber('');
            setShowNumberModal(true);
            return;
        }

        await submitPrivacyToggle({ whatsappOptIn: newState });
    };

    const handleNumberModalSubmit = async () => {
        if (!pendingNumber.trim()) {
            setPrivacyError("Please enter a valid WhatsApp number.");
            return;
        }
        setShowNumberModal(false);
        await submitPrivacyToggle({ whatsappOptIn: true, whatsappNumber: pendingNumber.trim() });
    };

    const submitPrivacyToggle = async (payload) => {
        setSavingPrivacy(true);
        setPrivacyError(null);
        try {
            const response = await api.put('/users/privacy', payload);
            setWhatsappOptIn(response.data.whatsappOptIn);
            await dispatch(loadUser());
        } catch (error) {
            console.error("Failed to update privacy settings", error);
            setPrivacyError(error.response?.data?.message || "Failed to update settings.");
            setWhatsappOptIn(user?.whatsappOptIn ?? false);
        } finally {
            setSavingPrivacy(false);
        }
    };

    const handleExportData = async () => {
        setExportLoading(true);
        try {
            const response = await api.get('/users/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `qrvibe_data_export.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to export data", error);
            alert("Failed to export data. Please try again later.");
        } finally {
            setExportLoading(false);
        }
    };

    const openErasureModal = () => {
        setErasurePassword('');
        setErasureError(null);
        setShowErasureModal(true);
    };

    const handleErasure = async () => {
        if (!erasurePassword) {
            setErasureError("You must enter your password to confirm deletion.");
            return;
        }

        setErasureLoading(true);
        setErasureError(null);
        try {
            await api.delete('/users/erasure', { data: { password: erasurePassword } });
            setShowErasureModal(false);
            alert("Your account and all associated data have been permanently deleted.");
            await dispatch(logout());
            navigate('/');
        } catch (error) {
            console.error("Erasure failed", error);
            setErasureError(error.response?.data?.message || "Failed to delete account. Please ensure your password is correct.");
        } finally {
            setErasureLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Privacy & Data</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your privacy settings and data rights.
                </p>
            </div>

            {/* Compliance Badge */}
            <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <Shield className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-emerald-900">DPDP Compliant</p>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                <Check className="mr-1 h-3 w-3" />
                                Verified
                            </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            QRVibe follows the Digital Personal Data Protection Act, 2023 guidelines.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - 2/3 */}
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Your Consent Choices</CardTitle>
                            <CardDescription>
                                Control how we collect and use your data. Changes take effect immediately.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Essential */}
                            <div className="rounded-md border bg-secondary/30 p-4">
                                <div className="flex items-start gap-3">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Essential Data Processing</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            We process minimal data needed to provide the QR code service. This cannot be disabled 
                                            while using QRVibe, but you can request complete data erasure.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10">
                                            <Eye className="h-5 w-5 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Scan Analytics</p>
                                            <p className="text-xs text-muted-foreground">
                                                Track scan counts, locations, and devices for your QR codes
                                            </p>
                                        </div>
                                    </div>
                                    <Switch checked={analytics} onCheckedChange={setAnalytics} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-500/10">
                                            <Bell className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">WhatsApp Alerts</p>
                                            <p className="text-xs text-muted-foreground">
                                                Receive alerts about broken links and important updates
                                            </p>
                                            {user?.whatsappNumber && (
                                                <p className="text-xs text-slate-700 font-semibold mt-1">
                                                    Linked: {user.whatsappNumber}
                                                </p>
                                            )}
                                            {privacyError && <p className="text-xs text-red-500 mt-1">{privacyError}</p>}
                                        </div>
                                    </div>
                                    <Switch checked={whatsappOptIn} onCheckedChange={handleToggleWhatsapp} disabled={savingPrivacy} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10">
                                            <FileText className="h-5 w-5 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Email Alerts</p>
                                            <p className="text-xs text-muted-foreground">
                                                Receive service alerts and notifications via email
                                            </p>
                                        </div>
                                    </div>
                                    <Switch checked={email} onCheckedChange={setEmail} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary border border-border">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Billing Communication</p>
                                            <p className="text-xs text-muted-foreground">
                                                Invoice and payment-related emails (required for paid plans)
                                            </p>
                                        </div>
                                    </div>
                                    <Switch checked={billing} onCheckedChange={setBilling} disabled />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary border border-border">
                                            <EyeOff className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Marketing Emails</p>
                                            <p className="text-xs text-muted-foreground">
                                                Product updates, tips, and promotional content
                                            </p>
                                        </div>
                                    </div>
                                    <Switch checked={marketing} onCheckedChange={setMarketing} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Consent History</CardTitle>
                            <CardDescription>
                                Record of your consent changes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">Setting</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="pr-6">IP Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockConsentHistory.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="pl-6 font-medium text-slate-900">
                                                {entry.type === 'analytics' ? 'Scan Analytics' : 'WhatsApp Alerts'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant="outline" 
                                                    className={cn(
                                                        entry.action === "enabled" 
                                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                                            : "bg-muted text-muted-foreground border-border"
                                                    )}
                                                >
                                                    {entry.action === "enabled" ? "Enabled" : "Disabled"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(entry.timestamp)}
                                            </TableCell>
                                            <TableCell className="pr-6 font-mono text-xs text-muted-foreground">
                                                {entry.ipAddress}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - 1/3 */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Your Data Rights</CardTitle>
                            <CardDescription>
                                Exercise your rights under DPDP Act 2023.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Export Data */}
                            <div className="flex items-center justify-between rounded-md border p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10">
                                        <Download className="h-5 w-5 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Export My Data</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Download all your data
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleExportData} disabled={exportLoading}>
                                    {exportLoading ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <Download className="h-4 w-4" />}
                                </Button>
                            </div>

                            {/* Request Erasure */}
                            <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10">
                                        <Trash2 className="h-5 w-5 text-destructive" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-destructive">Request Erasure</p>
                                        <p className="text-xs text-destructive/80 mt-0.5">
                                            Permanently delete data
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/30" onClick={openErasureModal}>
                                    Request
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Data Retention</CardTitle>
                            <CardDescription>
                                How long we keep your data.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 rounded-md border p-3">
                                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Account Data</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Kept until you delete your account or request erasure
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-md border p-3">
                                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Scan Analytics</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Aggregated data kept for 2 years, then automatically deleted
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-md border p-3">
                                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Billing Records</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Kept for 7 years as required by Indian tax law
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* MODALS */}
            {showNumberModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowNumberModal(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-foreground" />
                                </div>
                                <CardTitle>Add WhatsApp Number</CardTitle>
                            </div>
                            <CardDescription>
                                Enter your WhatsApp number in international format. We'll use this number exclusively for QR code health alerts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <input
                                    type="tel"
                                    value={pendingNumber}
                                    onChange={(e) => setPendingNumber(e.target.value)}
                                    placeholder="+919876543210"
                                    autoFocus
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button variant="outline" className="flex-1" onClick={() => setShowNumberModal(false)}>Cancel</Button>
                                <Button 
                                    className="flex-1" 
                                    onClick={handleNumberModalSubmit}
                                    disabled={!pendingNumber.trim() || savingPrivacy}
                                >
                                    {savingPrivacy ? "Saving..." : "Save & Enable"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showErasureModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-2xl relative border-destructive/20">
                        <button
                            onClick={() => setShowErasureModal(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                </div>
                                <CardTitle>Confirm Deletion</CardTitle>
                            </div>
                            <CardDescription>
                                This action is permanent and cannot be undone. To verify your identity, please enter your password below. All QR codes, analytics, and personal data will be erased immediately.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {erasureError && (
                                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm font-medium border border-destructive/20">
                                    {erasureError}
                                </div>
                            )}
                            <div className="mb-4">
                                <input
                                    type="password"
                                    value={erasurePassword}
                                    onChange={(e) => setErasurePassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoFocus
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button variant="outline" className="flex-1" onClick={() => setShowErasureModal(false)}>Cancel</Button>
                                <Button 
                                    variant="destructive"
                                    className="flex-1" 
                                    onClick={handleErasure}
                                    disabled={erasureLoading || !erasurePassword}
                                >
                                    {erasureLoading ? "Deleting..." : "Confirm Delete"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
