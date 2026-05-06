# QRVibe Website Audit Report

Audited URL: https://qrcode-jade-chi.vercel.app/  
Audit date: 2026-05-05  
Public routes found: `/`, `/login`, `/register`  
Artifacts: `audit-output/site-audit.json`, `audit-output/interaction-check.json`, `audit-output/lighthouse-home.json`, `audit-output/screenshots/`

Note: the requested in-app Browser plugin failed to start because its app-server path was unavailable in this environment, so I completed the test with Chromium/Playwright plus Lighthouse.

## Executive Summary

QRVibe already has a strong landing-page foundation: the core pain is easy to understand, the India-specific positioning is memorable, the ROI calculator is a smart conversion device, and the pricing section is clear. The site looks polished and responsive overall.

The biggest current risk is that several trust and conversion paths are not production-ready. `Chat with Sales`, `Contact Sales`, Google auth, multiple footer/resource/legal links, and the QR demo either do nothing or point to `#`. For a B2B product selling analytics and compliance, those gaps hurt credibility more than visual polish helps it.

The second major opportunity is positioning. The page currently reads more like "dynamic QR for offline marketing" than "physical product tracking with strong analytics." If physical-product tracking is the business, the page should show product/SKU/batch-level analytics, anti-counterfeit or warranty flows, bulk QR management, exports, API/webhooks, and real dashboard proof.

## Scores And Signals

| Area | Result |
| --- | --- |
| Home page status | 200 |
| Login/register status | 200 |
| Mobile Lighthouse | Performance 70, Accessibility 79, Best Practices 96, SEO 83 |
| Desktop Lighthouse | Performance 68, Accessibility 76, Best Practices 96, SEO 83 |
| Mobile FCP/LCP | FCP 3.8s, LCP 3.9s |
| Desktop FCP/LCP | FCP 1.6s, LCP 2.5s |
| Console/network issues | `noise.svg` 404, unauthenticated `/api/users/me` 401 logged on public pages |
| Accessibility scan | 6 violations on home, 3 each on login/register |
| SEO issues | Missing meta description, invalid `robots.txt`, missing real `sitemap.xml`, Vite favicon still used |

## What To Keep

| Keep | Why it works |
| --- | --- |
| "Your printed QR should never go dead." | Clear, emotionally direct pain statement. A buyer understands the value quickly. |
| India-first proof points | UPI, Razorpay, Mumbai hosting, Hindi/English support, GST language, and rupee pricing make the product feel locally relevant. |
| ROI calculator | Very good conversion mechanic for B2B buyers. It turns a technical feature into money saved. |
| Pricing clarity | Free, Pro, Enterprise are easy to compare, and annual/monthly toggle works. |
| Industry examples | Restaurants, real estate, FMCG, and manufacturing help buyers map the product to their world. |
| Founder section | Humanizes the product and builds trust, especially for SMB buyers. |
| Mobile responsiveness | The page stacks cleanly overall and does not collapse badly on a narrow viewport. |

## Need To Implement First

| Priority | Item | Evidence | Recommendation |
| --- | --- | --- | --- |
| P0 | Wire sales CTAs | `Chat with Sales` and `Contact Sales` clicked but did not open WhatsApp, email, calendar, modal, or route. | Connect them to WhatsApp, Calendly, email, or a short lead form. Track clicks. |
| P0 | Fix Google auth or remove it | `Continue with Google` on login/register did not navigate, open a popup, or call an OAuth endpoint. | Implement OAuth fully or hide the button until ready. |
| P0 | Replace placeholder legal/resource links | Footer links for Analytics Flow, Pricing Plans, Help Center, Case Studies, Blog, Privacy Policy, Terms, Cookie Policy currently point to `#`. Register page Terms/Privacy also point to `#`. | Publish real pages before making security/compliance claims. |
| P0 | Make the QR demo visibly work | Mobile demo button was clickable but the section text/state did not change. Desktop had no obvious interactive demo button. | Simulate a scan, show redirect success, increment analytics, and display the recorded event. |
| P0 | Add real SEO basics | No meta description. `/robots.txt` and `/sitemap.xml` return the app HTML, which Lighthouse flags as invalid. Favicon is still `/vite.svg`. | Add meta description, OG/Twitter tags, canonical tags, `robots.txt`, `sitemap.xml`, and QRVibe favicon. |
| P1 | Fix accessibility blockers | Unlabeled form controls, icon-only links/buttons without names, low contrast, missing main landmark, heading-order issues. | Add labels/aria-labels, wrap content in semantic landmarks, improve contrast, and normalize heading levels. |
| P1 | Stop expected auth checks from logging as errors | Public pages call `https://qrcode-5ptl.onrender.com/api/users/me` and log 401s. | Treat unauthenticated user checks as expected state, or only call after auth context is needed. |
| P1 | Replace missing external asset | `https://grainy-gradients.vercel.app/noise.svg` returns 404. | Self-host the asset or remove the reference. |

## Improve

