# Cart Implementation Plan

## 1. Purpose and Scope
- Provide a session-scoped shopping cart for anonymous storefront visitors using the existing storefront session as a temporary account.
- Persist cart contents in MongoDB keyed by `sessionId` so items survive reloads and browser restarts while the session is active.
- Design the cart backend so it can later participate in a full checkout flow and be associated with authenticated users if needed.

---

## 2. Backend Plan

### 2.1 Data Model & Storage
- Create a new MongoDB collection, e.g. `storefrontCarts`, with a dedicated model module under `lib/cart/model/`:
  - `lib/cart/model/cart.model.ts`
- Define cart-related types:
  - `CartDocument` (DB): `_id`, `sessionId`, `items`, derived totals, timestamps.
  - `CartItem` (DB + DTO): `productId`, `selectedVariantItemIds: string[]`, `quantity`, unit price snapshot, `createdAt`, `updatedAt`.
  - `Cart` (DTO): `id`, `sessionId`, `items`, `subtotal`, `totalItems`.
- Design fields:
  - `sessionId: string` — foreign key to `StorefrontSession.sessionId`.
  - `items: Array<{ productId: string; selectedVariantItemIds: string[]; quantity: number; unitPrice: number; createdAt: Date; updatedAt: Date }>`
    - `selectedVariantItemIds` is the combination of variant items across all variant types (color, storage, etc.), matching `ImageMappingSchema.variantItemIds` and the `calculatePrice(..., selectedVariantItemIds)` helper in `product.model`.
  - `createdAt`, `updatedAt`.
- Indexes:
  - Unique index on `{ sessionId: 1 }` to ensure one cart per session.
  - Optional index on `{ 'items.productId': 1 }` for future queries.

### 2.2 Schema and Validation
- Create `lib/cart/cart.schema.ts`:
  - `CartItemSchema` – `productId`, `selectedVariantItemIds: string[]`, `quantity` (`z.number().int().min(1)`).
  - `CartSchema` – read DTO.
  - Input schemas:
    - `AddToCartSchema` – `{ productId: string; selectedVariantItemIds: string[]; quantity: number }`.
    - `UpdateCartItemSchema` – `{ productId: string; selectedVariantItemIds: string[]; quantity: number }` (quantity can set or adjust).
    - `RemoveFromCartSchema` – `{ productId: string; selectedVariantItemIds: string[] }`.
    - `ClearCartSchema` – `{}` (session resolved from cookie).
- Export types via `z.infer` and re-export from `lib/cart/index.ts`.

### 2.3 Service Layer
- Create `lib/cart/cart.service.ts` implementing core domain rules:
  - `getCartBySessionId(sessionId: string): Promise<Cart | null>`:
    - Fetches cart document by `sessionId`, returns DTO or `null`.
  - `ensureCart(sessionId: string): Promise<Cart>`:
    - Finds cart by `sessionId`, creates a new empty cart if missing.
  - `addItemToCart(params: { sessionId: string; productId: string; selectedVariantItemIds: string[]; quantity: number }): Promise<Cart>`:
    - Ensures cart exists.
    - Validates that the product exists and is available via product service.
    - Normalizes the variant combination (e.g., sort/de-duplicate `selectedVariantItemIds`) to get a stable key.
    - If the `(productId, normalizedSelectedVariantItemIds)` pair already exists, increments quantity instead of adding a new line.
    - Applies any business rules: max quantity per item, min quantity, potential stock checks (for now, keep simple).
  - `updateCartItemQuantity(params: { sessionId: string; productId: string; selectedVariantItemIds: string[]; quantity: number }): Promise<Cart>`:
    - If quantity <= 0, either removes the item or throws an `AppError` (document behavior).
  - `removeItemFromCart(params: { sessionId: string; productId: string; selectedVariantItemIds: string[] }): Promise<Cart>`:
    - Removes the item matching `(productId, normalizedSelectedVariantItemIds)`; treat missing item as idempotent success.
  - `clearCart(sessionId: string): Promise<Cart>`:
    - Empties the cart while leaving the document intact.
