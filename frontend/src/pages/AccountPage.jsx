"use client"

import * as React from "react"
import {
  User,
  Palette,
  Globe,
  Bell,
  Key,
  Lock,
  Camera,
  Save,
  ExternalLink,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Badge } from "@/components/UI/badge"
import { cn } from "@/lib/utils"

import api from "../api/axios"
import { loadUser } from "../redux/authSlice"

// ==========================================
// MOCK DATA FOR DUMMY FEATURES
// ==========================================
const mockPlan = {
  name: "Free"
}

// ==========================================
// INLINE COMPONENTS
// ==========================================
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

const Separator = React.forwardRef(({ className, orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props}
  />
))
Separator.displayName = "Separator"

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

// Simple Tabs Implementation
const Tabs = ({ defaultValue, className, children }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue)
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        return React.cloneElement(child, { activeTab, setActiveTab })
      })}
    </div>
  )
}

const TabsList = ({ activeTab, setActiveTab, children, className }) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
    {React.Children.map(children, (child) => {
        if (!child) return null;
        return React.cloneElement(child, { activeTab, setActiveTab })
    })}
  </div>
)

const TabsTrigger = ({ value, activeTab, setActiveTab, children, className }) => {
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab(value)}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value, activeTab, children, className }) => {
  if (value !== activeTab) return null;
  return (
    <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  )
}


// ==========================================
// SETTINGS COMPONENTS
// ==========================================

function ProfileSettings({ user, dispatch }) {
  const [name, setName] = React.useState(user?.name || "")
  const [email, setEmail] = React.useState(user?.email || "")
  const [company, setCompany] = React.useState("")
  const [whatsapp, setWhatsapp] = React.useState(user?.whatsappNumber || "")
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Pushing everything to profile endpoint. Backend will handle what it supports.
      await api.put('/users/profile', { whatsappNumber: whatsapp, name, company });
      await dispatch(loadUser());
      alert("Profile updated successfully!");
    } catch (e) {
      console.error(e)
      alert("Failed to update profile");
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Profile</CardTitle>
        <CardDescription>
          Manage your personal information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="sr-only">Change avatar</span>
            </Button>
          </div>
          <div>
            <p className="font-medium">{user?.name || "User"}</p>
            <p className="text-sm text-muted-foreground">QRVibe Member</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Read Only)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="bg-muted"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                placeholder="+1234567890"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Used for broken link alerts if opted in via Privacy page.</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}

function BrandKitSettings() {
  const [primaryColor, setPrimaryColor] = React.useState("#1a1a2e")
  const [logoUrl, setLogoUrl] = React.useState("")

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Brand Kit</CardTitle>
            <CardDescription>
              Customize QR codes with your brand colors and logo.
            </CardDescription>
          </div>
          {mockPlan.name === "Free" && (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              Pro Feature
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandColor">Brand Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="brandColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-md border"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="font-mono uppercase flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This color will be used as the default for new QR codes.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Add a logo to the center of your QR codes. Works best with square images.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Brand Kit
        </Button>
      </CardFooter>
    </Card>
  )
}

function CustomDomainSettings() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Custom Domain</CardTitle>
            <CardDescription>
              Use your own domain for QR code redirects.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-secondary text-muted-foreground">
            Business Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-dashed p-6 text-center">
          <Globe className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 font-medium">Custom Domain</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade to Business plan to use your own domain like qr.yourbrand.com
          </p>
          <Button variant="outline" className="mt-4">
            View Business Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationSettings() {
  const [emailDigest, setEmailDigest] = React.useState(true)
  const [weeklyReport, setWeeklyReport] = React.useState(true)
  const [scanMilestones, setScanMilestones] = React.useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Notification Preferences</CardTitle>
        <CardDescription>
          Choose what notifications you receive.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Daily Email Digest</p>
            <p className="text-xs text-muted-foreground">
              Summary of scans and alerts from the past 24 hours
            </p>
          </div>
          <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Weekly Performance Report</p>
            <p className="text-xs text-muted-foreground">
              Weekly summary of QR code performance
            </p>
          </div>
          <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Scan Milestones</p>
            <p className="text-xs text-muted-foreground">
              Notify when QR codes reach scan milestones (100, 500, 1000, etc.)
            </p>
          </div>
          <Switch checked={scanMilestones} onCheckedChange={setScanMilestones} />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  )
}

function APISettings() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">API & Webhooks</CardTitle>
            <CardDescription>
              Integrate QRVibe with your applications.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-secondary text-muted-foreground">
            Business Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-dashed p-6 text-center">
          <Key className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 font-medium">API Access</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade to Business plan to access the QRVibe API and webhooks.
          </p>
          <Button variant="outline" className="mt-4">
            View Business Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SecuritySettings() {
  const [twoFactor, setTwoFactor] = React.useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Security</CardTitle>
        <CardDescription>
          Manage your account security settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Two-Factor Authentication</p>
            <p className="text-xs text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Change Password</p>
            <p className="text-xs text-muted-foreground">
              Update your account password
            </p>
          </div>
          <Button variant="outline" size="sm">
            Change
          </Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Active Sessions</p>
            <p className="text-xs text-muted-foreground">
              Manage devices logged into your account
            </p>
          </div>
          <Button variant="outline" size="sm">
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function AccountPage() {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 md:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none p-0 h-auto gap-4 overflow-x-auto overflow-y-hidden pb-px">
          <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-3 pt-2">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="brand" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-3 pt-2">
            <Palette className="mr-2 h-4 w-4" />
            Brand Kit
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-3 pt-2">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-3 pt-2">
            <Lock className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="api" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-3 pt-2">
            <Key className="mr-2 h-4 w-4" />
            API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettings user={user} dispatch={dispatch} />
        </TabsContent>

        <TabsContent value="brand" className="space-y-6">
          <BrandKitSettings />
          <CustomDomainSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <APISettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
