# Wishlist Implementation Plan

## 1. Purpose and Scope
- Allow anonymous storefront visitors (backed by the existing storefront session) to maintain a persistent wishlist of products.
- Store wishlist state in MongoDB keyed by `sessionId`, so it survives page reloads and browser restarts while the session is active.
- Provide clean backend APIs and services that can later be reused by other clients (e.g., potential mobile app, future authenticated accounts).

---

## 2. Backend Plan

### 2.1 Data Model & Storage
- Create a new MongoDB collection, e.g. `storefrontWishlists`, with a dedicated model module under `lib/wishlist/model/`:
  - `lib/wishlist/model/wishlist.model.ts`
- Define DTO and document shapes:
  - `WishlistDocument` (DB): `_id`, `sessionId`, `items`, timestamps.
  - `WishlistItem` (DB + DTO): `productId`, `selectedVariantItemIds: string[]`, `createdAt`.
  - `Wishlist` (DTO): `id`, `sessionId`, `items`, derived counts.
- Design fields:
  - `sessionId: string` — matches `StorefrontSession.sessionId`; use this for lookups.
  - `items: Array<{ productId: string; selectedVariantItemIds: string[]; createdAt: Date }>`
    - `selectedVariantItemIds` mirrors the combination model used in `ImageMappingSchema.variantItemIds` and `calculatePrice(..., selectedVariantItemIds)`, i.e. a set of variant item IDs across all variant types (color, storage, etc.).
  - `createdAt`, `updatedAt`.
- Indexes:
  - Unique compound index on `{ sessionId: 1 }` to ensure at most one wishlist per session.
  - Optional index on `{ 'items.productId': 1 }` if needed for future analytics.

### 2.2 Schema and Validation
- Create `lib/wishlist/wishlist.schema.ts`:
  - `WishlistItemSchema` – validates `productId` plus `selectedVariantItemIds: string[]` (can be empty when no variants are selected).
  - `WishlistSchema` – read DTO shape for responses.
  - Input schemas:
    - `AddToWishlistSchema` – `{ sessionId: string; productId: string; selectedVariantItemIds: string[] }`.
    - `RemoveFromWishlistSchema` – `{ sessionId: string; productId: string; selectedVariantItemIds: string[] }`.
    - `ClearWishlistSchema` – `{ sessionId: string }`.
- Use `z.infer` for TypeScript types and re-export from `lib/wishlist/index.ts`.

### 2.3 Service Layer
- Create `lib/wishlist/wishlist.service.ts` implementing core behavior:
  - `getWishlistBySessionId(sessionId: string): Promise<Wishlist | null>`:
    - Reads from `storefrontWishlists`.
    - Returns `null` if none exists; does not create.
  - `ensureWishlist(sessionId: string): Promise<Wishlist>`:
    - Finds by `sessionId`; creates a new empty wishlist if missing.
  - `addItemToWishlist(params: { sessionId: string; productId: string; selectedVariantItemIds: string[] }): Promise<Wishlist>`:
    - Ensures wishlist exists.
    - Validates the product exists via `lib/product` service or a lightweight existence check.
    - Normalizes the variant combination (e.g., sort and de-duplicate `selectedVariantItemIds`) to build a stable key.
    - If `(productId, normalizedSelectedVariantItemIds)` already present, no-op but still updates `updatedAt`.
    - Throws `AppError` (409) if business rules violated (e.g., wishlist size cap) and lets controller translate.
  - `removeItemFromWishlist(params: { sessionId: string; productId: string; selectedVariantItemIds: string[] }): Promise<Wishlist>`:
    - Removes the entry matching `(productId, normalizedSelectedVariantItemIds)`; if item not found, treat as idempotent success or throw an `AppError` (decide and document).
  - `clearWishlist(sessionId: string): Promise<Wishlist>`:
    - Empties `items` array while keeping the wishlist document.
