# Overview
- Purpose: project-wide rules for clean separation, feature-based organization, and reusable business logic across web UI and external clients.
- Stack: Next.js App Router, Zod for schemas, MongoDB (no Prisma), HTTP endpoints under `app/api/.../route.ts`.
- Folder shape (trimmed):
  ```
  app/api/<feature>/route.ts
  components/
  lib/<feature>/{*.service.ts,*.schema.ts,*.controller.ts,model/*.model.ts,index.ts}
  lib/db/...
  lib/errors/app-error.ts
  ```
- Tasks should open only the needed guides:
  - Backend/API work: `agents/backend.md`
  - Frontend/UI/state: `agents/frontend.md`
  - Testing/QA: `agents/testing.md`
- Default posture: keep responsibilities isolated, favor server components, and follow the per-domain guides for details.
