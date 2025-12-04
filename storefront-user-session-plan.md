# Storefront User Session Implementation Plan

## 1. Purpose and Scope
- Introduce a **temporary storefront session** so anonymous shoppers can keep carts, wish lists, and other personalization data before creating an account.
- Mirror the proven admin-session patterns in `lib/auth/admin-auth.ts` (token signing, cookie guards) while keeping the storefront UX fast and transparent.
- Keep this plan limited to session creation/persistence. Cart and wish list mutations will plug into this foundation later.

---

## 2. References & Guardrails
- **Existing pattern**: `lib/auth/admin-auth.ts`, `app/actions/admin-login.ts`, and `app/(admin)/layout.tsx` show how we sign tokens, set cookies, and gate layouts.
- **Next.js APIs**: Cookies must be read/written with the async [`cookies`](https://nextjs.org/docs/app/api-reference/functions/cookies) helper inside server actions or Route Handlers, and HTTP handlers must follow the [`route.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/route) conventions (request params are promises, etc.).
- **Global rule from `AGENTS.md`**: never swallow API/data errors—surface failures via `showToast` (client) or error objects (server) so storefront ErrorHandlers can alert ops.
- **Testing rules**: follow `agents/testing.md` (unit tests in `lib/**/*.test.ts`, integration tests call route handlers directly with mocked `Request` objects).

---

## 3. Requirements Summary
- Create a **signed, HTTP-only cookie** (e.g., `ss-storefront-session`) that tracks a unique session id even without authentication.
- Persist the backing document in Mongo so cart/wishlist APIs can look up the same session later.
- Sessions should last 30 days, rolling the expiration forward on activity (`lastActiveAt` touches) to avoid stale carts.
- Provide backend utilities (`ensureStorefrontSession`, `getSessionForRequest`, `touchSession`, `revokeSession`) for both Route Handlers and Server Components.
- Provide a lightweight client context so components like wishlist/cart buttons know the session id and can show proper toast errors when APIs fail.

---

## 4. Data Model & Storage (`userSessions` collection)

```ts
interface UserSessionDocument {
    _id: ObjectId;
    sessionId: string;          // uuid-like public identifier
    status: 'active' | 'revoked';
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;            // 30-day TTL index
    lastActiveAt: Date;
    cartId?: ObjectId;          // placeholder for upcoming cart doc
    wishlistId?: ObjectId;      // placeholder for wishlist storage
    metadata?: { userAgent?: string; ipHash?: string };
}
```

- Create a Mongo TTL index on `expiresAt` so dormant sessions are purged server-side.
- `sessionId` (random UUID/hex) is what storefront APIs will expose; `_id` remains internal.

---

## 5. Token & Cookie Strategy
- Token format: `${sessionId}:${expires}` signed with HMAC SHA-256 using `USER_SESSION_SECRET` (parallel to `ADMIN_SESSION_SECRET`). Reuse helpers from admin auth where possible.
- Cookie options (per cookies API docs): `httpOnly`, `secure` in production, `sameSite: 'lax'`, `path: '/'`, `maxAge: 30 * 24 * 60 * 60`.
- Implement helpers in `lib/storefront-session/session-token.ts`:
  - `createStorefrontSessionToken(sessionId: string): string`
  - `parseStorefrontSessionToken(token: string | undefined): { sessionId: string; expires: number } | null`
  - `setStorefrontSessionCookie(sessionId: string)`
  - `revokeStorefrontSessionCookie()`
- Always call `await cookies()` (`next/headers`) before reading/writing cookies to comply with the async API change in Next 16.

---

## 6. Backend Module Layout

```
lib/storefront-session/
├── index.ts
├── model/storefront-session.model.ts
├── storefront-session.schema.ts
├── storefront-session.service.ts
├── storefront-session.controller.ts
└── session-token.ts
```

### Schema (`storefront-session.schema.ts`)
- `StorefrontSessionSchema` (output) and `CreateStorefrontSessionSchema` (internal validation) using Zod.
- Expose TypeScript types via `z.infer`.

### Model (`model/storefront-session.model.ts`)
- Define `StorefrontSession` DTO (string dates) and transformers `toStorefrontSession(doc)`.
- Provide `buildDefaultSessionFields(metadata)` to centralize creation timestamps and TTL math.

### Service (`storefront-session.service.ts`)
- `createSession(metadata)` – insert doc, return DTO, call `setStorefrontSessionCookie`.
- `getSessionById(sessionId)` – find active doc, enforce expiry, throw `AppError(401, 'SESSION_EXPIRED')` if invalid.
- `ensureSession({ requestMetadata })` – if cookie valid, update `lastActiveAt`/`expiresAt`; otherwise create new doc+cookie.
- `revokeSession(sessionId)` – mark `status = 'revoked'`, delete cookie.
- Use `AppError` for validation/persistence failures; controllers will map to HTTP responses.

### Controller (`storefront-session.controller.ts`)
- `handleGetSession()` → returns `{ status: 200, body }` or error from `catchError`.
- `handleEnsureSession(input)` → optionally accept metadata (device info) from client.
- `handleRevokeSession()` → clears cookie for privacy requests.

### Index file
- Export types + functions the rest of the app needs (`ensureStorefrontSession`, `getActiveStorefrontSession`, etc.).

---

## 7. API Surface

Create Route Handlers under `app/api/storefront/session/route.ts` with the layered architecture:

| Method | Purpose | Notes |
| --- | --- | --- |
| `GET /api/storefront/session` | Returns the current session DTO (creates none) | Uses cookie to locate doc, 404/401 if missing |
| `POST /api/storefront/session` | Idempotently ensure a session exists (create if missing/expired) | Accepts optional metadata (userAgent, cart preview) |
| `DELETE /api/storefront/session` | Explicitly revoke/reset | Clears cookie + sets status revoked |

- Routes should `await params` (even if unused) to comply with Next.js 16 route-handler contract.
- On success, respond via `NextResponse.json(body, { status })`.
- After session mutations, call `revalidatePath('/(store)')` (or specific cart/wishlist paths) once those routes cache session-aware data.

---

## 8. Server & Client Integration

### Server Components
- Add `StorefrontSessionBoundary` in `app/(store)/layout.tsx`:
  - Calls `ensureStorefrontSession()` (server-only) during render.
  - Passes session DTO via context provider or React props to children.
- Provide helper `getStorefrontSessionId()` for server data functions (e.g., cart fetch action) to avoid repeated cookie parsing.

### Client Context & Hooks
- Create `components/storefront/StorefrontSessionProvider.tsx`:
  - Receives session DTO from layout.
  - Exposes `useStorefrontSession()` hook returning session plus imperative `refreshSession()` method that hits `POST /api/storefront/session`.
- Integrate with wishlist/cart buttons:
  - Buttons call APIs with `sessionId` in body/query.
  - On failure, use `useToast().showToast(...)` with status/body details (per AGENT rule).
- Expose a reusable `StorefrontErrorHandler` client boundary mirroring `app/(store)/product/components/ProductErrorHandler.tsx` but wired for session-specific errors.

### Future Actions
- Provide `app/actions/storefront-session.ts` server actions for form submissions that need guaranteed session state without extra fetches.

---

## 9. Session Lifecycle Flows
1. **First visit**  
   - No cookie → `ensureStorefrontSession` creates doc, sets cookie, returns DTO to layout/provider.
2. **Subsequent request**  
   - Cookie present → `parseStorefrontSessionToken` validates signature+expiry → service fetches doc → updates `lastActiveAt` & `expiresAt` (rolling window) to keep TTL alive.
3. **Invalid/expired cookie**  
   - Parser fails or doc missing → service creates new session, old cookie is ignored.
4. **Manual revoke**  
   - `DELETE` route marks doc revoked, clears cookie; next POST/ensure will mint a new session.

Every flow logs structured warnings when tokens fail verification to aid ops debugging.

---

## 10. Testing Strategy
- **Unit tests (`test/unit/storefront-session.service.test.ts`)**  
  - Token helpers (valid/invalid signatures, expiry).  
  - `createSession` inserts doc + returns DTO.  
  - `ensureSession` reuses existing doc and bumps timestamps.  
  - Revocation path sets status and leaves TTL.
- **Controller tests (`test/unit/storefront-session.controller.test.ts`)**  
  - Schema validation, AppError mapping.
- **Integration tests (`test/integration/storefront-session.test.ts`)**  
  - Call API handlers directly with mocked `Request` objects to verify HTTP status, cookie headers, and JSON body.  
  - Include negative cases (missing secret env, expired tokens).
- Follow `agents/testing.md` commands (`npm run test:unit`, `npm run test:integration`); use MongoDB Memory Server stubs already configured in the repo’s test helpers.

---

## 11. Implementation Order
1. Define env contract (`USER_SESSION_SECRET`) and document it in `.env.example`.
2. Create `lib/storefront-session/session-token.ts` (clone admin helpers with storefront-specific constants).
3. Add schema + model definitions.
4. Implement service functions + index exports.
5. Add controllers and wire new API route handlers.
6. Build `ensureStorefrontSession` server utility and call it from `app/(store)/layout.tsx`.
7. Add client provider/hook and integrate with navbar/cart UI stubs.
8. Write unit + integration tests.
9. Manual verification checklist (curl GET/POST/DELETE, load storefront page, inspect cookie, reload to confirm persistence).

---

## 12. Follow-Ups / Open Questions
- Cart & wishlist services will need to consume `sessionId`; coordinate field names before building those APIs.
- Analytics: decide whether to store hashed IP/user-agent metadata now or defer until privacy review.
- Consider rate-limiting `POST /api/storefront/session` if bot traffic starts churning sessions (not needed for first pass).

This plan gives us a concrete path to a tamper-proof storefront session system that honors Next.js 16 server rules and our layered architecture. Once implemented, all shopper-facing mutations can rely on the shared `sessionId` without blocking on authentication.