- Derived totals:
  - Implement helper functions in model/service to compute `subtotal` and `totalItems` from items.
  - When adding or updating items, compute `unitPrice` via the existing `calculatePrice(basePrice, offerPrice, variants, selectedVariantItemIds)` helper so variant price modifiers are consistently applied for each combination.
- Error handling:
  - Use `AppError` for rule violations (e.g., invalid product, too many items).
  - Let controllers map errors to `{ status, body }` consistently with other features.

### 2.4 Controller Layer
- Create `lib/cart/cart.controller.ts` with functions:
  - `handleGetCart(sessionId: string)`:
    - Calls `getCartBySessionId`.
    - Returns status 200 with cart DTO or an empty-cart representation.
  - `handleEnsureCart(sessionId: string)`:
    - Calls `ensureCart`.
  - `handleAddToCart(input)`:
    - Validates with `AddToCartSchema`.
    - Resolves `sessionId` from cookie.
    - Calls `addItemToCart`.
  - `handleUpdateCartItem(input)`:
    - Validates with `UpdateCartItemSchema`.
    - Calls `updateCartItemQuantity`.
  - `handleRemoveFromCart(input)`:
    - Validates with `RemoveFromCartSchema`.
  - `handleClearCart()`:
    - Clears all items for current session.
- Use a helper to translate `AppError` instances into HTTP response objects (status, body, message, code) consistent with other controllers.

### 2.5 Route Handlers
- Add route handlers under `app/api/storefront/cart/route.ts`:
  - `GET /api/storefront/cart` – read cart for current session.
  - `POST /api/storefront/cart` – add item to cart.
  - `PATCH /api/storefront/cart` – update quantity for an existing cart item.
  - `DELETE /api/storefront/cart` – remove an item or clear the cart based on body/params.
- For each handler:
  - Resolve `sessionId` via `lib/storefront-session` cookie helpers (`getStorefrontSessionId` / `ensureStorefrontSession`).
  - Validate request body with the appropriate schema in controllers.
  - Return `NextResponse.json(body, { status })` on success.
  - Call `revalidatePath` for cart-aware pages (e.g., `/ (store)`, `/ (store)/cart`) if/when they use cached data.
  - On error, surface the full error body so client toasts can show details (`status`, `body`, `method`, `url`).

### 2.6 Integration with Storefront Session
- Reuse the `cartId` placeholder in `StorefrontSession` model if needed:
  - Decide whether to:
    - (A) Reference carts via `cartId` (linking session to cart document), or
    - (B) Use `sessionId` as the primary foreign key.
  - For simplicity in first pass, prefer (B): a cart is always looked up by `sessionId`; `cartId` remains reserved.
- Implement server helper(s):
  - `getCartForCurrentSession()`:
    - Resolves `sessionId` from cookie.
    - Calls `getCartBySessionId`.
  - `ensureCartForCurrentSession()`:
    - Ensures a cart exists for the current session; useful for server-rendered cart pages.

---

## 3. Frontend Plan

### 3.1 UX and Entry Points
- Identify cart-related UX:
  - “Add to cart” buttons in `components/ProductGrid.tsx`.
  - Primary call-to-action in product detail pages (`ProductDetails`).
  - Cart icon / summary in the storefront header (mini cart or badge).
  - Dedicated cart page under `app/(store)/cart/page.tsx`.
- Behavior goals:
  - Adding to cart should feel instant (consider optimistic updates) and always show success or error toasts.
  - Cart badge shows total item count.
  - Cart page shows detailed line items, quantities, and subtotal.

### 3.2 Client State & Hooks
- Create a cart context and hook under `components/storefront/StorefrontCartProvider.tsx`:
  - Props: initial cart DTO from server.
  - Exposed hook: `useStorefrontCart()` returning:
    - `cart`, `items`, `totalItems`, `subtotal`.
    - `addToCart(productId, selectedVariantItemIds: string[], quantity?)`.
    - `updateItem(productId, selectedVariantItemIds: string[], quantity)`.
    - `removeItem(productId, selectedVariantItemIds: string[])`.
    - `clearCart()`.
    - `refreshCart()`.
