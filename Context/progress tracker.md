# Progress Tracker

> **Last Updated:** October 2026  
> **Methodology:** Spec-Driven Development (SDD)

## 🎯 Current Goal
Build out QRVibe as the **In-Store Digital Front-Desk & Google Review Engine for Indian Storefronts** (Salons & Spas, Cafes & QSRs, Healthcare Clinics) backed by edge dynamic routing, DPDP privacy, and physical countertop hardware.

## ✅ Completed (Architecture & Features)
- **Strategic Specs Finalized:**
  - Repositioned from generic "QR generator" to In-Store Front-Desk & Review Engine in `Context/Project_overview.md`.
  - Defined P0 Beachhead Verticals: Salons/Spas & Boutique Cafes/QSRs; P1: Dental Clinics & Academies.
  - Specified "Warm Professional" brand identity & "Scan with Phone Camera (Not GPay)" in `Context/Ui_Context.md`.
  - Specified dedicated countertop acrylic standees & mirror tags (Side B / UPI payment QRs and 2-sided standees strictly avoided to eliminate scanner confusion and payment liabilities).
  - Demoted forced dine-in WhatsApp order taking in favor of visual browsing, high-res photos, Veg/Non-Veg filters, and "Call Waiter / Ask for Bill".
- **Backend & Core Engine:**
  - Decoupled `app.js`, `index.js`, and `worker.js`.
  - Implemented MongoDB-backed Mutex Job Locks (`JobLock.js`).
  - Built Audited 3-Tier Geolocation & Placement Engine (`Verified GPS > Physical QR Placement Metadata > Coarse IP` with single-flight dedup, tap-to-consent DPDP interstitial, single-use telemetry tokens, fast-204 responses, and in-app webview skip).
  - Replaced raw IPs and raw GPS coordinates with DPDP-compliant SHA-256 session hashing and city/region-only storage.
  - Deployed Pre-Aggregated Materialized Views (`DailyScanStats`).
  - Added Reverse Geocoding (BigDataCloud in production, Nominatim dev-only).
  - Fixed Dashboard infinite remount crash (`PrivateRoute.jsx` & `DashboardOverview.jsx`) and synchronized `Sidebar.jsx` plan & active QR counts.
  - Fixed Menu & Hosted QR (`MENU`, `VCARD`, `PDF`, `SOCIAL`, `MEDIA`) blank page bug on target/test links.
  - Completely removed WhatsApp Cart ordering from Digital Menus (`MenuForm.jsx`, `MenuViewPage.jsx`, templates, and `qrValidator.js`) to eliminate dine-in ordering friction in favor of a pure Visual Menu / Rate Card & Reputation Shield experience.
  - Built & hardened "AI Photo-to-Menu" in Step 2 of QR Creator (`backend/services/MenuAiService.js`, `MenuImportModal.jsx`, `MenuForm.jsx`, Gemini Flash multimodal OCR with allergen-safe descriptions and Unsplash dish fallback catalog).
  - Abstracted Menu Dishes & Dropdown Card UI in Step 2 of QR Creator (`frontend/src/pages/create/forms/MenuForm.jsx`, `frontend/src/components/MenuTemplates/MenuImportModal.jsx`): Replaced giant vertical scroll with a collapsible Dropdown Card right below Restaurant Details, abstracted dishes into compact expandable rows with inline editors, global expand/abstract controls, and smooth auto-scroll on AI import.
  - Implemented Architecture D: Smart Adaptive Redirect + Zero-Prompt Micro-Bridge + Atomic Telemetry Reconciliation (`redirectController.js`, `Geolocation.js`, 100% test pass on 45 tests).
  - Built & deployed In-Menu **AI Google Review Booster & 1-to-3 Star Private Shield** (`ReviewFunnel.jsx`, `MenuViewPage.jsx`, `MenuForm.jsx`): Includes persistent floating bottom pill ("⭐ Loved our food? Tap to leave a 10s Google Review"), interactive 5-star rating modal, dynamic 3-draft AI review generator tailored to menu dishes with 1-tap clipboard copy & Google Maps review launcher, and private WhatsApp complaint shield with custom resolution offers.
  - Implemented **Storefront-First Launch & Progressive Disclosure**:
    - Backend: `workspaceMode` enum (`'storefront'`, `'marketing'`, default `'storefront'`) on `User.js` model, serialized in `sendTokens` and `getMe`. All new users launch directly into Storefront Mode.
    - Routing Hot Path: Storefront / MENU QR scans bypass micro-bridge latency and external BigDataCloud reverse geocoding lookups, delivering sub-50ms instant 302 redirects while anonymously tracking device, time-of-day, and unique visitors via DPDP salted hashing.
    - Navigation: Sidebar defaults to the 5 essential storefront items (`/dashboard`, `/qrcodes`, `/create`, `/billing`, `/account`) and hides campaign bloat (Folders, Analytics, Alerts, Privacy); plan card displays "Table QR codes used".
    - Overview: DashboardOverview dynamically hides marketing-specific cards (Print Safety Score with UTM checks, Team Seats) and surfaces localized table vocabulary.
    - QR Creation: `TypeSelection.jsx` filters down to storefront essentials (Menu, vCard, Website URL) while preserving marketing types for later toggling.
    - Zero-Friction Onboarding: Disabled modal prompt on signup; merchants land straight on the focused Storefront dashboard. Switcher remains available in Settings (`AccountPage.jsx`).
  - **Operational & Feature Scope Discipline:**
    - Excluded "Call Waiter / Ask for Bill" from the active menu UI to eliminate diner wait-time frustration in restaurants without dedicated POS/buzzers.
    - Pruned enterprise CSV/PDF analytics exports from the roadmap to protect velocity.
  - **Vertical Chameleon Skinning (Salon P0 Beachhead vs. Cafe)**:
    - **Backend Schema & Inheritance:** Added `businessCategory` enum (`'salon'`, `'cafe'`, default `null` on new user signup for onboarding trigger, with runtime fallback defaulting to `'salon'` for P0 beachhead focus) on `User.js` model and `QRCode.metadata`.
    - **Multimodal OCR Branching & Beauty Catalog:** Branched `buildExtractionPrompt` in `MenuAiService.js` to extract beauty-specific properties (`duration`, `brandUsed`, `targetGender`) from salon rate cards, and created `backend/data/serviceImageCatalog.js` to automatically pair hair/skin/nail/bridal services with high-resolution Unsplash CDN imagery.
    - **Centralized Vocabulary Dictionary:** Created `frontend/src/config/vocabulary.js` exporting `VOCABULARY` and `getVocabulary(category)`, driving dynamic terms (`Service Rate Card & Lookbook` vs `Digital Menu`, `Service` vs `Dish`, transformation photos, client tags, and `mirror standees used` vs `table standees used`).
    - **Storefront Noise Elimination:** Completely hid Print Safety Score (UTM check), Team Seats, Folders, Alerts, and Browser/OS charts in Storefront mode. Replaced with clean standee quotas, peak scan hours, and top services.
    - **Onboarding Questionnaire & Switcher:** Built `BusinessCategoryModal.jsx` (1-step questionnaire modal on first login) and responsive vertical switcher card in Settings (`AccountPage.jsx`).
    - **QR Creator Chameleon Skinning:** `TypeSelection.jsx` prioritizes Rate Card/Menu first in storefront mode. `MenuForm.jsx` and `MenuImportModal.jsx` dynamically adapt copy, upload prompts, and inline editor fields for salon services.
    - **Public Rate Card & Lookbook:** Upgraded public template suite (`BasicTemplates.jsx`, `ImmersiveTemplate.jsx`, `LighthouseTemplate.jsx`) with Client Filter tabs (`All`, `For Her`, `For Him`, `Unisex`) with inclusive matching, beauty badges (`⏱️ duration`, `🧴 brandUsed`), and floating WhatsApp appointment booking CTA (`wa.me`) in `MenuViewPage.jsx`.
    - **Salon Review Booster & Private Shield:** Adapted `ReviewFunnel.jsx` to dynamically generate beauty-specific 5-star review drafts (styling, facials, hygiene, precision) and salon complaint tags for private owner WhatsApp resolution.
    - **Verification & Builds:** 100% test pass (68/68 automated tests) and Vite production build passed with 0 errors on branch `product`.
