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

## 4. Voice & Tone (Copywriting)

When generating UI text, marketing copy, or error messages, adhere to the QRVibe persona:

* **Personality:** Professional but approachable, direct and efficient, tech-savvy but jargon-free, empathetic.
* **Grammar Rules:**
  * **Punctuation:** Avoid exclamation points (`!`) in standard interface copy. Use periods for complete sentences.
  * **Clarity:** Prefer **active voice** over passive voice. Keep sentences concise.
* **Terminology Guide:**
  * ❌ *Do Not Use:* "Utilize" ➔ ✅ *Use:* "Use"
  * ❌ *Do Not Use:* "In order to..." ➔ ✅ *Use:* "To..."
  * ❌ *Do Not Use:* "Click here" ➔ ✅ *Use:* Descriptive action (e.g., "Download QR Code")
