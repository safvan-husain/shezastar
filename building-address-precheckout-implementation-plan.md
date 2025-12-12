# Building Address Pre‑Checkout — Implementation Plan

This plan follows your sequencing rule: **backend first**, then **backend unit + integration tests**, then **frontend UI/UX**.

## 1. Backend Implementation

### 1.1 Define shared BillingDetails schema/types
- Create a shared Zod schema to match `BillingDetails` so cart, checkout, and orders validate the same shape:
  - `lib/billing-details/billing-details.schema.ts`
    - `BillingDetailsSchema` with required/optional fields exactly as in `BillingDetails`.
    - Export `BillingDetailsDto = z.infer<typeof BillingDetailsSchema>`.
- Rationale: avoids duplicate validation logic and keeps admin/order UI consistent.

### 1.2 Persist billing details on cart (session + user)
**Data model**
- Extend `lib/cart/model/cart.model.ts`:
  - Add `billingDetails?: BillingDetailsDocument` to `CartDocument`.
  - Add `billingDetails?: BillingDetailsDto` to `Cart`.
  - Update `toCart` to map `billingDetails` through.
- Update `lib/cart/cart.schema.ts`:
  - Import `BillingDetailsSchema`.
  - Add optional `billingDetails` field to `CartSchema`.

**Service**
- In `lib/cart/cart.service.ts`:
  - Add helper `getBillingDetailsForCurrentSession(): Promise<BillingDetailsDto | null>`
    - Resolve current storefront session.
    - Find cart (by `userId` if present else `sessionId`).
    - Return `cart.billingDetails ?? null`.
  - Add helper `setBillingDetailsForCurrentSession(input: BillingDetailsDto): Promise<Cart>`
    - Ensure cart exists for session/user.
    - `$set: { billingDetails: input, updatedAt }`.
    - Return updated cart DTO.
  - Add helper `getBillingDetailsBySessionId(sessionId: string): Promise<BillingDetailsDto | null>`
    - Used by webhooks as fallback.

**Controller + route**
- Add `lib/cart/billing-details.controller.ts` (controller layer per backend guide):
  - `handleGetBillingDetailsForCurrentSession()`
  - `handleSetBillingDetailsForCurrentSession(input)`
    - Parse with `BillingDetailsSchema`.
- Add API route:
  - `app/api/storefront/cart/billing-details/route.ts`
    - `GET` → controller get.
    - `PUT` (or `POST`) → controller set.
  - Return `{ status, body }` using NextResponse, and keep errors via `catchError`.

### 1.3 Gate Stripe checkout session creation on billing details
- Update `app/api/checkout_sessions/route.ts`:
  - Before preparing line items, load billing details from cart/session:
    - `const cart = await getCartForCurrentSession();`
    - If missing or invalid per `BillingDetailsSchema`, return `400` with `{ code: 'BILLING_DETAILS_REQUIRED', error: 'BILLING_DETAILS_REQUIRED' }`.
  - For Buy‑Now flow (items passed in body):
    - Still require billing details from current cart/session.
  - Optional resilience: attach billing snapshot into Stripe metadata (within size limits):
    - Add `metadata.billingDetails = JSON.stringify(billingDetails)` **only if length < 500 chars**; otherwise store minimal keys (`billingEmail`, `billingCountry`, `billingName`).
  - Keep existing stock validation behavior unchanged.

### 1.4 Store billing details on Order for admin visibility
**Order model**
- Extend `lib/order/model/order.model.ts`:
  - Add `billingDetails?: BillingDetailsDocument` to `OrderDocument`.
  - Add `billingDetails?: BillingDetailsDto` to `Order`.
  - Update `toOrder` to include mapped billing details.

**Order schema**
- Update `lib/order/order.schema.ts`:
  - Import `BillingDetailsSchema`.
  - Add optional `billingDetails` to `OrderSchema`.
  - Admin list schema will include it automatically via `OrderSchema`.

**Order creation path (Stripe webhook)**
- Update `app/api/webhooks/route.ts` in `checkout.session.completed` handler:
  - After resolving `storefrontSessionId` and before `createOrder(orderData)`:
    - Fetch billing snapshot:
      - Preferred: read cart by session id and take `billingDetails`.
      - Fallback: read from Stripe metadata if present.
    - If snapshot exists, set `orderData.billingDetails = snapshot`.
  - Ensure this happens **before** cart clearing.

### 1.5 Optional: account‑level saved addresses (for “add another address”)
This can be deferred, but backend hooks should allow multiple addresses later:
- For now store a **single** billingDetails on cart.
- If later needed:
  - Add `lib/account-addresses/` feature and store multiple per user; cart stores selected address id + snapshot.

---

## 2. Backend Tests (after backend code)

### 2.1 Unit tests
**Cart billing details**
- Add `test/unit/cart.billing-details.test.ts`:
  - `setBillingDetailsForCurrentSession` saves and returns billing.
  - Invalid payload rejected by schema.
  - Guest (sessionId) and user (userId) carts both supported.

**Order billing details**
- Update `test/unit/order.service.test.ts`:
  - Extend `BASE_ORDER_DATA` with `billingDetails`.
  - Assert `createOrder` persists and `getOrderById` returns it.

### 2.2 Integration tests
**Admin orders API returns billing**
- Update `test/integration/orders.test.ts`:
  - Seed an order with `billingDetails`.
  - `GET /api/admin/orders` and `/api/admin/orders/[id]` include billing details in JSON.

**Checkout session gating**
- Add `test/integration/checkout-sessions.test.ts`:
  - With empty cart billing, `POST /api/checkout_sessions` returns 400 + `BILLING_DETAILS_REQUIRED`.
  - With valid billing, handler proceeds (mock Stripe if needed; if existing tests don’t mock Stripe, assert status is not 400 and body contains `url` when STRIPE_SECRET_KEY is set in test env).

---

## 3. Frontend UI/UX (only after backend tests pass)

### 3.1 Cart page building address section
- Load billing details from cart DTO.
- Add top‑of‑cart panel:
  - Saved summary + `Edit` / `Add another` actions.
  - Empty state + `Create building address` CTA.
- Inline create/edit form tied to `PUT /api/storefront/cart/billing-details`.
- Disable checkout CTA unless valid billingDetails exists in cart state.
- On attempted checkout without billing, scroll to section + toast error.

### 3.2 Buy‑Now PDP overlay
- `Buy Now` opens modal.
- If billing exists: preview + confirm + `Edit`/`Add another`.
- If none: render full form in modal.
- On confirm, call billing save endpoint, then call checkout session endpoint with buy‑now items.

### 3.3 Error surfacing
- All client mutations must toast full error status/body/url/method per `agents/frontend.md`.

