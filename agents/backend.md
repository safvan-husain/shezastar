# Backend & API

## Layer Responsibilities
- **Route Handlers (`app/api/**/route.ts`)**: only `Request`/`NextResponse`, parse input, call controller, return response; no business logic.
- **Controllers (`*.controller.ts`)**: validate with Zod schemas, call services, map `AppError` to `{ status, body }`.
- **Services (`*.service.ts`)**: hold domain rules, talk to MongoDB via `lib/db`, throw `AppError` on rule failures, return domain objects.
- **Schemas (`*.schema.ts`)**: Zod shapes for inputs/outputs; types via `z.infer`.
- **Models (`model/*.model.ts`)**: domain types and mappers (DB → domain JSON); no DB calls here.

## Next.js 15+ Async Params
**Breaking change:** Dynamic route `params` are now Promises in both API routes and page components.

```ts
// ❌ Old (Next.js 14 and earlier)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const data = await fetchData(params.id);
}

// ✅ New (Next.js 15+)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchData(id);
}
```

**Why:** Next.js now defers param resolution for better streaming/performance. Always `await params` before accessing properties in both API routes and page/layout components.

## Data Layer
- MongoDB only (no Prisma). Place adapters/helpers in `lib/db/` (e.g., `mongo-client.ts`, `<feature>-db.ts`).
- Services may import DB utilities directly; routes/controllers must not.

## Error Handling (Backend)
- Use `AppError` (`lib/errors/app-error.ts`) with `status`, `code`, optional `details`. Services throw; controllers translate to HTTP-safe payloads.

## Import & Dependency Rules
1. Never import `app/*` inside `lib/*`.
2. Routes import controllers/utils only.
3. Controllers import schemas/services/models.
4. Services import DB adapters/models/utils.
5. Avoid circular imports.

## Naming & Structure
- Files: `auth.service.ts`, `auth.schema.ts`, `auth.controller.ts`, `model/user.model.ts`.
- Services use verb names (`createUser`), controllers use `handleXxx` (`handleLogin`), schemas use PascalCase (`LoginSchema`).

## Flow Snapshot
`Request → route handler → controller.validate → service → model transforms → controller result → NextResponse`

## Feature Checklist
1. Create `lib/<feature>/` with schema, service, controller, models, index.
2. Add route at `app/api/<feature>/route.ts` pointing to controller.
3. Keep business logic in services; validation in controllers; persistence in DB helpers.
4. Mongo access only through `lib/db/`.