- All service functions:
  - Use `lib/db` helpers for Mongo access.
  - Throw `AppError` for validation, missing session linkage, or DB failures.
  - Return DTOs via model mappers.

### 2.4 Controller Layer
- Create `lib/wishlist/wishlist.controller.ts` following the existing controller patterns:
  - `handleGetWishlist(sessionId: string)`:
    - Calls `getWishlistBySessionId`.
    - Returns `{ status: 200, body }` for existing wishlist; `{ status: 200, body: { items: [] } }` or `{ status: 404 }` for none, whichever pattern matches other features.
  - `handleEnsureWishlist(sessionId: string)`:
    - Calls `ensureWishlist` and returns the DTO with `status: 200` or `201` if created.
  - `handleAddToWishlist(input)`:
    - Parses body via `AddToWishlistSchema`.
    - Calls `addItemToWishlist`.
    - Maps `AppError` to `{ status, body }` with a machine-readable `code`.
  - `handleRemoveFromWishlist(input)`:
    - Validates via `RemoveFromWishlistSchema`, calls `removeItemFromWishlist`.
  - `handleClearWishlist(input)`:
    - Validates via `ClearWishlistSchema`, calls `clearWishlist`.
- Ensure controllers never talk to Mongo directly and only import services/schemas/models.

### 2.5 Route Handlers
- Add a new route group under `app/api/storefront/wishlist/route.ts`:
  - `GET /api/storefront/wishlist` – read current wishlist for session.
  - `POST /api/storefront/wishlist` – add an item.
  - `DELETE /api/storefront/wishlist` – remove an item (body or query determines which).
  - `PATCH /api/storefront/wishlist/clear` (optional) – clear all items; alternatively reuse `DELETE` with a mode flag.
- For each handler:
  - Use the existing storefront session infrastructure:
    - Parse `sessionId` from cookie via `lib/storefront-session` (prefer `getStorefrontSessionId` helper).
    - Do **not** accept arbitrary `sessionId` from the client; rely on cookie for trust boundary.
  - Follow Next.js 16 route contracts (`params: Promise`, etc.), using patterns from existing route files.
  - On success:
    - Return `NextResponse.json(body, { status })`.
    - Call `revalidatePath` for any session-aware storefront paths once they start caching wishlist data (e.g., `/ (store)` home or a dedicated wishlist page).
  - On failure:
    - Map `AppError` via controller; include `code`, human-readable `message`, and any `details`.

### 2.6 Integration with Storefront Session
- Update `lib/storefront-session/model/storefront-session.model.ts` and schema if needed to clarify `wishlistId` semantics:
  - Decide whether to:
    - (A) Keep a simple `wishlistId` reference to `storefrontWishlists._id`, or
    - (B) Treat `sessionId` as the sole foreign key.
  - For first iteration, prefer option (B) to avoid extra coupling; leave `wishlistId` reserved for future cross-session migration.
- Provide helper functions:
  - `getWishlistForCurrentSession()` – server-only helper that:
    - Resolves session from cookie.
    - Calls `getWishlistBySessionId`.

---

## 3. Frontend Plan

### 3.1 UX and Entry Points
- Identify wishlist entry points:
  - Heart icon buttons in `components/ProductGrid.tsx`.
  - Product detail pages under `app/(store)/product/[id]/page.tsx` and `app/(store)/product/components/ProductDetails.tsx`.
  - Optional dedicated wishlist page under `app/(store)/wishlist/page.tsx`.
- Desired behaviors:
  - Clicking the wishlist button toggles the product’s presence in the wishlist for the current session.
  - Wishlist state is reflected in the UI (filled vs outlined heart, count badge).
  - All network errors show toasts with status, body, method, and url.

### 3.2 Client State & Hooks
- Add a client-side wishlist context in `components/storefront/StorefrontWishlistProvider.tsx`:
  - Props: initial wishlist items from server (nullable).
  - Exposed hook: `useStorefrontWishlist()` returning:
    - `items`, `isLoading`, `error`.
    - `isInWishlist(productId, selectedVariantItemIds: string[])`.
    - `toggleWishlistItem(productId, selectedVariantItemIds: string[])`.
    - Optional `refreshWishlist()` to refetch from API.
