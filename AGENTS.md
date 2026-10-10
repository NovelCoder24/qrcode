# QRVibe Agent Instructions & Context Protocol

> **CRITICAL DIRECTIVE:** The `Context/` directory at the project root is the **Single Source of Truth** for all architectural laws, coding standards, design tokens, operational workflows, and project progress. You MUST always inspect and adhere to the relevant documents in `Context/` before planning, writing, or refactoring code.

---

## 📁 The `Context/` Knowledge Base

Before taking action on any user request, always consult the corresponding file in `Context/`:

| Document | Purpose & Invariants | When to Consult |
| :--- | :--- | :--- |
| **`Context/progress tracker.md`** | Real-time progress tracker, current goals, completed tasks, in-progress tasks, and upcoming priorities. | **Every turn / task start & completion:** Consult before planning work, and update when completing milestones. |
| **`Context/ai_workflow.md`** | Rules of engagement, protected foundation components (hot path, mutex lock, webhook buffer, auth cookies, geo engine, materialized stats), and forbidden anti-patterns. | **Before making code changes:** Must be consulted to avoid breaking core invariants or introducing anti-patterns. |
| **`Context/Architecture_context.md`** | System topology, decoupled processes (`index.js`, `app.js`, `worker.js`), database schemas, compound indexes, and external service contracts. | **When touching backend logic, database models, cron workers, or service integrations.** |
| **`Context/Code_standard.md`** | Engineering philosophy, defensive programming, single source of config (`env.js`), error handling, controller/service boundaries, and REST APIs. | **When creating or refactoring backend/frontend code.** |
| **`Context/Ui_Context.md`** | Frontend tech stack (React, Tailwind CSS, shadcn/ui, Lucide), design tokens, spacing, component patterns, copywriting tone & voice. | **When designing, styling, or editing UI components or copy.** |
| **`Context/Project_overview.md`** | Product vision, core feature sets, user personas, and target domain context. | **When scoping new features or understanding business requirements.** |

---

## 🛡️ Mandatory Rules of Engagement

1. **Always Check `Context/` First:** Do not assume requirements, schemas, or design patterns. Check the corresponding file in `Context/`.
2. **Never Break Protected Invariants:** Respect the protected foundation components in `Context/ai_workflow.md` (e.g. sub-50ms redirect hot path in `redirectController.js`, atomic Mutex locks in `JobLock.js`, raw webhook bodies before `express.json()`, `httpOnly` refresh token cookies, atomic `$inc` on `DailyScanStats`).
3. **No Hallucinated Config or Dependencies:** Only use environment variables defined in `backend/config/env.js`. Never call raw `process.env`. Check `package.json` before importing packages.
4. **Keep Progress Tracker Synchronized:** When a milestone, feature, or bug fix is finished or pivoted, proactively reflect that progress in `Context/progress tracker.md`.
