# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Storefront Merchants (Primary):** Independent brick-and-mortar business owners and managers in India across two core beachhead verticals:
  - **Salons, Spas & Beauty Parlours:** Need mirror standees, visual service rate cards, bridal lookbooks, treatment duration badges, and Google review generation to drive new walk-ins.
  - **Boutique Cafes, Bakeries & QSRs:** Need countertop standees, designer digital menus, dietary filters (Veg / Non-Veg), specials highlights, and instant item updates without costly reprints.
- **Storefront Patrons / Visitors (End-Scanners):** In-store clients and diners scanning countertop/mirror QRs with smartphone cameras (iOS Camera, Android Google Lens, WhatsApp). They expect instant, sub-50ms visual browsing and low-friction 1-tap actions (review submission, WhatsApp consultation or appointment booking).
- **Agency Marketers & Multi-Location Operators (Secondary):** Growth marketers and brand managers requiring campaign folders, UTM tracking builders, and aggregated multi-QR scan telemetry (supported via switchable Studio/Marketing mode).

## Product Purpose

QRVibe is the **In-Store Digital Front-Desk & Google Review Engine for Indian Storefronts**. It bridges the physical in-store countertop with digital customer conversion by uniting edge-routed dynamic QR codes, hosted mobile micro-pages (rate cards and digital menus), automated Google Review capture with private complaint shielding, and physical 2-sided acrylic countertop hardware. Success means zero money wasted on physical reprints, a continuous stream of verified 5-star Google reviews, and friction-free digital browsing for patrons.

## Positioning

- **Anti-Hostageware Guarantee:** Unlike predatory global QR generators (e.g., Scanova, Uniqode) that break or hostage QR links after 14-day trials, QRVibe guarantees that physical prints never go dead. Inactive or expired accounts enter soft grace periods with data preserved for 12 months.
- **Invisible AI Onboarding ("Snap-to-Page"):** Zero typing friction. Merchants photograph their printed paper menu or rate card; Gemini Flash multimodal vision parses categories, dishes/services, prices, and portion variants into a live, interactive catalog in under 60 seconds.
- **In-Menu Reputation Shield:**
  - *4–5 Stars:* Dynamic AI-generated review drafts customized to ordered dishes/services, allowing patrons to copy and publish to Google Maps in one tap without typing inertia.
  - *1–3 Stars (Private Shield):* Dissatisfied patrons are routed directly to the owner's private WhatsApp with custom resolution offers, resolving grievances on-site before public Google ratings are damaged.
- **Physical Hardware Standee:** Single-sided countertop acrylic standees framed with camera instructions and category center icons to guide customers straight to the digital front-desk, eliminating UPI payment confusion.

## Operating Context

- **Physical Environments:** Bustling salon styling stations, reception counters, and cafe dining tables with varying ambient lighting and distracted, mobile-first users.
- **Network Realities:** Mobile 4G/5G carriers (Jio, Airtel, Vi) routing traffic through regional gateway hubs; edge redirect hot path delivers sub-50ms response times.
- **Hardware Touchpoints:** Countertop acrylic/wooden standees (4x6 inch) and 5cm vinyl sticker-swap kits.
- **Owner Rituals:** Weekly Monday morning automated WhatsApp push digest delivering scan counts, review clicks, and top items directly to the owner's phone without requiring desktop dashboard logins.

## Capabilities and Constraints

