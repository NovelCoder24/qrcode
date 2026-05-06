# QRVibe — Product Requirements Document (PRD)

> **Version:** 1.0  
> **Last Updated:** May 5, 2026  
> **Product URL:** [https://qrvibe.in](https://qrvibe.in)

---

## 1. Product Overview

**QRVibe** is a B2B SaaS platform that enables businesses to create beautifully styled, dynamic QR codes and track every scan with real-time analytics — city-level location data, device breakdowns, trend charts, and more. Unlike static QR generators, QRVibe's QR codes are permanent short links whose destinations, content, and designs can be changed at any time without reprinting.

### 1.1 One-Line Pitch

> Create stylish, dynamic QR codes and track every scan in real-time — built for modern Indian businesses.

### 1.2 Core Value Proposition

| Pain Point | QRVibe Solution |
|---|---|
| Printed QR codes can't be updated | Dynamic short links (`/r/:shortId`) let you change the destination anytime |
| No visibility on who scans | Every scan logs device, OS, browser, city, country, and timezone |
| QR codes look generic and ugly | Full design studio: dot patterns, gradients, eye shapes, colors, logos |
| Multiple content types need different tools | One platform supports URL, PDF, vCard, WhatsApp, Social Links, and Media |
| Broken links on printed materials go undetected | Automated 24-hour health monitor pings every link and sends email/WhatsApp alerts |

---

## 2. Target Users

### 2.1 Primary Persona — Small-to-Medium Indian Businesses
- **Restaurants** putting QR codes on menus, table stickers, and flyers
- **Retail stores** linking to offers, Google reviews, or Instagram pages
- **Real-estate agents** sharing property brochures and contact vCards
- **Event organizers** distributing schedules, tickets, and social links

### 2.2 Secondary Persona — Marketing Agencies
- Agencies managing QR campaigns across multiple clients
- Need bulk creation, team collaboration, and white-label capabilities

---

## 3. Product Architecture

### 3.1 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite, Tailwind CSS, Redux Toolkit |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JWT (Access Token: 15 min + Refresh Token: 7 days, httpOnly cookie) |
| **File Storage** | Cloudinary (via multer-storage-cloudinary) |
| **Payments** | Razorpay (UPI AutoPay, Cards, Net Banking) + Stripe (international) |
| **QR Rendering** | `qr-code-styling` (client-side canvas/SVG generation) |
| **Geolocation** | `geoip-lite` (synchronous local IP database, zero external API calls) |
| **Hosting** | Railway (backend) + Vercel (frontend) |

### 3.2 System Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Vercel)                          │
│                                                                      │
│  Landing Page ─── Auth (Login/Register) ─── Dashboard Layout        │
│                                               │                      │
│                     ┌─────────────────────────┼──────────────┐       │
│                     │                         │              │       │
│               Create Wizard            QR Manager        Analytics   │
│              (3-step flow)           (list + detail)    (master/     │
│                                                         detail)      │
│                     │                         │              │       │
│              Type → Content → Design    Edit/Delete/     Global +    │
│                                         Download/Copy   Per-QR KPIs │
│                                                                      │
│  Public View Pages: /pdf/:id  /vcard/:id  /social/:id  /media/:id   │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │ HTTPS (REST API)
┌────────────────────────────────┴─────────────────────────────────────┐
│                         BACKEND (Railway)                            │
│                                                                      │
│  /api/users/*        Auth, profile, token refresh                    │
│  /api/qrcodes/*      CRUD for QR codes                               │
│  /api/analytics/*    Dashboard, table, per-QR analytics              │
│  /api/razorpay/*     Subscriptions, billing, webhooks                │
│  /api/upload/*       Cloudinary file uploads                         │
│  /r/:shortId         Redirect engine + scan logging                  │
│                                                                      │
│  Background Jobs:    Health Monitor (cron, midnight daily)           │
│                      Trial Expiration Checker                        │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │     MongoDB Atlas        │
                    │                          │
                    │  Collections:            │
                    │  • Users                 │
                    │  • QRCodes               │
                    │  • Scans                 │
                    └──────────────────────────┘
```

---

## 4. Feature Breakdown

### 4.1 Authentication & Onboarding

| Feature | Description |
|---|---|
| **Email/Password Registration** | Standard signup with bcrypt password hashing |
| **Google OAuth** | Social login via `authProvider: 'google'` flag |
| **JWT Token Pair** | Short-lived access token (15 min) + long-lived refresh token (7 days) stored as httpOnly cookie |
| **Silent Token Refresh** | Automatic refresh via `/api/users/refresh-token` — no user friction |
| **Reverse Trial Strategy** | Every new user starts on the **Pro** plan for 14 days. After trial expires, auto-downgrades to Starter (free) |
| **First QR Onboarding** | `hasCreatedFirstQR` flag triggers a celebration banner on first QR creation, guiding users to immediate value |

### 4.2 QR Code Types

QRVibe supports 6 distinct QR code types, each with its own content form and public-facing view page:

| Type | Content | Redirect Behavior |
|---|---|---|
| **URL** | Any web link | `302` redirect to destination with auto-appended UTM parameters |
| **PDF** | Uploaded PDF file (Cloudinary) | Redirects to `/pdf/:shortId` — branded mobile viewer |
| **vCard** | Contact info (name, phone, email, org, address) | Redirects to `/vcard/:shortId` — save-to-contacts page |
| **WhatsApp** | Pre-filled WhatsApp message + phone number | `302` redirect to `wa.me` link |
| **Social** | Multiple social media links (Instagram, Twitter, YouTube, etc.) | Redirects to `/social/:shortId` — link-in-bio style page |
| **Media** | Images, video, and audio files (Cloudinary) | Redirects to `/media/:shortId` — media gallery viewer |

### 4.3 QR Creation Wizard (3-Step Flow)

```
Step 1: Type Selection     →    Step 2: Content Form     →    Step 3: Design Studio
(Pick URL/PDF/vCard/etc.)       (Enter destination data)       (Style your QR code)
```

**Step 1 — Type Selection**
- Visual grid of 6 QR types with icons and labels
- Double-click to auto-advance for faster UX

**Step 2 — Content Form** (varies by type)
- **URL**: Simple URL input field
- **PDF**: File upload with drag-and-drop + title/description fields
- **vCard**: Structured contact form (name, phone, email, company, job title, address)
- **WhatsApp**: Phone number + pre-filled message textarea
- **Social**: Multi-link form for Instagram, Facebook, YouTube, LinkedIn, Twitter, TikTok, and custom links
- **Media**: Multi-file upload for images, videos, and audio files with gallery title

**Step 3 — Design Studio**
- **Dot Patterns**: Square, Dots, Rounded, Extra Rounded, Classy, Classy Rounded
- **Foreground Color**: Primary color picker + optional secondary color for gradients
- **Gradient Types**: Linear, Radial
- **Background Color**: Full color picker
- **Eye (Corner) Shape**: Square, Dot, Extra Rounded
- **Eye Color**: Independent color control for the three position markers
- **Logo Upload**: Center logo overlay via Cloudinary URL
- **Live Preview**: Real-time `qr-code-styling` canvas rendering as user adjusts settings

### 4.4 Dashboard (QR Manager)

| Feature | Description |
|---|---|
| **QR Code List** | All user QR codes sorted by creation date (newest first) |
| **Two View Modes** | Mobile-optimized card view + desktop table view with responsive breakpoints |
| **Inline Editing** | Click-to-edit title and destination URL directly from the list |
| **Type Change** | Modal to switch QR type without losing the short link |
| **Preview Modal** | Full-fidelity QR code rendering with all custom styles (click the placeholder thumbnail) |
| **Download Modal** | Export in PNG, JPEG, or SVG format at configurable sizes |
| **Copy Short Link** | One-click copy `qrvibe.in/r/xxxxx` to clipboard |
| **Bulk Select** | Checkbox multi-select for batch operations (delete) |
| **Search** | Real-time filter across title, URL, type, and short ID |
| **3-Dot Context Menu** | Per-QR dropdown: Edit Design, Download, Change Type, Copy Link, Delete |

### 4.5 Analytics Dashboard (Master-Detail Architecture)

#### Global State (State 1)
- **Top Bar KPIs**: Total Scans, Unique Scanners, Active QRs, Peak Scan Time
- **Percentage Deltas**: Comparison against the previous equivalent period (e.g., last 30 days vs. prior 30 days)
- **Trend Line Chart**: Daily scan volume with human-readable date tooltips (e.g., "Tue, Apr 29")
- **Device Breakdown**: Donut chart (Mobile / Desktop / Tablet split)
- **Top Cities**: City-level scan density (auto-zoomed to India for Indian-majority traffic)
- **Top Browsers & OS**: Ranked bar charts
- **QR Code Table**: Paginated, searchable list of all QR codes with scan counts — `GET /api/analytics/table?page=1&limit=10&sort=-scans`

#### Drill-Down State (State 2)
- Activated when a user clicks a specific QR code from the table
- "← Back to Global" navigation button
- All KPIs and charts recalculate for the selected QR code only
- Uses dedicated endpoint: `GET /api/analytics/qrcodes/:id`

### 4.6 Link Health Monitoring

| Component | Detail |
|---|---|
| **Cron Schedule** | Runs every 24 hours at midnight UTC |
| **Check Method** | HTTP GET with 10-second timeout, follows up to 3 redirects |
| **Status Flags** | `active`, `broken`, `unchecked` (stored on each QR document) |
| **Alert Channels** | Email (via SMTP/Nodemailer) + WhatsApp (via Twilio) |
| **Deduplication** | Only sends an alert the **first time** a link breaks — no daily spam |
| **Bot Signature** | Identifies itself as `QRVibe-HealthBot/1.0` |

### 4.7 Scan Tracking & Redirect Engine

When a QR code is scanned, the redirect engine (`GET /r/:shortId`) performs:

1. **Lookup** — Find QR by `short_id`, validate `isActive`
2. **User-Agent Parsing** — Extract OS, browser, device type via `ua-parser-js`
3. **Bot Detection** — Regex filter for WhatsApp preview, Slack unfurl, Googlebot, etc.
4. **GeoIP Lookup** — Synchronous local DB via `geoip-lite` (country, city, region, timezone, lat/lng)
5. **Session Hashing** — SHA-256 hash of `IP + User-Agent` for unique scanner tracking
6. **Scan Log Write** — Fire-and-forget `Scan.create()` (never blocks the redirect)
7. **Auto UTM Builder** — Appends `utm_source=qrvibe`, `utm_medium=qr_code`, `utm_campaign={title}` if not already present
8. **Redirect** — `302` to final URL (or frontend view page for PDF/vCard/Social/Media types)

### 4.8 Public View Pages

Branded landing pages for non-URL QR types:

| Page | Route | Features |
|---|---|---|
| **PDF Viewer** | `/pdf/:shortId` | Embedded PDF viewer, title, description, download button |
| **vCard** | `/vcard/:shortId` | Contact card with photo, name, phone, email, company, address. "Save to Contacts" button generates a `.vcf` download |
| **Social Links** | `/social/:shortId` | Link-in-bio style page with branded icons for each social platform |
| **Media Gallery** | `/media/:shortId` | Image carousel, video player, audio player — all from Cloudinary URLs |

---

## 5. Billing & Monetization

### 5.1 Pricing Tiers

| | **Starter (Free)** | **Pro Vibe** | **Agency** |
|---|---|---|---|
| **Price** | ₹0 | ₹699/mo (annual) · ₹899/mo (monthly) | ₹19,999/yr |
| Dynamic QR Codes | 5 | Unlimited | Unlimited |
| Static QR Codes | 10 | Unlimited | Unlimited |
| Scans/month | 500 | 50,000 | Unlimited |
| QR Types | URL only | All 6 types | All 6 types |
| Analytics | Basic | Full (city-level, trends, devices) | Full |
| Custom Patterns & Logos | ✗ | ✓ | ✓ |
| SVG Export | ✗ | ✓ | ✓ |
| Bulk Creation | ✗ | ✗ | ✓ |
| Team Members | ✗ | ✗ | ✓ |
| API Access | ✗ | ✗ | ✓ |
| Custom Domain | ✗ | ✗ | ✓ |
| Priority Support | ✗ | ✗ | ✓ |

### 5.2 Reverse Trial Strategy

All new users get **14 days of Pro** features for free. After trial expiration, a midnight cron job automatically downgrades them to the Starter plan. This ensures users experience the full product before deciding to pay.

### 5.3 Payment Gateway

| Gateway | Currency | Methods |
|---|---|---|
| **Razorpay** | INR | UPI AutoPay, Credit/Debit Cards, Net Banking, Wallets |
| **Stripe** | USD/EUR (future) | Cards, Apple Pay, Google Pay |

- **Webhook-driven** subscription lifecycle: `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled`, `payment.failed`
- **B2B Billing**: GST number validation (15-char alphanumeric), company name, billing address — feeds into Razorpay Invoice API for GST-compliant invoices
- **Graceful degradation**: Test mode with mock responses when Razorpay keys are not configured

---

## 6. Data Models

### 6.1 User
```
{
  name, email, password (hashed), authProvider ('local' | 'google'),
  whatsappNumber,
  subscription: {
    plan ('starter' | 'pro' | 'business'),
    status ('trialing' | 'active' | 'past_due' | 'canceled' | 'expired'),
    trialEndsAt (Date, default: now + 14 days),
    gateway ('razorpay' | 'stripe'),
    currency ('INR'),
    razorpayCustomerId, razorpaySubscriptionId,
    stripeCustomerId, stripeSubscriptionId
  },
  billing: {
    companyName, gstNumber,
    address: { line1, city, state, pincode }
  },
  hasCreatedFirstQR (Boolean)
}
```

### 6.2 QRCode
```
{
  user_id (ref → User),
  short_id (unique, 6-char nanoid),
  target_url,
  qr_type ('URL' | 'PDF' | 'VCARD' | 'WHATSAPP' | 'SOCIAL' | 'MEDIA'),
  customization: {
    qrStyle, fgColor, fgColor2, gradientType, bgColor,
    eyeShape, eyeColor, logoUrl
  },
  isActive (Boolean),
  health_status ('active' | 'broken' | 'unchecked'),
  last_pinged_at (Date),
  stats: { total_scans, last_scanned_at },
  metadata: { title, description, company, ... }
}
```

### 6.3 Scan
```
{
  qr_id (ref → QRCode),
  owner_id (ref → User),
  location: { country, country_code, city, region, timezone, ll: [lat, lng] },
  device: { os, browser, type },
  isBot (Boolean),
  sessionContext (SHA-256 hash for unique-scanner dedup)
}
Indexes: [qr_id + city], [createdAt desc], [owner_id + createdAt], [qr_id + createdAt]
```

---

## 7. API Endpoints

### 7.1 Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register` | Create account, return JWT |
| POST | `/api/users/login` | Validate credentials, return JWT |
| GET | `/api/users/me` | Get current user profile (protected) |
| POST | `/api/users/refresh-token` | Silent token refresh via httpOnly cookie |
| POST | `/api/users/logout` | Clear refresh token cookie |
| PUT | `/api/users/profile` | Update profile (name, whatsappNumber) |

### 7.2 QR Code Management (Protected)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/qrcodes` | Create a new QR code |
| GET | `/api/qrcodes` | List all user's QR codes |
| GET | `/api/qrcodes/:id` | Get single QR code |
| PUT | `/api/qrcodes/:id` | Update QR code |
| DELETE | `/api/qrcodes/:id` | Delete QR code |

### 7.3 Analytics (Protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/dashboard?days=30` | Global analytics (KPIs, charts, trends) |
| GET | `/api/analytics/table?page=1&limit=10&sort=-scans&search=` | Paginated QR list for analytics table |
| GET | `/api/analytics/qrcodes/:id?days=30` | Per-QR analytics |

### 7.4 Billing (Protected)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/razorpay/create-subscription` | Create Razorpay subscription |
| GET | `/api/razorpay/subscription-status` | Get current subscription status |
| POST | `/api/razorpay/cancel` | Cancel subscription at period end |
| PUT | `/api/razorpay/update-billing-info` | Update GST number + billing address |
| POST | `/api/razorpay/webhook` | Razorpay webhook handler (public, signature-verified) |

### 7.5 File Upload (Protected)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload file to Cloudinary (10MB limit) |

### 7.6 Redirect Engine (Public)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/r/:shortId` | Scan redirect + analytics logging |
| GET | `/r/info/:shortId` | Public QR metadata (for view pages) |

---

## 8. SEO & Social Optimization

| Asset | Implementation |
|---|---|
| **Meta Description** | Keyword-rich, 160-char optimized description in `index.html` |
| **Open Graph Tags** | `og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`, `og:locale` (en_IN) |
| **Twitter Cards** | `summary_large_image` with dedicated OG image |
| **Canonical URL** | `https://qrvibe.in/` |
| **Favicon** | SVG (primary) + PNG 512x512 fallback + Apple Touch Icon — all using the QRVibe brand mark |
| **Structured Data** | JSON-LD `SoftwareApplication` schema for rich search results |
| **robots.txt** | Allows landing/auth pages; blocks all authenticated dashboard routes |
| **sitemap.xml** | 3 public pages: `/`, `/login`, `/register` |
| **Theme Color** | `#5B3FF4` (brand gradient midpoint) |

---

## 9. Security & Infrastructure

| Area | Implementation |
|---|---|
| **Password Storage** | bcrypt with salt rounds = 5 |
| **Token Architecture** | Access token (15 min, in-memory) + Refresh token (7 days, httpOnly + Secure + SameSite=Strict cookie) |
| **CORS** | Strict origin whitelist (localhost in dev, Vercel domains in prod) |
| **Webhook Security** | HMAC-SHA256 signature verification for Razorpay webhooks |
| **Ownership Checks** | All QR CRUD endpoints validate `user_id` matches authenticated user |
| **URL Sanitization** | Pre-save Mongoose middleware auto-prefixes `https://` on URL-type QR codes |
| **Bot Filtering** | Regex-based UA filtering excludes WhatsApp/Slack/Telegram previews from scan analytics |
| **Rate-Aware Design** | IP forwarding via `trust proxy`, `x-forwarded-for` header parsing |

---

## 10. Background Services

| Job | Schedule | Description |
|---|---|---|
| **Health Monitor** | Daily at midnight | Pings all active QR target URLs. Marks broken links. Sends email + WhatsApp alerts on first detection. |
| **Trial Expiration** | Daily at midnight | Finds users with `status: 'trialing'` and `trialEndsAt < now()`. Bulk-downgrades them to Starter. |

---

## 11. Future Roadmap

| Priority | Feature | Notes |
|---|---|---|
| 🟢 High | **PDF/CSV Export** for analytics | "Export Report" button in drill-down state |
| 🟢 High | **Date Range Picker** | Granular date filtering on analytics endpoints |
| 🟡 Medium | **Bulk QR Creation** (Agency tier) | CSV upload → batch create dynamic QR codes |
| 🟡 Medium | **Team Members & Roles** | Invite collaborators with viewer/editor/admin roles |
| 🟡 Medium | **Custom Domains** | CNAME support for `scan.yourbrand.com/r/xxxxx` |
| 🟡 Medium | **API Access** (Agency tier) | Public REST API with API key authentication |
| 🟡 Medium | **Folder Organization** | Group QR codes into folders/campaigns |
| 🔵 Low | **A/B Destination Testing** | Split traffic between two URLs, measure CTR |
| 🔵 Low | **QR Code Frames** | Add "Scan Me" frames around generated QR images |
| 🔵 Low | **Stripe Integration** | International payments for non-INR customers |

---

## 12. Brand Assets

| Asset | File | Usage |
|---|---|---|
| **App Icon / Favicon** | `qrvibe-logo-mark.svg`, `.png` (512×512) | Browser tab, PWA icon, Apple Touch Icon |
| **Full Logo (Dark BG)** | `qrvibe-logo-primary-light.svg` | Footer, dark sections |
| **Full Logo (Light BG)** | `qrvibe-logo-primary.svg`, `.png` | Navbar, light sections |
| **OG Social Card** | `og-image.png` | Shared on Twitter, LinkedIn, WhatsApp, Facebook |
| **Logo Preview Sheet** | `qrvibe-logo-preview.png` | Internal brand reference |
| **Brand Colors** | `#3B82F6` → `#5B3FF4` → `#8B5CF6` (gradient), `#00D49F` (accent green) | Primary gradient + analytics accent |
| **Typography** | Plus Jakarta Sans (weights 300–800) | All UI text |

---

*This document describes QRVibe as of May 2026. For technical implementation details, see [TRD.md](./TRD.md). For security protocols, see [Security_protocol.md](./Security_protocol.md).*
