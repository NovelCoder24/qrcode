# Code Standards & Engineering Guidelines: QRVibe

> **Audience:** Human Engineers & AI Coding Assistants  
> **Guiding Principle:** Deterministic, High-Performance, Production-Grade Software Engineering  
> **Last Updated:** October 2026

---

## 1. Core Engineering Philosophy

1. **Defensive & Deterministic Code:** Never assume external inputs, network calls, or third-party APIs will succeed. Every boundary must be guarded with explicit validation and graceful fallbacks.
2. **Zero Hallucinated Dependencies:** Before writing an `import` statement, verify the package exists in `package.json`. If a new package is required, document the architectural rationale before installation.
3. **Preserve Existing Signatures:** When refactoring existing controllers or utilities, do not arbitrarily rename models, fields, or exported functions without verifying all references across the codebase.
4. **Single Source of Truth for Environment Configuration:** Never call `process.env.VARIABLE` directly inside business logic or controllers. Always import from [backend/config/env.js](file:///d:/Projects/qr-code/backend/config/env.js).

---

## 2. Backend Engineering Standards (Node.js & Express)

### 2.1 File & Directory Organization
```
backend/
├── config/         # Environment, DB, and service configs (env.js, db.js, etc.)
├── controllers/    # HTTP request handling, status codes, response formatting
├── data/           # Static data assets (GeoLite2-City.mmdb)
├── jobs/           # Scheduled background tasks and sweeps
├── middleware/     # Auth verification, rate limiters, validation guards
├── models/         # Mongoose schemas and compound index definitions
├── routes/         # Express router endpoints
├── services/       # Reusable domain business logic (AlertService, Geolocation)
├── utils/          # Pure helper utilities (jobLock, formatting)
└── validators/     # Request schema validators (Yup/Joi)
```

### 2.2 Controller & Service Separation
* **Controllers** are responsible for:
  * Extracting parameters (`req.params`, `req.query`, `req.body`).
  * Running request schema validations.
  * Delegating business logic to domain models or services.
  * Returning uniform JSON payloads and HTTP status codes.
* **Services** are responsible for:
  * External integrations (Cloudinary, Meta WhatsApp Cloud API, SMTP).
  * Reusable logic shared across multiple routes or background jobs.
  * In-process caching and fallback management.

### 2.3 Error Handling & Status Code Rules
* Every asynchronous controller function must be wrapped in `try/catch`.
* Never send internal database errors or raw stack traces in client responses in production:
  ```javascript
  // CORRECT
  } catch (error) {
      console.error("[UserController] Registration failed:", error);
      res.status(500).json({ 
          message: process.env.NODE_ENV === 'production' 
              ? "An internal server error occurred" 
              : error.message 
      });
  }
  ```
* Standard HTTP Status Codes:
  * `200 OK`: Successful read/update.
  * `201 Created`: Successful resource creation.
  * `400 Bad Request`: Validation failure or missing input.
  * `401 Unauthorized`: Missing or invalid JWT credentials.
  * `403 Forbidden`: Authenticated user lacks permission or subscription limit exceeded.
  * `404 Not Found`: Resource does not exist.
  * `410 Gone`: Resource permanently deleted or QR code disabled.
  * `500 Internal Server Error`: Unhandled server exception.

### 2.4 Mongoose Model & Schema Standards
* **Field Naming Convention:**
  * Preserve legacy snake_case fields on core models: `short_id`, `target_url`, `qr_type`, `user_id`, `total_scans`.
  * Use camelCase for modern nested structures: `accessMode`, `health_status`, `sessionContext`, `whatsappOptIn`.
* **Explicit Compound Indexes:** Always define compound indexes explicitly at the schema level. Never rely on automatic Mongoose index builds in production.
* **Lean Queries for Read Paths:** When fetching large sets of data for exports or reads that do not require Mongoose document methods, always use `.lean()`:
  ```javascript
  const userQRs = await QRCode.find({ user_id: userId }).lean();
  ```

---

## 3. Redirection Hot Path Standards (`redirectController.js`)

The `/r/:shortId` endpoint is the highest-volume route in the application and must maintain sub-50ms latency:

1. **Zero Blocking Synchronous Operations:**
   * Never execute synchronous file reads, blocking crypto computations, or third-party HTTP requests prior to issuing the `res.redirect(302, destination)`.
2. **Pre-Load Deduplication:**
   * Keep speculative browser preloads from registering invalid scans using the 5-second in-memory cache:
   ```javascript
   if (isDuplicateScan(ip, shortId)) {
       return res.redirect(302, finalUrl); // Redirect immediately, skip analytics write
   }
   ```
3. **Fire-and-Forget Async Chain:**
   * Database logging and materialized view upserts must run asynchronously via `Promise.allSettled()` without blocking the client response:
   ```javascript
   Promise.allSettled([
       qr.recordScan(),
       processAnalytics()
   ]);
   return res.redirect(302, finalUrl);
   ```

---

## 4. Frontend Engineering Standards (React 18 & Vite)

### 4.1 Component Architecture
* **Functional Components Only:** Use React functional components with standard hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
* **Route Code-Splitting:** All non-critical pages must be loaded lazily via `React.lazy()` and wrapped in `<React.Suspense fallback={<Loader />}>`.
* **Iconography:** Use `lucide-react` exclusively. Never mix multiple icon libraries.

### 4.2 Styling with Tailwind CSS
* **Color Palette Consistency:** Use semantic classes mapped to brand tokens:
  * Primary brand gradient: `from-blue-600 via-indigo-600 to-purple-600` (`#3B82F6` → `#5B3FF4` → `#8B5CF6`).
  * Surface backgrounds: `bg-[#F8F8F8]` or `bg-slate-50`.
  * Accent highlights: `text-emerald-500` / `bg-emerald-500` (`#00D49F`).
* **Responsive Breakpoints:** Mobile-first utility classes (`sm:`, `md:`, `lg:`, `xl:`). All dashboard views must collapse gracefully onto a mobile viewport.

### 4.3 State Management & Network Calls
* **Global Auth & Subscription:** Managed via Redux Toolkit (`authSlice.js`).
* **Client-Side QR Canvas:** Handled via direct ref instantiation of `qr-code-styling` in [StyledQRCode.jsx](file:///d:/Projects/qr-code/frontend/src/components/StyledQRCode.jsx). Keep heavy SVG/Canvas rendering out of global Redux state.

---

## 5. Security & DPDP Compliance Standards

### 5.1 Authentication & Cookie Policy
* **Access Tokens:** Short-lived (15 minutes), passed in the HTTP Authorization header (`Bearer <token>`).
* **Refresh Tokens:** Long-lived (7 days), stored strictly in `httpOnly`, `secure` (in production), `sameSite: 'strict'` cookies.
* **Token Invalidation:** On logout, cookies must be cleared with exact matching domain and path parameters:
  ```javascript
  res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/"
  });
  ```

### 5.2 DPDP Privacy Protections
* **Never Log Raw IP Addresses:** Always pass client IPs through the SHA-256 session hash utility before persistence.
* **Consent Auditing:** Any change to privacy or communication preferences (WhatsApp opt-in) must append a new immutable entry to `ConsentRecord` containing the hashed IP and user agent.
* **Right to be Forgotten:** Account deletion requests via `DELETE /api/users/erasure` must purge all associated records across `Scan`, `DailyScanStats`, `AlertEvent`, `QRCode`, and `ConsentRecord` concurrently.

---

## 6. Testing & Quality Assurance

* **Unit & Integration Tests:** Use the Node native test runner (`node --test`).
* **Test Isolation:** Tests must not depend on live internet connectivity. Geolocation, payments, and external APIs must use mock headers or local fallbacks.
* **Local Development Overrides:** When debugging geolocation locally, pass explicit headers (`x-test-ip`) or test query params (`?ip=207.97.227.239`) rather than overriding production configuration files.
