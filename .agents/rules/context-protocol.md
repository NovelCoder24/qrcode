# Context Folder Protocol

The `Context/` directory at the project root is the project's single source of truth. The agent must always consider the `Context/` folder on every turn:

1. `Context/progress tracker.md`: Check current goal, completed items, active in-progress tasks, and next priorities. Keep it updated.
2. `Context/ai_workflow.md`: Strictly follow the AI Agent rules of engagement, 6 protected foundation components, and prohibited anti-patterns.
3. `Context/Architecture_context.md`: Adhere to decoupled architecture (`index.js`, `app.js`, `worker.js`), database models, and redirect hot path requirements.
4. `Context/Code_standard.md`: Adhere to backend and frontend coding standards, defensive programming, and centralized config via `backend/config/env.js`.
5. `Context/Ui_Context.md`: Adhere to shadcn/ui + Tailwind CSS + Lucide React, design tokens, and copywriting voice & tone.
6. `Context/Project_overview.md`: Refer to the overarching product goals and domains.
