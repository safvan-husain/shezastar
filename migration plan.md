# Migration Plan: Server Actions + Prisma (Mongo)

Plan to align the codebase with the new steering (Server Actions, Prisma targeting MongoDB, Zod, Cache Components, structured errors). Current state: API routes + controllers/services using `mongo-client`, duplicated error classes, no Prisma schema yet.

---

## Phase 0 – Prep
- [x] Set env: add `DATABASE_URL` for MongoDB (dev/test). Plan test DB URI.
- [x] Add deps: `prisma`, `@prisma/client` (and tooling like `ts-node` if needed). Prepare to remove direct `mongodb` dependency after migration.
- [x] Initialize `prisma/schema.prisma` with MongoDB provider; model existing collections (products, categories, variant types, images/variants) to preserve shape.

## Phase 1 – Data Layer & Errors
- [x] Add `lib/db/prisma.ts` singleton (per steering).
- [x] Consolidate to one `AppError` (remove `lib/error/appError.ts` duplication); shape per steering (`status`, `code`, `message`, `details`, `timestamp`).
- [x] Map current Mongo collections to Prisma models; plan data migration scripts if existing data must be preserved.

## Phase 2 – Services & Validation
- [x] Products use Prisma-backed services (legacy Mongo removed).
- [ ] Categories use Prisma-backed services (legacy Mongo still active).
- [ ] Variant types use Prisma-backed services (legacy Mongo still active).
- [x] Product Zod schemas live in `lib/validations`.
- [ ] Category Zod schemas centralized in `lib/validations` (currently feature-local).
- [ ] Variant-type Zod schemas centralized in `lib/validations` (currently feature-local).
- [ ] Define DTOs for form payloads vs stored models (products/images/variants).

## Phase 3 – Queries (Reads)
- [x] Add `lib/queries/*` for reads (e.g., `getAllProducts`, `getProductById`, `getCategories`, `getVariantTypes`), using `cache()`/`'use cache'` and cache tags where appropriate.
- [x] Shape select/output to avoid over-fetching; provide view models for UI.

## Phase 4 – Server Actions (Writes)
- [x] Replace product API route with Server Actions under `lib/actions/product.actions.ts`.
- [ ] Replace category API routes with Server Actions under `lib/actions/category.actions.ts`.
- [ ] Replace variant-type API routes with Server Actions under `lib/actions/variant-type.actions.ts`.
- [x] In actions: `'use server'`, validate with Zod, call services, return `{ success, data?, error? }`, revalidate tags/paths (`revalidateTag('products')`, etc.).
- [x] Handle file uploads (FormData) inside actions; retire API routes after wiring UI.

## Phase 5 – File Upload Flow
- [x] Refactor `lib/utils/file-upload.ts` to be callable from Server Actions; accept `File[]` and return URLs/metadata.
- [x] Parse FormData → Zod payload; merge existing + new images as in current POST handler, but via actions and structured errors.

## Phase 6 – Frontend Wiring
- [x] Update pages/components to use Server Actions (`action` on `<form>`, `useActionState`, or `startTransition`). (Product admin pages now submit via server actions.)
- [x] Swap API fetches for query functions in Server Components; wrap dynamic bits in `<Suspense>`, add cache directives where safe.
- [ ] Apply UI guidelines: design tokens, consistent states, accessibility/motion; consolidate shared components under `components/ui`, page-scoped under `app/.../components`.

## Phase 7 – Error Handling UX
- [x] Add `components/ui/error-toast.tsx` (expandable, copyable) and wire to all action responses.
- [ ] Ensure services throw `AppError`; actions convert to structured error objects; UI surfaces backend message and supports copy.

## Phase 8 – Testing
- [ ] Update tests to Prisma with Mongo test DB; clean collections between runs.
- [ ] Convert integration tests to target Server Actions (no `NextResponse`/`node-mocks-http`); use FormData helpers.
- [ ] Adjust unit tests for services and validation with Prisma.
- [ ] Update test scripts if needed (`npm run test:integration`, etc.).

## Phase 9 – Cleanup & Docs
- [ ] Remove deprecated API routes, controllers layer, `lib/db/mongo-client.ts`, duplicate error class.
- [ ] Enforce import flow: `app/* → lib/actions|queries → lib/services → prisma`.
- [ ] Update README/setup for Prisma/Mongo, Server Actions, cache usage, error toasts.
- [ ] Populate `.kiro/steering/agents-progress.md` with actual phases/dates as milestones land.

---

## Phase 11 – Rollout Plan
- Gate new Server Actions behind feature flags per route to allow incremental rollout.
- Run parallel smoke tests (old API vs new actions) until parity is proven; keep a rollback switch.
- Stage data migration: backfill Prisma-managed collections from existing Mongo data, then freeze writes and cut over.

## Immediate Next Steps (execution order)
1) [x] Finalize Prisma models for products, categories, variant types, and images using current collection samples; generate and commit the Prisma client.
2) [x] Port the highest-traffic read paths first: build `lib/queries/products.ts` (`getAllProducts`, `getProductById`), wire to Server Components, and cache-tag the list/detail views.
3) [x] Create `lib/validations/product.ts` and `lib/services/product.service.ts`; move existing DTO logic into services, returning `AppError` on validation/business failures.
4) [x] Replace `POST /products` API route with `lib/actions/product.actions.ts` using the new validation/service, including file upload handling via `lib/utils/file-upload.ts`.
5) [x] Add `components/ui/error-toast.tsx` and propagate to pages using the new product actions; ensure errors are copyable/expandable.
6) [ ] Update tests to hit product Server Actions (form payloads + file uploads) against the Mongo test database seeded via Prisma; clean collections between cases.
7) [ ] Remove the deprecated product API route and controller once the action-backed UI passes regression tests.
8) [ ] Migrate categories to Prisma-backed services and create `lib/actions/category.actions.ts` to replace legacy API routes.
9) [ ] Migrate variant types to Prisma-backed services and create `lib/actions/variant-type.actions.ts` to replace legacy API routes.
10) [ ] Move category and variant-type validation schemas into `lib/validations` alongside products; align DTOs across features.
11) [ ] Remove `lib/db/mongo-client.ts` and any remaining Mongo helpers after all features run on Prisma services.
12) [ ] Update integration tests to target category and variant-type server actions instead of legacy API routes.
