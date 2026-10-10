# AI Agent Workflow & Operational Protocol: QRVibe

> **Purpose:** Mandates strict discipline, execution boundaries, and safety invariants for AI agents working within the QRVibe codebase.  
> **Target Environment:** Antigravity / Claude / Cursor / Copilot Agents  
> **Last Updated:** October 2026

---

## 1. Agent Rules of Engagement

1. **Architecture Is Locked:** Strict compliance with the *Unbreakable Architectural Laws* outlined in [Architecture_context.md](./Architecture_context.md) is mandatory. Never propose alternative frameworks, unapproved external APIs (e.g. Twilio, Geoapify), or bypass established design patterns.
2. **Read Before Writing:** Always read the target file and its direct callers before making modifications. Do not assume signatures, schemas, or import structures.
3. **No Unsolicited File Sprawl:** Never create random scripts, utility files, or ad-hoc test files in arbitrary directories. All project code must belong to the standard directory hierarchy or designated scratch directories.
4. **Preserve Documentation Integrity:** Never overwrite, wipe, or truncate existing comments, JSDoc headers, or architectural notes unless directly replacing deprecated logic.
5. **Incremental Verifiable Steps:** Break complex refactors into verifiable phases with clear commit boundaries. Test each increment before advancing to the next.

---

## 2. Protected Foundation Components

The following modules represent the critical foundation of the platform. **Modifications to these files require extreme care, explicit verification, and zero regression tolerance:**

| Protected Component | Location | Invariant to Protect |
| :--- | :--- | :--- |
| **Redirect Hot Path** | [redirectController.js](file:///d:/Projects/qr-code/backend/controllers/redirectController.js) | Sub-50ms latency. Zero synchronous I/O. Asynchronous `Promise.allSettled()` execution. Preload deduplication window must never be bypassed. |
| **Distributed Mutex Lock** | [jobLock.js](file:///d:/Projects/qr-code/backend/utils/jobLock.js) & [JobLock.js](file:///d:/Projects/qr-code/backend/models/JobLock.js) | Atomic `create` or `findOneAndUpdate` on expired locks. TTL index (`expireAfterSeconds: 0`) must never be removed. Guarantee lock release in `finally` blocks. |
| **Webhook Buffer Pipeline** | [app.js](file:///d:/Projects/qr-code/backend/app.js) | `express.raw({ type: 'application/json' })` on `/api/webhooks` must **always** be mounted before `express.json()` to preserve HMAC signature verification. |
| **Auth & Cookie Policy** | [userController.js](file:///d:/Projects/qr-code/backend/controllers/userController.js) & [authMiddleware.js](file:///d:/Projects/qr-code/backend/middleware/authMiddleware.js) | Refresh tokens must remain strictly in `httpOnly`, `secure`, `sameSite: 'strict'` cookies. Access tokens must never be written to cookies. |
| **Hybrid Geolocation Engine** | [Geolocation.js](file:///d:/Projects/qr-code/backend/services/Geolocation.js) | Edge headers take precedence. In-process MaxMind `.mmdb` is primary offline source. Background API fallback must be LRU-cached (5,000 entries max) and non-blocking. |
| **Materialized Daily Stats** | [DailyScanStats.js](file:///d:/Projects/qr-code/backend/models/DailyScanStats.js) | Pre-aggregated daily buckets via `{ qr_id: 1, date: -1 }`. Never replace atomic `$inc` with document-level overwrite (`.save()`). |

---

## 3. Work Splitting & Task Boundaries

Complex architectural tasks must follow the standardized 6-phase migration tree:

```
Phase 1: Infrastructure & Entrypoints
    └── Verify app.js / index.js / worker.js separation and Mutex job locks.
Phase 2: Database Schema & Indexes
    └── Implement models, compound indexes, and pre-save middleware.
Phase 3: The Core Redirection Engine
    └── Optimize hot path, hybrid geo extraction, DPDP hashing, and fire-and-forget writes.
Phase 4: Alerts & Webhook Verifiers
    └── Configure Meta WhatsApp Cloud API, SMTP alerting, 12h cooldown, and raw body HMAC verification.
Phase 5: Analytics APIs & Data Backfill
    └── Read from DailyScanStats materialized views and backfill historical data.
Phase 6: DPDP Compliance & UX Privacy
    └── Wire consent ledgers, data export, account erasure, and settings UI.
```

### When to Split Work:
* **Across Process Boundaries:** Do not refactor worker cron jobs and Express API routing in the same single commit or pull request.
* **Across Database Schemas:** Modify database schemas, add compound indexes, and run migrations in distinct, sequential steps before updating dependent controller queries.
* **Frontend vs. Backend:** Implement and test backend endpoints before writing or adapting frontend React components.

---

## 4. Handling Ambiguous Requests & Edge Cases

When receiving ambiguous, underspecified, or high-risk requests, AI agents must adhere to the following protocol:

1. **Verify Codebase First:** Check whether the requested capability already exists or is partially implemented before writing duplicate logic.
2. **Adopt Recommended Defaults:**
   * If a pricing tier limit is unspecified, align with [planConfig.js](file:///d:/Projects/qr-code/backend/config/planConfig.js).
   * If an external API is unavailable during testing, use established mock/offline fallbacks (e.g. `207.97.227.239` test IP for geolocation).
   * If a third-party dependency is suggested that conflicts with the architectural laws (e.g. Geoapify or Twilio), reject it explicitly and use the approved alternative (`geoip-lite` / MaxMind and Meta WhatsApp Cloud API).
3. **Fail Fast on Missing Environment Variables:**
   * If a critical secret is missing (`JWT_SECRET`, `MONGO_URI`, `ANALYTICS_SALT`), do not invent fallbacks that compromise production security. Let [env.js](file:///d:/Projects/qr-code/backend/config/env.js) fail fast at application startup.

---

## 5. Scope Enforcement & Anti-Patterns

### ❌ Prohibited Anti-Patterns:
* **The "Everything in One File" Anti-Pattern:** Placing web server listeners, database connection pools, and cron schedules back into a single `server.js` or `index.js`.
* **The "Real-Time Aggregation" Anti-Pattern:** Writing MongoDB aggregation pipelines (`Scan.aggregate([...])`) inside the dashboard overview route instead of querying `DailyScanStats`.
* **The "Third-Party Geo API in the Hot Path" Anti-Pattern:** Awaiting an external HTTP fetch to resolve geolocation before returning the HTTP 302 redirect.
* **The "Rotating Salt" Anti-Pattern:** Hashing session contexts using a daily rotating timestamp or salt, which destroys 30-day cohort retention analysis.
* **The "Destructive Downgrade" Anti-Pattern:** Deleting excess user QR codes or setting `isActive = false` upon trial expiration instead of soft-locking via `accessMode = 'static_locked'`.

### ✅ Required Behavioral Patterns:
* Maintain idempotency in all database updates.
* Use atomic operators (`$set`, `$inc`, `$push`, `findOneAndUpdate`) to prevent concurrency race conditions.
* Run tests locally with `node --test` to verify code changes before marking tasks complete.
