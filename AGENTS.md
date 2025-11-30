## 🧠 Overview

Steering for this project lives in `.kiro/steering/*`. Follow those files first.

**Stack:** Next.js 16 (App Router) with Cache Components, Server Actions (no API routes), Prisma targeting MongoDB, Zod validation, React 19.

**Primary rules:**
- Use Server Actions for all mutations; validate with Zod; delegate business logic to services; revalidate cache after writes.
- Use Prisma (MongoDB provider) for all data access via `lib/db/prisma.ts`.
- Queries go in `lib/queries`; services in `lib/services`; validation in `lib/validations`; actions in `lib/actions`.
- Server Components by default; Client Components only when needed; wrap dynamic content in Suspense; use cache directives thoughtfully.
- Propagate structured errors to the UI; use expandable, copyable toasts.
- Keep imports one-way: `app/* → lib/actions|queries → lib/services → prisma`.

## 📚 Steering Files

- `.kiro/steering/agents-architecture.md` — architecture, layering, server actions, Prisma/Mongo, naming, feature checklist.
- `.kiro/steering/agents-frontend.md` — Cache Components, Suspense patterns, form/server-action usage, UI design guidelines.
- `.kiro/steering/agents-error-handling.md` — AppError shape, server-action error returns, expandable/copyable toasts.
- `.kiro/steering/agents-testing.md` — unit/integration testing patterns with Prisma (Mongo) and server actions.
- `.kiro/steering/agents-progress.md` — progress tracker (update as milestones land).

## ✅ Quick Rules

* No API routes; no controllers layer. Mutations = Server Actions; reads = queries.
* All validation with Zod; business logic only in services; DB only via Prisma.
* Never import from `app/*` inside `lib/*`; avoid circular deps.
* Use cache tags/revalidation after mutations; cache where safe.
* Show detailed error toasts; ensure messages from backend surface and are copyable.
