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

### 2.1 Colors
* **Primary (Brand Vibe):** `#5B3FF4` (Tailwind: `bg-primary`, `text-primary-foreground: #FFFFFF`)
* **Secondary:** `#F4F4F5` (Tailwind: `bg-secondary`, `text-secondary-foreground: #18181B`)
* **Background:** `#FFFFFF` (Tailwind: `bg-background`)
* **Foreground:** `#09090B` (Tailwind: `text-foreground`)
* **Muted:** `#F4F4F5` (Tailwind: `bg-muted`)
* **Accent:** `#F4F4F5` (Tailwind: `bg-accent`)
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
* **Visual Tone:** Warm charcoal (`#1C1C1E`), off-white canvas (`#FAFAF9`), and warm amber/coral accents (`#F59E0B` / `#FF6B4A`). Clean, high-contrast, and trustworthy.
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