| Area | Current state | Better direction |
| --- | --- | --- |
| Product positioning | Page says dynamic QR/offline marketing more strongly than physical product tracking. | Make the hero or first feature section say what gets tracked: product, SKU, batch, location, scan event, customer action. |
| Analytics proof | Analytics section is visually nice but static. | Add a real dashboard preview with filters for product, batch, location, device, time, campaign, and conversion. |
| Trust proof | "6,000+ Indian SMBs" is strong but unsupported on the page. | Add customer logos, anonymized case studies, scan volume stats, testimonials, or "sample data" labeling. |
| Compliance claims | DPDP compliance, Razorpay security, backups, Mumbai hosting are listed but legal pages are placeholders. | Add security/privacy pages, data retention, DPA/contact path, backup policy, and compliance explanation. |
| Mobile pricing comparison | Comparison table is very compressed on mobile. | Use horizontally scrollable table, accordion rows, or plan cards instead. |
| Header on mobile | Login text wraps/cramps and CTAs are tiny. | Use icon/menu or tighten header spacing. Prioritize one primary CTA. |
| Auth pages | Login/register have no H1, inputs lack `name`, some labels are visual but not associated, password eye has no accessible name. | Use semantic `h1`, real `<label for>`, input names, `aria-label="Show password"`, and clearer error/loading states. |
| Performance | Main JS asset is large; Lighthouse reports 257 KiB unused JS. Google Identity script appears in page weight even before auth is needed. | Code-split, lazy-load auth SDK only on auth routes, remove unused libraries, set immutable cache headers for fingerprinted assets. |

## Good To Have

| Idea | Why it would help |
| --- | --- |
| Public interactive sandbox | Let buyers create one sample QR and scan it without signing up. |
| Product tracking use-case pages | Pages for FMCG, manufacturing, pharma, electronics, retail packaging, warranty cards, restaurant tabletop QR, and real estate flyers. |
| API/webhook docs preview | B2B teams care about integrations before signup. |
| CSV bulk QR creation demo | Important for physical-product teams with many SKUs/batches. |
| Analytics export examples | CSV/PDF exports, scheduled reports, and shareable dashboards help justify B2B adoption. |
| Role-based team model | Owner, marketer, analyst, operations, support, developer. |
| Custom domain / short domain | Branded scan URLs increase trust and reduce QR phishing concerns. |
| Scan-quality controls | Bot filtering, duplicate-scan handling, scan throttling, and suspicious-location detection. |
| Real status/security pages | Builds confidence for enterprise customers. |
| Case-study library | Show before/after reprint savings, scan lift, and operational wins. |

## Product Features To Add For Physical Product Tracking

| Must-have capability | Notes |
| --- | --- |
| Product/SKU/batch mapping | Each QR should map to a product, SKU, batch, campaign, destination, and owner. |
| Dynamic destination versioning | Show destination history, who changed it, and rollback. |
| Bulk generation | CSV import, template assignment, batch QR export, SVG/PDF/PNG download. |
| Scan event analytics | Time, city/region, device, product, batch, campaign, landing URL, repeat scans, unique scans. |
| Conversion tracking | Warranty registrations, reorder clicks, support requests, app downloads, lead submissions. |
| Anti-counterfeit checks | Optional unique QR per item, scan-count anomaly alerts, first-scan verification, suspicious duplicate scans. |
| Warranty/registration flow | Scan QR -> register product -> capture consent -> link product to customer. |
| Alerts | Notify on scan spikes, scans from unexpected geographies, broken destinations, or inactive campaigns. |
| Integrations | Razorpay, WhatsApp, CRM, Shopify/WooCommerce, Zoho, Google Sheets, webhooks, API. |
| Governance | Team roles, audit logs, export permissions, data retention, DPDP consent, SSO for enterprise. |

## Page Notes

### Home

Strongest parts: hero message, ROI calculator, India-specific trust badges, pricing clarity, founder note.

Issues:
- Several footer/resource/legal links are placeholders.
- Social icon links have no accessible names and go to `#`.
- QR demo CTA does not create a visible demo state.
- Sales buttons are not wired.
- External `noise.svg` asset returns 404.
- Unauthenticated `/api/users/me` request logs 401 on public load.
- Missing metadata and invalid robots/sitemap.

### Login

Works:
- Required-field browser validation exists.
- Invalid fake login returns "Invalid email or password."

Issues:
- Google sign-in button does nothing in testing.
- No H1.
- Password visibility button has no accessible name.
- Inputs do not expose `name` attributes.
- Labels are not programmatically associated.
- `Forgot?` points to `#`.

### Register

Works:
- Required fields and terms checkbox exist.
- Page links back to login and home.

Issues:
- Google sign-up button does nothing.
- Terms and Privacy Policy links point to `#`.
- No H1.
- Password visibility button has no accessible name.
- Inputs do not expose `name` attributes.

## Suggested Implementation Order

1. Fix production credibility gaps: sales CTAs, Google auth, legal pages, footer links, QR demo behavior.
2. Add SEO basics: meta description, OG/Twitter tags, favicon, robots.txt, sitemap.xml, route-specific titles.
3. Fix accessibility: labels, button/link names, contrast, headings, landmarks.
4. Align positioning with physical product tracking and analytics, not only dynamic marketing links.
5. Add a real or realistic dashboard/demo flow with product, SKU, batch, and scan analytics.
6. Improve performance with route-level code splitting and lazy-loaded auth scripts.
7. Add proof: case studies, customer logos, sample reports, security/privacy pages.

## Metrics To Track After Fixes

- Visitor -> register conversion rate
- CTA click rate by placement
- Pricing monthly/annual toggle usage
- FAQ expansion rate
- Demo QR scan/click completion rate
- Signup completion rate
- First QR created
- First QR scanned
- Active QR codes per account
- Scans per product/SKU/batch
- Export/API/webhook usage
- Free -> paid conversion

## Bottom Line

Keep the current visual polish, India-first positioning, ROI calculator, and pricing clarity. The immediate work is not another redesign; it is wiring the product promises into real, trustworthy flows. Once the dead CTAs, placeholder links, SEO basics, accessibility, and demo behavior are fixed, the next biggest lift is to show product-level analytics deeply enough that a B2B buyer believes QRVibe can track real physical products at scale.