- **Menu Templates & Review Funnel Optimization:**
  - **Single-Screen Viewport Registration & Onboarding (`RegisterPage.jsx` & `index.css`):**
    - Compacted registration layout to fit completely within standard desktop/laptop viewports without irrelevant scrolling:
      1. Tuned `.reg-grid` padding from `44px 28px 96px` down to `18px 28px 24px` and set `align-items: center`.
      2. Scaled display headline (`.reg-h1`) from `clamp(42px, 5.8vw, 76px)` down to a crisp, elegant `clamp(26px, 2.2vw, 34px)`.
      3. Optimized form elements: reduced input height to `40px`, reduced field row/group vertical margins from `24px` to `10px`, reduced Google button height to `40px`, and tightened divider margins to `10px`.
      4. Proportionately scaled live standee & mobile preview stage (`.stage`) from `580px` down to `440px` with matching micro-copy and badge scaling.
      5. Streamlined top navigation (`.reg-nav`) padding to `10px 28px`.
      6. Verified 0 vertical scrollbars (`hasScrollbar: false`, `scrollHeight == viewportHeight`) across both sign-in and registration modes with 100% Vite production build success.
  - **Editorial Brand Design System & Landing Page Overhaul:**
    - Implemented official 60-30-10 palette: Primary (60%) Rich Cream / Alabaster (`#FBF9F6`), Secondary (30%) Deep Espresso Brown (`#2B1E19`), Accent (10%) Warm Honey Yellow (`#E5A93C`).
    - Standardized three-tier typography: Headings in `Instrument Serif`, Body & UI in `Instrument Sans`, Eyebrows & micro-labels in `IBM Plex Mono`.
    - Fully updated `LandingPage.jsx` into the editorial storefront & review engine presentation with the dedicated countertop standee and mirror tag preview, mobile review mockup, and zero-reprint guarantee.
    - Upgraded `RegisterPage.jsx` to the unified editorial 2-phase registration and 3-step first-time storefront onboarding flow with live stage preview synchronization and Google OAuth.
    - Synchronized tokens across `Context/Ui_Context.md`, `design-tokens.json`, `index.html`, and `frontend/src/index.css`.
  - **Storefront Dashboard Reshaping & Chameleon Pulse (`DashboardOverview.jsx`):** Refactored Storefront Dashboard with Impeccable standards and 4 senior product principles:
    1. Rendered 2/3 **"🌟 Active Lookbook & Rate Card Items"** directly from primary MENU QR categories (no fake per-service scan numbers) with live thumbnails, duration, brand, and pricing tags.
    2. Real, honest review metrics (Google reviews and WhatsApp shield defusal counts) with proactive connection/test prompts when 0.
    3. Replaced developer jargon with reassuring `🟢 Print-Safe Guarantee: Active` badge and a 4-step **"Front-Desk Setup Checklist"** with progress tracking.
    4. Smart Countertop Essentials Action Bar linking directly to primary Rate Card QR, with graceful zero-state fallback to `[+ Create Your First Rate Card]`.
    5. Clean mechanical validation: 0 warnings on `impeccable detect` and 100% Vite production build success.
  - **Impeccable System Initialization (`PRODUCT.md`, `.impeccable/config.json`):** Captured durable product truth, Dual Chameleon architecture, anti-hostageware commitments, and confirmed code-first workflow defaults in `PRODUCT.md` per Impeccable schema 1.
  - **Fixed Step 2 QR Creator & Chameleon Scope Crash (`MenuForm.jsx`, `MenuImportModal.jsx`, `ReviewFunnel.jsx`, `MenuViewPage.jsx`):** Resolved uncaught `ReferenceError: businessCategory is not defined` and `ReferenceError: v is not defined` when loading Step 2 of the QR creation wizard. Properly bound Redux `user?.businessCategory` state with fallback to `'cafe'`, wired vertical vocabulary `v = getVocabulary(businessCategory)`, and corrected `dishList` reference to `itemList` in `ReviewFunnel.jsx`. Verified live in browser with Playwright MCP automation.
  - **L'Ambroisie Immersive Layout Overhaul (`ImmersiveTemplate.jsx`):** Removed intrusive dish detail drawer popup, fake sommelier/calories/narrative mockups, and confusing chevron buttons. Upgraded typography with Google Fonts (`Playfair Display`, `Plus Jakarta Sans`), streamlined dish cards with baseline title/price alignment and full-width descriptions, added cross-category search, and expanded bottom clearance (`pb-28 sm:pb-32`).
  - **Mobile-Responsive Review Badge (`ReviewFunnel.jsx` & Templates):** Eliminated broken multi-line text wrapping by adding `whitespace-nowrap` and responsive label scaling (compact `Leave a 10s Review` on narrow screens `<390px` and full label on larger screens). Increased bottom padding across all templates (`ImmersiveTemplate`, `LighthouseTemplate`, `BasicTemplates`) to ensure zero content overlap.
  - **Editorial Authentication & Registration Suite (`LoginPage.jsx`, `RegisterPage.jsx`):**
    - Executed dual-agent Impeccable Critique on `RegisterPage.jsx` (A: `cff2b5e0-dc69-433c-b1e8-638f3abc83ff` · B: `a7aae7bb-4273-4aec-94e0-3502edbd3670`), persisting snapshot to `.impeccable/critique/2026-11-01T18-25-39Z__frontend-src-pages-registerpage-jsx.md`.
    - Completely separated authentication routes: removed the internal `isLoginMode` state toggle from `RegisterPage.jsx`, dedicating `RegisterPage.jsx` purely to storefront creation and the 3-step setup with direct `<Link to="/login">`.
    - Built `LoginPage.jsx` to strictly reuse `RegisterPage.jsx` exact components and classes (`.nav.reg-nav`, `.reg-grid.w`, `.form-card`, `.btn-google`, `.or-divider`, `.field-row`, `.stage.dk`, `.stand`, `.phone`, `.stage-foot`) with zero standalone or unique components.
    - Implemented P0 accessibility hardening: wrapped category and plan choice groups in `role="radiogroup"`, adding `role="radio"`, `aria-checked`, `tabIndex={0}`, and Space/Enter keyboard listeners.
    - Resolved P1 form blocker: conditionally skipped shipping address requirement on "Starter Digital Only" plan.
    - Embedded the mandatory Center Category Brand Icon rule in preview standees and the 100% Anti-Hostageware Guarantee badge.
    - Verified 100% Vite production build success with 0 errors.

## ⏳ In Progress
- Acrylic Standee printable canvas generator (4x6 inch single-sided export with "Open Phone Camera to Scan, Not GPay").

## 🔜 Next Up
1. **Finalize Pricing & Billing Architecture** (evaluate Annual Prepaid bundle vs Monthly UPI AutoPay).
2. Wire Monday Morning WhatsApp Push Digest cron.

## ❓ Open Decisions / Questions
1. **Pricing Decision (Pending User Finalization):** What exact price point and tier structure should we lock in for the India and International tracks? (Under active evaluation).