- Implementation details:
  - Initialize from server data when available (e.g., loaded by layout/page).
  - For mutations, call the corresponding `/api/storefront/cart` methods.
  - Keep local state synchronized with responses; for optimistic updates, roll back on failure.
  - Normalize keys the same way as the backend (e.g., `${productId}|${normalizedSelectedVariantItemIds.join(',')}`) so each distinct variant combination of a product shows as a separate line.

### 3.3 Integrating with Existing Components
- `components/ProductGrid.tsx`:
  - Wire the cart button’s click handler to `addToCart`.
  - Use `useStorefrontCart` to show loading/disabled state while a mutation is in flight.
  - Ensure ARIA attributes and labels clearly describe the action (e.g., `aria-label="Add <name> to cart"`).
- `app/(store)/product/components/ProductDetails.tsx`:
  - Integrate an “Add to cart” button with quantity selection (if available).
  - Use `addToCart` hook with chosen quantity.
- Storefront header / navigation component (wherever defined):
  - Display a cart icon with a badge using `totalItems`.
  - Clicking the icon navigates to `/ (store)/cart`.

### 3.4 Cart Page
- Create `app/(store)/cart/page.tsx`:
  - Server component:
    - Resolves current session (read-only helper).
    - Fetches cart via `getCartForCurrentSession`.
    - Fetches product details (name, image, price) for each item to display a full summary.
  - Renders a line-item list:
    - Product image, title, variant summary, unit price, quantity control, per-line subtotal.
  - Include actions:
    - Quantity increment/decrement buttons hooked to `updateItem`.
    - Remove button hooked to `removeItem`.
    - “Clear cart” action that calls `clearCart`.
  - Shows empty-state design when no items are present.

### 3.5 Error Handling & Toasts
- In client hooks and UI components:
  - Wrap fetches in try/catch.
  - For non-OK HTTP responses, parse JSON and call `showToast` with `{ status, body, url, method }`.
  - For network failures, use a sensible fallback toast message while still logging technical details.
- For server-rendered pages:
  - Follow the project’s existing `ErrorHandler` pattern to bubble server errors to a client component that triggers toasts.

### 3.6 Caching and Revalidation
- Keep cart endpoints effectively dynamic, as cart contents are per-session and frequently change.
- If introducing cache components:
  - Avoid using `cookies()` within cached scopes; parse session outside and pass `sessionId` into cached components.
  - Use `revalidatePath('/(store)/cart')` and other relevant routes after cart mutations if those pages start leveraging caching.

---

## 4. Testing Plan
- Backend:
  - Unit tests in `test/unit/cart.service.test.ts` and `test/unit/cart.controller.test.ts` to cover:
    - Creating carts, adding/removing items, quantity updates, clearing cart.
    - Edge cases (duplicate items, exceeding limits, invalid products).
  - Integration tests in `test/integration/cart.test.ts`:
    - Exercise `GET/POST/PATCH/DELETE /api/storefront/cart` using mocked `Request` objects and Mongo memory server.
- Frontend:
  - Hook-level tests for `useStorefrontCart` (if the project includes existing hook tests).
  - High-level tests (later) for cart flows in the storefront (add item, change quantity, navigate to cart page, reload).

---

## 5. Implementation Order
1. Scaffold `lib/cart` module (model, schema, service, controller, index).
2. Implement Mongo indexes and derived total helpers.
3. Add `app/api/storefront/cart/route.ts` handlers and wire them to controllers.
4. Implement server helpers `getCartForCurrentSession` and `ensureCartForCurrentSession`.
5. Build `StorefrontCartProvider` and `useStorefrontCart` hook.
6. Integrate cart actions into `ProductGrid` and product detail components.
7. Implement the dedicated cart page and header cart badge.
8. Add backend unit/integration tests per `agents/testing.md`.
9. Run manual verification flows (add/update/remove/clear, reload, error paths).
