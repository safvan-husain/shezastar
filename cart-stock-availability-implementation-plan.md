# Cart Stock Availability Implementation Plan

## 1. Purpose and Scope
- Ensure the cart always reflects up-to-date product stock before a customer proceeds to checkout.
- When a customer visits the cart page, validate each cart line’s quantity against the latest stock from the product schema (variant-level where configured, falling back to product-level `stockCount` when applicable).
- Visibly flag any cart lines whose requested quantity exceeds available stock and gate checkout until quantities are adjusted.
- On checkout attempts with invalid quantities, show a toast message:  
  `"This product has not this much count. There is only this much left. Please adjust the count."`  
  including the actual remaining count in the toast details for debugging.

This plan builds on the existing cart and checkout flows described in `cart-implementation-plan.md` and the stock utilities in `lib/product/product.service-stock.ts`.

---

## 2. Backend & Stock Validation Plan

### 2.1 Reuse Existing Stock Utilities
- File: `lib/product/product.service-stock.ts`.
- Reuse and lean on the existing helpers:
  - `getVariantStock(productId, selectedVariantItemIds)` – variant-combination stock lookup.
  - `validateStockAvailability(items)` – bulk validation used by `/api/checkout_sessions`.
- Confirm and document semantics:
  - When a variant combination is explicitly tracked via `product.variantStock`, use its `stockCount`.
  - If `variantStock` has no entry for a given combination, treat stock as “unlimited” (no constraint) to mirror current behavior.
  - Product-level `stockCount` remains DEPRECATED but is used in the storefront product page for initial add-to-cart limits; cart-level validation will rely on `variantStock` via `validateStockAvailability`.

### 2.2 Cart Page Stock Validation (Server-Side)
- File: `app/(store)/cart/page.tsx`.
- After loading the current cart with `getCartForCurrentSession()`:
  - If `cart` is `null` or `cart.items.length === 0`, skip stock validation.
  - Otherwise, build `itemsToValidate` from the cart:
    - `itemsToValidate = cart.items.map(item => ({ productId: item.productId, selectedVariantItemIds: item.selectedVariantItemIds, quantity: item.quantity }))`.
  - Import `validateStockAvailability` from `@/lib/product/product.service-stock` and call it:
    - `const stockValidation = await validateStockAvailability(itemsToValidate);`
  - Handle technical failures:
    - Wrap the call in `try/catch`.
    - On error, construct a `ToastErrorPayload` via `buildErrorPayload(error, { method: 'GET', url: 'service:product:validateStockAvailability' })`.
    - Surface this via `<ErrorToastHandler error={stockError} />` to follow the global “no silent errors” rule.
  - On success, derive a UI-friendly structure:
    - `stockValidation.available` – boolean indicating if all items are satisfiable.
    - `stockValidation.insufficientItems` – array entries of `{ productId, variantKey, requested, available }`.
    - Build a lookup map keyed by `(productId, variantKey)`:
      - Example: `const stockIssuesByLineKey: Record<string, { requested: number; available: number }>`.
      - Line key format: `${productId}|${variantKey}` where `variantKey` is `getVariantCombinationKey(selectedVariantItemIds)`.
  - Pass this map and the `available` flag down to the client component:
    - Extend `<CartPageContent />` props with `stockIssuesByLineKey` and `isStockValid`.

### 2.3 Checkout API Behavior (No Business Change, Just Documentation)
- File: `app/api/checkout_sessions/route.ts`.
- Keep the existing backend stock guard:
  - Before creating a Stripe session, the route already calls `validateStockAvailability(itemsToValidate)` and, if `!stockValidation.available`, returns:
    - `status: 400`
    - Body: `{ error: 'Insufficient stock', insufficientItems: [...] }`
- Document this contract explicitly so the cart UI can:
  - Expect `400` with `insufficientItems` for stock problems.
  - Treat other non-2xx statuses as technical failures.
- (Optional refactor) Extract the `itemsToValidate` building logic into a small helper within this route to keep behavior aligned with the cart page server-side validation.

---

## 3. Frontend Cart Page Plan

### 3.1 Extend `CartPageContent` Props
- File: `app/(store)/cart/components/CartPageContent.tsx`.
- Extend `CartPageContentProps` to include:
  - `stockIssuesByLineKey: Record<string, { requested: number; available: number }>` – derived from server validation.
  - `isStockValid: boolean` – true when no insufficient items are present.
- Compute a stable line key per cart item inside the component:
  - Use the same combination key logic as the backend:
    - Import `getVariantCombinationKey` from `@/lib/product/product.utils`.
    - `const variantKey = getVariantCombinationKey(item.selectedVariantItemIds);`
    - `const lineKey = \`\${item.productId}|\${variantKey}\`;`
  - Use `lineKey` both for list `key` props and to look up stock issues.

### 3.2 Visual Indicators for Insufficient Stock
- For each rendered cart line:
  - Look up `const stockIssue = stockIssuesByLineKey[lineKey];`.
  - If present, show a clear warning block near the quantity control or below the product description:
    - Example content:
      - “This product has not this much count. There is only **{available}** left. Please adjust the count.”
    - Style with a subtle warning treatment:
      - Use storefront tokens (e.g., text in `--storefront-sale-text` or another accent, background using `--storefront-bg-subtle`, border using `--storefront-border`).
  - Optionally include a small helper line: “Requested: {requested}, Available: {available}.”
- Ensure lines for products that are no longer available (where `productsById[productId] === null`) remain clearly marked as unavailable alongside any stock messaging if applicable.

