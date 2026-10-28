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
  - Specified 2-Sided Standee (Side A: Menu/Reviews, Side B: Merchant UPI QR) & 5cm vinyl sticker-swap kit.
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
  - **Vertical Chameleon Skinning (Salon & Beauty Parlour vs. Cafe & QSR)**:
    - **Backend Schema & Inheritance:** Added `businessCategory` enum (`'salon'`, `'cafe'`, default `null` on new user signup for onboarding trigger, with runtime fallback defaulting to `'cafe'` for backward compatibility) on `User.js` model and `QRCode.metadata`.
    - **Multimodal OCR Branching & Beauty Catalog:** Branched `buildExtractionPrompt` in `MenuAiService.js` to extract beauty-specific properties (`duration`, `brandUsed`, `targetGender`) from salon rate cards, and created `backend/data/serviceImageCatalog.js` to automatically pair hair/skin/nail/bridal services with high-resolution Unsplash CDN imagery.
    - **Centralized Vocabulary Dictionary:** Created `frontend/src/config/vocabulary.js` exporting `VOCABULARY` and `getVocabulary(category)`, driving dynamic terms (`Service Rate Card & Lookbook` vs `Digital Menu`, `Service` vs `Dish`, transformation photos, client tags).
    - **Onboarding Questionnaire & Switcher:** Built `BusinessCategoryModal.jsx` (1-step questionnaire modal on first login) and responsive vertical switcher card in Settings (`AccountPage.jsx`).
    - **QR Creator Chameleon Skinning:** `TypeSelection.jsx`, `MenuForm.jsx`, and `MenuImportModal.jsx` dynamically adapt copy, upload prompts, and inline editor fields for salon services.
    - **Public Rate Card & Lookbook:** Upgraded public template suite (`BasicTemplates.jsx`, `ImmersiveTemplate.jsx`, `LighthouseTemplate.jsx`) with Client Filter tabs (`All`, `For Her`, `For Him`, `Unisex`) with inclusive matching, beauty badges (`⏱️ duration`, `🧴 brandUsed`), and floating WhatsApp appointment booking CTA (`wa.me`) in `MenuViewPage.jsx`.
    - **Salon Review Booster & Private Shield:** Adapted `ReviewFunnel.jsx` to dynamically generate beauty-specific 5-star review drafts (styling, facials, hygiene, precision) and salon complaint tags for private owner WhatsApp resolution.
- **Menu Templates & Review Funnel Optimization:**
  - **L'Ambroisie Immersive Layout Overhaul (`ImmersiveTemplate.jsx`):** Removed intrusive dish detail drawer popup, fake sommelier/calories/narrative mockups, and confusing chevron buttons. Upgraded typography with Google Fonts (`Playfair Display`, `Plus Jakarta Sans`), streamlined dish cards with baseline title/price alignment and full-width descriptions, added cross-category search, and expanded bottom clearance (`pb-28 sm:pb-32`).
  - **Mobile-Responsive Review Badge (`ReviewFunnel.jsx` & Templates):** Eliminated broken multi-line text wrapping by adding `whitespace-nowrap` and responsive label scaling (compact `Leave a 10s Review` on narrow screens `<390px` and full label on larger screens). Increased bottom padding across all templates (`ImmersiveTemplate`, `LighthouseTemplate`, `BasicTemplates`) to ensure zero content overlap.

## ⏳ In Progress
- 2-Sided Acrylic Standee printable canvas generator (4x6 inch export with "Open Phone Camera to Scan, Not GPay").

## 🔜 Next Up
1. **Finalize Pricing & Billing Architecture** (evaluate Annual Prepaid bundle vs Monthly UPI AutoPay).
2. Wire Monday Morning WhatsApp Push Digest cron.

## ❓ Open Decisions / Questions
1. **Pricing Decision (Pending User Finalization):** What exact price point and tier structure should we lock in for the India and International tracks? (Under active evaluation).
