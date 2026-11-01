# UI & Design System Context: QRVibe

> **Brand Name:** QRVibe  
> **Last Updated:** October 2026

This document serves as the single source of truth for QRVibe's visual design, tech stack choices, and brand voice, strictly adhering to our global brand identity skills.

---

## 1. Preferred Tech Stack & Core Implementation Rules

When generating code or UI components for QRVibe, the following choices are mandatory:

* **Core Framework:** React (TypeScript preferred)
* **Styling Engine:** Tailwind CSS (Do not use plain CSS or styled-components).
* **Component Library:** **shadcn/ui** (Use these primitives as the base for all new components).
* **Icons:** Lucide React

### 1.1 Forbidden Patterns
* **DO NOT** use jQuery.
* **DO NOT** use Bootstrap classes.
* **DO NOT** create new CSS files; keep styles located within component files via Tailwind.

---

## 2. Design Tokens

Use these semantic token names in your Tailwind classes (e.g., `bg-primary`, `text-primary-foreground`). Never hardcode hex values in the JSX.

### 2.1 Colors (The 60-30-10 Brand Identity Rule)
* **Primary (60% — Canvas & Space):** Rich Cream / Alabaster (`#FBF9F6`) — Keeps the platform UI looking clean, spacious, and editorial (Tailwind: `bg-background`, `bg-primary-canvas`, card backgrounds).
* **Secondary (30% — Structure & Typography):** Deep Espresso Brown (`#2B1E19`) — Used for premium typography, structural borders/cards, headers, dark mode surfaces, and high-end grounding (Tailwind: `text-foreground`, `border-espresso`, `bg-espresso`).
* **Accent (10% — Focus & CTAs):** Warm Honey Yellow (`#E5A93C`) — Used for active star ratings, review booster buttons, badges, critical CTAs, and interactive highlights (Tailwind: `bg-accent`, `text-accent-foreground: #2B1E19`).
* **Muted:** `#F2EFE9` (Warm neutral wash for dividers, hover states, muted inputs)
* **Destructive:** `#EF4444` (Tailwind: `bg-destructive`)
* **Success:** `#10B981` (Tailwind: `bg-success`)

### 2.2 Typography
* **Headings Font:** `Inter`, sans-serif (Title Case for H1/H2, Sentence case for H3+)
* **Body Font:** `Roboto`, sans-serif
* **Weights:** Normal (`400`), Bold (`700`)

### 2.3 UI & Spacing
* **Border Radius:** Default (`0.5rem`), Small (`0.25rem`)
* **Spacing Base:** `4px` (Tailwind standard scale)

---

## 3. Component Implementation Patterns

### 3.1 Buttons & Actions
* **Primary Actions:** Must use the solid `Primary` color (e.g., "Create QR Code").
* **Secondary Actions:** Must use the `Ghost` or `Outline` variants from shadcn/ui.
* **Dark Mode:** All components must support dark mode using Tailwind's `dark:` variant modifier.

### 3.2 Forms & Inputs
* **Labels:** Must always be placed *above* input fields.
* **Layout:** Use standard Tailwind spacing (e.g., `gap-4`) between form items. 
* **Structure:** Use Flexbox and CSS Grid exclusively for all layout structures.

### 3.3 Dashboard Layout
* QRVibe uses a unified `DashboardLayout.jsx` with a fixed sidebar and top navigation. 
* Avoid dual-sidebar designs; keep the main workspace centered and responsive.

---

## 4. Brand Persona, Voice & In-Store Micro-Copy

### 4.1 Brand Identity: "Warm Professional"
QRVibe operates in the sweet spot between cold corporate enterprise tools (Scanova/Uniqode) and chaotic meme energy (Linktree/Bento):
* **Visual Tone:** Rich Cream / Alabaster canvas (`#FBF9F6`), Deep Espresso Brown typography & structure (`#2B1E19`), and Warm Honey Yellow accents (`#E5A93C`). Clean, editorial, high-contrast, and grounded in hospitality & retail excellence.
* **Core Personality:** Direct, respectful, business-empowering, and grounded in "Zero-Mehnat" (zero-effort).
* **The "Invisible AI" Rule:** Never ask merchants to write prompts or debug layout blocks. Use AI solely for seamless automated inputs (upload photo of paper menu -> live digital catalog in 60s).

### 4.2 Copywriting Principles
* **Active, Outcome-Driven Headlines:**
  * ❌ *Avoid:* "Next-gen dynamic QR redirect management infrastructure."
  * ❌ *Avoid:* "Make ur menu aesthetic bestie ✨"
  * ✅ *Use:* "Turn your tables and counters into 5-star Google reviews and instant inquiries. Zero typing required."
* **Punctuation & Grammar:** Avoid excessive exclamation points (`!`) in standard interface copy. Use periods for complete sentences. Prefer **active voice** over passive voice.

### 4.3 In-Store QR Standee Micro-Copy (Preventing UPI Muscle-Memory Confusion)
When generating templates for physical standees and exported table cards:
* **The Camera Instruction:** Always include the 5-word micro-copy below or around the QR code:
  * 👉 **`📷 Open Phone Camera to Scan (Not GPay)`**  
  * Hindi: **`फ़ोन कैमरा से स्कैन करें`**
* **The Center Icon Rule:** Never export naked barcodes for storefronts. Always position a clear category icon in the dead-center (Fork & Spoon for dining; Scissors for salons; Stethoscope for clinics; or the merchant's uploaded logo) to instantly break the UPI payment visual reflex.
* **The Anti-Hostageware Trust Badge:**
  * Emphasize the platform pledge across onboarding and footer links:
  * *"100% Anti-Hostageware Guarantee: Your printed QR codes never break."*