- **Dual Chameleon Architecture:** Seamless 1-click vertical skinning between `'salon'` and `'cafe'` modes powered by a centralized vocabulary engine (`VOCABULARY`). Dynamically shifts terminology, badges (duration, brand used vs prep time, spice level), and filtering (For Her / For Him / Unisex vs Veg / Non-Veg).
- **Storefront vs. Studio Progressive Disclosure:** Storefront mode strips marketing bloat down to 5 essentials (`/dashboard`, `/qrcodes`, `/create`, `/billing`, `/account`) and localized table/mirror standee terminology; Studio mode preserves full UTM, folder, and multi-campaign CRM controls.
- **Deep Hardware Standee Integration:** In-app 4x6 inch print canvas preview, printable PDF/SVG export, and physical standee delivery tracking alongside live digital link controls.
- **DPDP Privacy by Design:** In compliance with India's Digital Personal Data Protection Act, QRVibe uses salted SHA-256 session hashing instead of storing raw PII, IP addresses, or persistent GPS coordinates.
- **Technical Stack:** React + Tailwind CSS + shadcn/ui frontend running on Vite; decoupled Node.js/Express backend (`app.js`, `index.js`, `worker.js`) with MongoDB and atomic Mutex locks (`JobLock.js`). Configuration strictly centralized in `backend/config/env.js`.

## Brand Commitments

- **Name:** QRVibe (qrvibe.in)
- **Visual Identity ("Warm Professional"):**
  - *Primary (60% — Canvas & Space):* Rich Cream / Alabaster (`#FBF9F6`)
  - *Secondary (30% — Structure & Typography):* Deep Espresso Brown (`#2B1E19`)
  - *Accent (10% — Focus & CTAs):* Warm Honey Yellow (`#E5A93C`)
- **Typography:** `Inter` (sans-serif) for headings; `Roboto` (sans-serif) for body text.
- **Voice & Tone:** Direct, respectful, business-empowering, and grounded in "Zero-Mehnat" (zero-effort). Active, outcome-driven headlines.
- **Physical QR Micro-Copy:** Must feature `📷 Open Phone Camera to Scan (Not GPay)` (`फ़ोन कैमरा से स्कैन करें`) and a dead-center category icon (scissors / utensils / logo) to immediately counter the UPI payment visual reflex.
- **Platform Pledge:** "100% Anti-Hostageware Guarantee: Your printed QR codes never break."

## Evidence on Hand

- Production React codebase in `frontend/src/` with complete Storefront routing, Chameleon skinning, OCR menu extraction, review booster funnels, and public template engines (`ImmersiveTemplate`, `LighthouseTemplate`, `BasicTemplates`).
- Comprehensive architectural standards and progress records in `Context/Project_overview.md`, `Context/Ui_Context.md`, `Context/Architecture_context.md`, and `Context/progress tracker.md`.
- Multimodal Gemini OCR service (`backend/services/MenuAiService.js`) and curated Unsplash beauty/food catalog (`backend/data/serviceImageCatalog.js`).
- Clean test suite and Playwright MCP end-to-end browser automation tools.

## Product Principles

1. **Prints Must Never Die (Anti-Hostageware):** Real-world physical signage outlives digital subscriptions. Storefront links must degrade gracefully with archiving and recovery, never turning into dead 404 links.
2. **Invisible AI (Zero-Mehnat):** Storefront owners should never write prompts or debug layouts. AI exists strictly to eliminate manual data entry (paper photo -> live digital catalog in 60s).
3. **Break the UPI Reflex Physically and Digitally:** In India, QR codes on counters are reflexively assumed to be UPI payments. Design must actively differentiate through clear camera framing, centered category icons, and high-visibility physical standee signage.
4. **Protect Reputation on the Spot:** Defuse bad customer experiences privately via WhatsApp before they reach public review sites; make 5-star Google review submissions effortless with 1-tap AI drafts.
5. **Progressive Disclosure by Role:** Storefront merchants see only what drives daily footfall (standees, scans, reviews); enterprise complexity (UTMs, folders, multi-user seats) remains safely tucked behind Studio mode.

## Accessibility & Inclusion

- High contrast ratio between Deep Espresso typography (`#2B1E19`) and Cream canvas (`#FBF9F6`).
- Inclusive client filtering (`All`, `For Her`, `For Him`, `Unisex`) with graceful fallback matching.
- Minimum 44x44px touch targets across all mobile template viewports for one-handed operation.
- Clear bilingual micro-copy (English + Hindi) on physical standee instructions.

