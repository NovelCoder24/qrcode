# Progress Tracker

> **Last Updated:** October 2026

## 🎯 Current Goal
Migrate to an enterprise-grade, high-throughput SaaS platform with provider-agnostic infrastructure, DPDP privacy compliance, and zero-latency analytics.

## ✅ Completed
- Decoupled `app.js`, `index.js`, and `worker.js`.
- Implemented MongoDB-backed Mutex Job Locks (`JobLock.js`).
- Built Audited 3-Tier Geolocation & Placement Engine (`Verified GPS > Physical QR Placement Metadata > Coarse IP` with single-flight dedup, tap-to-consent DPDP interstitial, single-use telemetry tokens, fast-204 responses, and in-app webview skip).
- Replaced raw IPs and raw GPS coordinates with DPDP-compliant SHA-256 session hashing and city/region-only storage.
- Deployed Pre-Aggregated Materialized Views (`DailyScanStats`).
- Added Reverse Geocoding (BigDataCloud in production, Nominatim dev-only).
- Fixed Dashboard infinite remount crash (`PrivateRoute.jsx` & `DashboardOverview.jsx`) and synchronized `Sidebar.jsx` plan & active QR counts.
- Fixed Menu & Hosted QR (`MENU`, `VCARD`, `PDF`, `SOCIAL`, `MEDIA`) blank page bug on target/test links across `DownloadStep.jsx`, `QRCodesList.jsx`, `QRDetailPage.jsx`, `MenuForm.jsx`, `CreateQRPage.jsx`, and `App.jsx`.
- Configured Playwright MCP server (`@playwright/mcp`) in `.agents/mcp_config.json` and `.agents/plugins/playwright/`.
- Fixed GPS consent location still showing `"Unknown"` after accepting permission (`recordGpsTelemetry` Express 3rd-arg `next` collision fix, `renderGpsInterstitial` permission timeout/auto-acquire/keepalive/WAN fallback, `issuedTelemetryTokens` & `recentScans` token deduplication, `ReverseGeocode.js` specific-city-before-state priority & offline coordinate centroid/WAN/timezone fallback, `analyticsController.js` `mergeStatLocations` & `resolveLocationsWithScanFallback` self-healing, `AnalyticsPage.jsx`, and `CreateQRPage.jsx`).
- Upgraded Email & In-Dashboard Link Health Alerting Pipeline (`planConfig.js` all-tier Email Alerts including Free, 2-attempt verified link health checks & 6h bounded-concurrency sweep in `healthMonitor.js`, smart `status: 'sent'` 12h cooldown & recovery notifications in `AlertService.js` while preserving `sendWhatsAppTemplateMessage` for weekly reports, on-demand `POST /api/qrcodes/check-health`, `/api/notifications` CRUD + Topbar Bell dropdown in `DashboardLayout.jsx`, and live DPDP consent history ledger in `PrivacyDataPage.jsx`).
- Built "Scan-to-WhatsApp Cart" inside Digital Menus (`frontend/src/utils/whatsappCart.js`, `DishCartControl.jsx`, `WhatsAppCartBar.jsx`, `MenuForm.jsx`, `qrValidator.js`, and all 4 templates in `MenuViewPage.jsx`: `ModernTemplate`, `PlayfulTemplate`, `ImmersiveTemplate`, and `LighthouseTemplate`, turning read-only QR menus into zero-API-cost `wa.me` ordering systems).
- Built "AI Photo-to-Menu" in Step 2 of QR Creator (`backend/services/MenuAiService.js`, `backend/data/dishImageCatalog.js`, `POST /api/qrcodes/parse-menu-photo`, client-side canvas compression in `imageCompressor.js`, review modal in `MenuImportModal.jsx`, and `MenuForm.jsx` auto-fill banner using single Gemini Flash multimodal OCR with allergy-safe descriptions and 3-tier Unsplash dish image catalog).
- Hardened AI Photo-to-Menu upload and error handling: fixed Axios multipart boundary stripping (`Content-Type: undefined`), wrapped Multer in defensive JSON error handling middleware in `qrRoutes.js`, sanitized React error banners against object crashes in `MenuForm.jsx`, and added clear Gemini API key format validation guidance.

## ⏳ In Progress
- Phase 5: Backfill historical scans into `DailyScanStats`.
- Website Audit Fixes: Wire sales CTAs, Google Auth, publish legal pages.

## 🔜 Next Up
1. Reconcile subscription tiers in `planConfig.js` (`free`, `local`, `starter`, `growth`).
2. Implement Bulk CSV QR Generation.
3. Build PDF/CSV Analytics Exports.

## ❓ Open Questions
1. Should we force the Google OAuth button to hide if credentials are unconfigured in production?
2. When will we officially pivot messaging toward SKU/batch tracking?
