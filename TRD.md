# Technical Requirements Document (TRD) - QR Code Generator Backend

## 1. System Overview
This TRD describes the backend architecture for a SaaS QR Code generation platform. The backend is built using Node.js, Express, and MongoDB (Mongoose), providing RESTful APIs for user authentication, QR code administration, file uploads via Cloudinary, and dynamic scan redirection with analytics logging.

## 2. Tech Stack & Infrastructure
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB via Mongoose (Connection pooled via `config/db.js`)
*   **Authentication:** JWT (JSON Web Tokens) with `bcryptjs` for password hashing
*   **Storage (Media):** Cloudinary via `multer-storage-cloudinary`
*   **ID Generation:** `nanoid` (for short 6-character unique URLs)

## 3. Data Models (Database Schema)

### 3.1 User Schema (`User.js`)
Handles authentication and subscription tiers.
*   `name`, `email` (unique), `password` (hashed)
*   `plan`: Enum (`"free"`, `"basic"`, `"premium"`). Default: `"free"`.
*   *Instance Methods:* `comparePassword()`, `generateToken()`

### 3.2 QRCode Schema (`QRCode.js`)
The core resource representing a dynamic link and its visual configuration.
*   `user_id`: Reference to User (owner)
*   `short_id`: Unique 6-character string (e.g., `x7d9Ak`)
*   `target_url`: The destination link. Has a `pre-save` hook to ensure `http(s)://` prefix.
*   `qr_type`: Enum (`URL`, `PDF`, `vCard`, `Video`, `Image`, etc.)
*   `customization`: Mixed object for visual data (e.g., dots color, frame)
*   `metadata`: Object for `{ title, description, tags }`
*   `isActive`: Boolean
*   `stats`: Embedded object `{ total_scans, last_scanned_at }`
*   *Instance Methods:* `getFullShortUrl()`, `recordScan()`

### 3.3 Scan Schema (`Scan.js`)
An independent logging collection used to generate analytics.
*   `qr_id`: Reference to QRCode
*   `owner_id`: Reference to User (for fast querying of all user scans)
*   `location`: Embedded object `{ country, city, timezone, etc. }`
*   *Indexes:* `createdAt` for time-series analytics.

## 4. API Endpoints

### 4.1 Authentication (`/api/users`)
*   `POST /register`: Accepts `name`, `email`, `password`. Creates user, returns JWT.
*   `POST /login`: Validates credentials, returns JWT.
*   `GET /me`: *(Protected)* Validates JWT, returns fresh user profile data (useful for checking current subscription plan after token issuance).

### 4.2 QR Code Management (`/api/qrcodes`)
*(All routes protected by JWT middleware)*
*   `POST /create`: Accepts `target_url`, `title`, `qr_type`, `customization`. Generates `short_id` and saves to DB.
*   `GET /myqrs`: Returns all QR codes owned by the `req.user`, sorted newest first.
*   `GET /:id`: Retrieves a single QR code (validates ownership).
*   `PUT /:id`: Updates a QR code configuration.
*   `DELETE /:id`: Deletes a QR code.

### 4.3 Redirection Engine (`/r`)
*   `GET /r/:shortId`: 
    1. Looks up the `QRCode` by `short_id`.
    2. Enforces active status (returns 410 if paused).
    3. Increments global `stats.total_scans` directly on the QR document.
    4. Asynchronously writes a new `Scan` log (capturing IP, User-Agent, Referer).
    5. Returns a `302 Temporary Redirect` to the `target_url`.

### 4.4 File Uploads (`/api/upload`)
*   `POST /`: Accepts `multipart/form-data` with key `file`. Pipes stream directly to Cloudinary. Returns the public Cloudinary URL. Limits file size to 10MB.

## 5. Architectural Limitations & Future Upgrades

1.  **Redirection Engine vs. Landing Pages:**
    *   **Limitation:** The current `redirectController.js` simply issues a `res.redirect(302, qr.target_url);`. This is perfect for raw URLs, but invalid for types like `"PDF"`, `"Image"`, or `"Video"`. If the user scanned a PDF QR code, they should be taken to a branded mobile landing page viewing their PDF, not force-downloaded the raw PDF from Cloudinary.
    *   **Upgrade Required:** The redirect controller needs logic: If `qr_type === 'URL'`, then redirect. If `qr_type` is anything else, it should redirect to a Frontend public viewing route (e.g., `/view/:shortId`), allowing the frontend React app to fetch the metadata and render the custom landing page.

2.  **Location Data Placeholder:**
    *   **Limitation:** The `Scan.js` creation logic in the redirect controller currently leaves `location` data empty/null.
    *   **Upgrade Required:** Implement `geoip-lite` or an external IP-to-Location API during the creation of the `Scan` document to populate `country`, `city`, and `timezone` for the analytics dashboard map.

3.  **QR Code Customization Schema:**
    *   **Limitation:** The `customization` field is loosely defined as a generic Object (`{ type: Object }`). If the data structure changes rapidly on the frontend, Mongoose won't validate it.
    *   **Upgrade Required:** Better schema definition (or nested schemas) for the exact payload of styling options (fgColor, bgColor, shapes) to prevent injection of bloated data.