### 3.3 Quantity Control Constraints
- For items with a `stockIssue`:
  - Prevent increasing quantity beyond the available stock:
    - Disable the “+” button when `item.quantity >= stockIssue.available` (for tracked items).
  - Allow the user to decrement quantity or remove the item to resolve the issue.
- For items without explicit stock tracking (no entry in `stockIssuesByLineKey`):
  - Keep current behavior (no additional client-side constraint).
- After an update (via `updateItem` or `removeItem`), rely on `StorefrontCartProvider` to refresh cart state from `/api/storefront/cart`.
  - On subsequent page visits or full reloads, the server-side validation in `CartPage` will recompute `stockIssuesByLineKey`.

### 3.4 Summary Section and Checkout Gating Flag
- In the summary section (where subtotal and total items are displayed):
  - When `!isStockValid`, show a compact warning text above or near the checkout button:
    - For example: “Some items exceed available stock. Please adjust quantities before checkout.”
  - Derive a boolean flag for checkout:
    - `const hasStockIssues = !isStockValid;`
  - Pass `hasStockIssues` into the checkout button component as a new prop (see 4.1).

---

## 4. Checkout Button & Toast Behavior

### 4.1 Prop-Driven Guard on Client
- File: `app/(store)/cart/components/CheckoutButton.tsx`.
- Extend `CheckoutButton` to accept:
  - `hasStockIssues: boolean` – if `true`, we know from server-side validation that at least one cart line is oversubscribed.
  - (Optional) `firstStockIssue?: { productId: string; requested: number; available: number }` – for a more specific message.
- Convert `CheckoutButton` to use the toast system instead of `alert`:
  - Import `useToast` from `@/components/ui/Toast`.
  - Replace `alert(...)` and `console.error`-only flows with `showToast(...)` calls that include full `status`, `body`, `url`, and `method`.
- In `handleCheckout`:
  - Before calling `/api/checkout_sessions`, check `hasStockIssues`:
    - If `true`, **do not** call the API.
    - Instead, immediately show a toast:
      - Message: `"This product has not this much count. There is only this much left. Please adjust the count."`
      - Type: `'error'`.
      - Details:
        - `status: 400`
        - `body`: include `firstStockIssue` plus any additional contextual information.
        - `url: '/api/checkout_sessions'`
        - `method: 'POST'`
    - This satisfies “only after reducing its count will they be able to go the checkout” at the UI layer.

### 4.2 Handling Backend Stock Errors
- Keep the backend as the ultimate source of truth in case stock changes between page render and click:
  - After POSTing to `/api/checkout_sessions`, parse the response:
    - If `response.ok` and response JSON has `url`, proceed to redirect as today.
    - If `response.status === 400` and response body has `error === 'Insufficient stock'` with `insufficientItems`:
      - Extract the first insufficient item:
        - `const { available } = insufficientItems[0];`
      - Show the same toast message:
        - `"This product has not this much count. There is only this much left. Please adjust the count."`
      - Include the full response payload in `details.body` for debugging.
      - Optionally trigger a cart refresh via `StorefrontCartProvider.refreshCart()` to re-sync quantities.
    - For other non-OK statuses:
      - Use a generic error toast:
        - E.g., `"Failed to start checkout"` with `status`, `body`, `url`, and `method`.
- Remove all `alert(...)` usage to align with `agents/frontend.md` (no browser alerts, use toasts instead).

---

## 5. Testing Plan

### 5.1 Backend / Route Tests
- File: `test/integration/checkout.test.ts`.
- Add scenarios that:
  - Mock `validateStockAvailability` to return `{ available: false, insufficientItems: [...] }`.
  - Assert that `/api/checkout_sessions` returns `status 400` with the expected error payload.
  - Confirm that when `available: true`, behavior remains unchanged.

### 5.2 Cart Page Validation (Server-Side)
- Add unit-level tests (or lightweight integration tests) for a new helper (if introduced) that builds `itemsToValidate` from a `Cart` and interprets `validateStockAvailability` results.
- Ensure that:
  - Empty carts skip validation.
  - Mixed carts correctly flag only oversubscribed lines.

### 5.3 Frontend / Client Behavior
- Add React component tests for `CartPageContent` (if test infrastructure for components exists) to verify:
  - Lines with stock issues render the warning message and constrained quantity controls.
  - Summary section shows the global warning when `hasStockIssues` is `true`.
- Add tests for `CheckoutButton` to ensure:
  - With `hasStockIssues === true`, `handleCheckout` short-circuits and only shows the toast.
  - When the API returns a `400` insufficient stock response, the toast is shown with the correct message and details.

---

## 6. Implementation Order
1. Wire server-side cart stock validation into `app/(store)/cart/page.tsx`, returning `stockIssuesByLineKey` and `isStockValid`.
2. Extend `CartPageContent` to render per-line stock warnings, constrain quantity controls, and compute `hasStockIssues` for checkout.
3. Update `CheckoutButton` to accept `hasStockIssues`, remove `alert`, and integrate with `useToast` for all error flows, including backend stock errors.
4. Adjust `/api/checkout_sessions` tests to cover insufficient-stock responses and keep contract stable.
5. Add/extend frontend tests around cart page and checkout button behavior as needed.
6. Perform manual QA:
   - Add items to cart at or below stock, verify checkout proceeds.
   - Reduce product stock in admin so cart quantity is now too high, reload cart:
     - Confirm line-level warning and disabled increment.
     - Confirm checkout is gated and shows the specified toast until quantity is reduced.