- Implementation notes:
  - Use `StorefrontSessionProvider` (from existing session work) to ensure session is initialized before wishlist fetches.
  - On first mount, call `GET /api/storefront/wishlist` if session exists.
  - Keep state normalized by a composite key such as `${productId}|${normalizedSelectedVariantItemIds.join(',')}` so different variant combinations of the same product are tracked separately.

### 3.3 Integrating with Existing Components
- `components/ProductGrid.tsx`:
  - Wrap page-level components in `StorefrontWishlistProvider` via layout or route-level component.
  - Wire the wishlist heart button to `toggleWishlistItem` and visual state:
    - `aria-pressed` and `aria-label` reflect current wishlist state.
  - Ensure the button uses `--storefront-button-secondary` variables per `agents/frontend.md`.
- Product detail components:
  - Add a wishlist toggle button near primary actions (e.g., “Add to cart”).
  - Reuse the same hook methods and accessibility patterns as grid items.

### 3.4 Wishlist Page (Optional but Recommended)
- Create `app/(store)/wishlist/page.tsx`:
  - Server component that:
    - Reads current session (`ensureStorefrontSession` or a read-only helper).
    - Fetches wishlist items server-side via `getWishlistForCurrentSession`.
    - Resolves product details for each item via product service (to show names, images, prices).
  - Renders a grid/list of wishlist products using existing product card components where possible.
  - Includes “Remove” or “Move to Cart” actions wired to client wishlist/cart hooks.
- Add a nav entry or icon in the storefront header indicating the wishlist (count badge from client hook).

### 3.5 Error Handling & Toasts
- Follow `agents/frontend.md` patterns:
  - In client hooks, wrap `fetch`/mutation calls in try/catch.
  - On non-2xx responses:
    - Read the JSON body and pass `{ status, body, method, url }` to `showToast`.
  - Ensure that error objects from server components are surfaced via existing `ErrorHandler` components where used.
- For optimistic updates:
  - Optionally update local state before the API call, then revert on failure with an error toast.

### 3.6 Caching and Revalidation
- For server-rendered wishlist and product pages:
  - Keep them dynamic or use `'use cache'` with appropriate `cacheTag` only after behavior is stable.
  - When mutations occur (add/remove/clear), ensure route handlers call `revalidatePath('/(store)/wishlist')` and any other affected paths.
- Ensure that wishlist-aware components do not read `cookies()` inside cached scopes; session resolution should happen outside cached components and be passed down.

---

## 4. Testing Plan
- Backend:
  - Unit tests in `test/unit/wishlist.service.test.ts` and `test/unit/wishlist.controller.test.ts` mirroring storefront-session patterns.
  - Integration tests in `test/integration/wishlist.test.ts` targeting `GET/POST/DELETE` routes with mocked `Request` objects and Mongo memory server.
- Frontend:
  - Hook-level tests for `useStorefrontWishlist` (if existing patterns cover hooks).
  - Playwright/End-to-end scenarios (later) to verify that anonymous visitors can add/remove items and see persisted state after reload.

---

## 5. Implementation Order
1. Scaffold `lib/wishlist` module (model, schema, service, controller, index).
2. Implement Mongo indexes and helper functions in the service.
3. Add `app/api/storefront/wishlist/route.ts` handlers and wire to controllers.
4. Introduce server helper `getWishlistForCurrentSession`.
5. Build `StorefrontWishlistProvider` and `useStorefrontWishlist` hook.
6. Integrate wishlist buttons into `ProductGrid` and product detail components.
7. (Optional) Implement the dedicated wishlist page and navigation entry.
8. Add unit/integration tests following `agents/testing.md`.
9. Perform manual verification flows (add/remove/clear, reload, different devices).
