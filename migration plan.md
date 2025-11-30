# Migration Plan: Server Actions + Prisma (Mongo)

Plan to align the codebase with the new steering (Server Actions, Prisma targeting MongoDB, Zod, Cache Components, structured errors). Current state: API routes + controllers/services using `mongo-client`, duplicated error classes, no Prisma schema yet.

---

## Phase 0 – Prep
- Set env: add `DATABASE_URL` for MongoDB (dev/test). Plan test DB URI.
- Add deps: `prisma`, `@prisma/client` (and tooling like `ts-node` if needed). Prepare to remove direct `mongodb` dependency after migration.
- Initialize `prisma/schema.prisma` with MongoDB provider; model existing collections (products, categories, variant types, images/variants) to preserve shape.

## Phase 1 – Data Layer & Errors
- Add `lib/db/prisma.ts` singleton (per steering).
- Consolidate to one `AppError` (remove `lib/error/appError.ts` duplication); shape per steering (`status`, `code`, `message`, `details`, `timestamp`).
- Map current Mongo collections to Prisma models; plan data migration scripts if existing data must be preserved.

## Phase 2 – Services & Validation
- Move business logic to `lib/services/*` using Prisma; replace `mongo-client` calls.
- Move/align Zod schemas to `lib/validations/*` (rename from feature `*.schema.ts`).
- Define DTOs for form payloads vs stored models (products/images/variants).

## Phase 3 – Queries (Reads)
- Add `lib/queries/*` for reads (e.g., `getAllProducts`, `getProductById`, `getCategories`, `getVariantTypes`), using `cache()`/`'use cache'` and cache tags where appropriate.
- Shape select/output to avoid over-fetching; provide view models for UI.

## Phase 4 – Server Actions (Writes)
- Replace API routes with Server Actions under `lib/actions/*` (`product.actions.ts`, `category.actions.ts`, `variant-type.actions.ts`).
- In actions: `'use server'`, validate with Zod, call services, return `{ success, data?, error? }`, revalidate tags/paths (`revalidateTag('products')`, etc.).
- Handle file uploads (FormData) inside actions; retire API routes after wiring UI.

## Phase 5 – File Upload Flow
- Refactor `lib/utils/file-upload.ts` to be callable from Server Actions; accept `File[]` and return URLs/metadata.
- Parse FormData → Zod payload; merge existing + new images as in current POST handler, but via actions and structured errors.

## Phase 6 – Frontend Wiring
- Update pages/components to use Server Actions (`action` on `<form>`, `useActionState`, or `startTransition`).
- Swap API fetches for query functions in Server Components; wrap dynamic bits in `<Suspense>`, add cache directives where safe.
- Apply UI guidelines: design tokens, consistent states, accessibility/motion; consolidate shared components under `components/ui`, page-scoped under `app/.../components`.

## Phase 7 – Error Handling UX
- Add `components/ui/error-toast.tsx` (expandable, copyable) and wire to all action responses.
- Ensure services throw `AppError`; actions convert to structured error objects; UI surfaces backend message and supports copy.

## Phase 8 – Testing
- Update tests to Prisma with Mongo test DB; clean collections between runs.
- Convert integration tests to target Server Actions (no `NextResponse`/`node-mocks-http`); use FormData helpers.
- Adjust unit tests for services and validation with Prisma.
- Update test scripts if needed (`npm run test:integration`, etc.).

## Phase 9 – Cleanup & Docs
- Remove deprecated API routes, controllers layer, `lib/db/mongo-client.ts`, duplicate error class.
- Enforce import flow: `app/* → lib/actions|queries → lib/services → prisma`.
- Update README/setup for Prisma/Mongo, Server Actions, cache usage, error toasts.
- Populate `.kiro/steering/agents-progress.md` with actual phases/dates as milestones land.
