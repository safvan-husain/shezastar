# SSB Installation Service — Implementation Plan

## Goal
When a customer selects an installation service option (e.g. “At store” / “At home”) on the product page:
- The selection is persisted on the cart item and then on the order.
- Pricing is computed server-side (tamper-resistant) and included in cart subtotal + Stripe checkout.
- Admin can see the selected service on the order details page (per item).
- No API/data-fetching errors are swallowed; surface failures via the existing toast system.

## Current Behavior (confirmed)
- `app/(store)/product/components/ProductDetails.tsx` tracks `installationOption` + `addOnPrice` locally, but **does not send it** to cart when clicking “Add to cart”.
- Cart backend computes `unitPrice` from base/offer + variant delta only; no installation add-on is stored.
- Buy Now computes `unitPrice` client-side by adding `addOnPrice` (not tamper-resistant) and does not persist the chosen option on the order.
- Admin order details render only `productName`, `variantName`, `quantity`, `unitPrice` with no installation metadata.

## Desired Data Model
### Cart item
Add installation fields to cart items:
- `installationOption`: `'none' | 'store' | 'home'`
- `installationAddOnPrice`: number (computed server-side, derived from product.installationService config at time of add/update)

### Order item
Persist the same fields on order items:
- `installationOption`
- `installationAddOnPrice`

> Note: Keep `unitPrice` as the final computed per-unit price including variant delta + installation add-on so the Stripe line items remain consistent with the stored order.

## API Contract Changes
### Storefront cart mutation payloads
Extend `POST /api/storefront/cart` and `PATCH /api/storefront/cart` payloads with:
- `installationOption?: 'none' | 'store' | 'home'`

Do **not** accept `installationAddOnPrice` from the client; compute it on the server.

### Buy Now checkout payload
Extend `POST /api/checkout_sessions` “buy now” payload item shape to include:
- `installationOption?: 'none' | 'store' | 'home'`

Server should compute the final `unitPrice` from product data + variants + installation option.

## Pricing Rules
- If product has `installationService.enabled === false` or missing: force `installationOption = 'none'`, `installationAddOnPrice = 0`.
- If option is `'store'`: add `product.installationService.inStorePrice ?? 0`.
- If option is `'home'`: add `product.installationService.atHomePrice ?? 0`.
- Any invalid/missing option defaults to `'none'`.

## Item Identity / Merging Rules (important)
Cart “same item” matching currently keys by:
- `productId` + normalized `selectedVariantItemIds`

Update this matching to also include:
- `installationOption`

So the same product+variants with different installation option becomes separate cart lines.

## Implementation Steps (files to touch)

### 1) Types & schemas (shared contracts)
- [ ] `lib/cart/cart.schema.ts`
  - Add `InstallationOptionSchema` (`z.enum(['none','store','home'])`).
  - Extend `CartItemSchema` to include `installationOption` and `installationAddOnPrice`.
  - Extend `AddToCartSchema` / `UpdateCartItemSchema` to accept `installationOption` (optional).
- [ ] `lib/cart/model/cart.model.ts` (and any cart DTO mapping)
  - Add fields to `CartItemDocument`/`CartItem` and ensure `toCart()` maps them.
- [ ] `lib/order/model/order.model.ts`
  - Add fields to `OrderItemDocument`/`OrderItem` and ensure `toOrder()` maps them.
- [ ] `lib/order/order.schema.ts`
  - Extend `OrderItemSchema` with installation fields.

Acceptance criteria:
- API responses include installation fields; missing values default to `none/0` for old records.

### 2) Cart backend pricing + persistence
- [ ] `lib/cart/cart.service.ts`
  - Update `computeUnitPrice()` to accept `installationOption` and compute add-on server-side from `getProduct(productId)`.
  - Store `installationOption` + `installationAddOnPrice` on `CartItemDocument`.
  - Update `findItemIndex()` (or equivalent) to include `installationOption` in the match key.
  - Ensure `subtotal` recalculation includes installation add-on via `unitPrice` (verify where subtotal is computed; update if needed).
- [ ] `lib/cart/cart.controller.ts`
  - Parse and pass through `installationOption` for add/update actions.

Acceptance criteria:
- Adding/updating a cart item with installation option results in persisted option + correct server-computed `unitPrice`.
- Cart subtotal reflects installation add-on * quantity.

### 3) Storefront cart client integration
- [ ] `components/storefront/StorefrontCartProvider.tsx`
  - Update `addToCart` / `updateItem` signatures to accept `installationOption`.
  - Include it in request bodies.
  - Keep toast error surfacing via `handleApiError` (do not swallow errors).
- [ ] `app/(store)/product/components/ProductDetails.tsx`
  - When clicking “Add to cart”, pass `installationOption`.
  - Ensure UI still shows selected add-on price.

Acceptance criteria:
- Selecting installation service and adding to cart preserves the selection when viewing cart (after refresh).

### 4) Cart UI display (storefront)
- [ ] `app/(store)/cart/components/CartPageContent.tsx` (or wherever cart items are rendered)
  - Display installation option label per cart line when not `none`.
  - If there’s a per-item breakdown area, show “Installation: +AED …” (derived from `installationAddOnPrice` or `unitPrice` delta if needed).

Acceptance criteria:
- Customer can see which installation service is selected in the cart and its cost impact.

### 5) Checkout session creation (Stripe)
- [ ] `app/api/checkout_sessions/route.ts`
  - Buy Now flow: stop trusting client `unitPrice`. Instead:
    - Accept `productId`, `quantity`, `selectedVariantItemIds`, `installationOption`.
    - Compute unit price server-side using the same logic as cart (ideally share a helper).
    - Include installation option in metadata (for order creation and admin visibility).
  - Standard cart flow should already use cart `unitPrice` once cart backend is updated.

Acceptance criteria:
- Stripe checkout total includes installation add-on (both cart checkout and buy-now).
- Payload tampering cannot reduce the installation add-on price.

### 6) Webhook → order creation persistence
- [ ] `app/api/webhooks/route.ts`
  - When building `orderItems`, populate `installationOption` + `installationAddOnPrice`:
    - Standard cart flow: copy from cart items.
    - Buy Now flow: read from `metadata.buyNowItems` and/or compute from product (preferred).
  - Keep fallback behavior for missing metadata but default `installationOption = 'none'`.

Acceptance criteria:
- Stored orders contain installation option/add-on per item.

### 7) Admin order details visibility
- [ ] `app/manage/orders/[id]/page.tsx`
  - In the “Items” list, display installation service when present:
    - e.g. `Installation: At store (+10.00 AED)` / `At home (+25.00 AED)`
  - Ensure UI remains readable in admin theme tokens (`--bg-*`, `--text-*`, `--border-*`).

Acceptance criteria:
- Admin can immediately see the selected installation service per item on order details.

## Edge Cases / Backward Compatibility
- Existing carts/orders without fields should render as:
  - `installationOption: 'none'`
  - `installationAddOnPrice: 0`
- If product installation is disabled after item was added:
  - Keep the stored selection + price on the cart item/order item to preserve what the customer purchased.

## Verification Checklist (manual)
- [ ] Product page: selecting “At store” and adding to cart → cart shows the option.
- [ ] Cart subtotal increases by add-on * quantity.
- [ ] Checkout (cart) creates Stripe session with correct total.
- [ ] Buy Now checkout also charges correct amount and is tamper-resistant.
- [ ] After successful payment, admin order details show installation selection per item.
- [ ] Any API failure produces a toast with `status/body/url/method` (no silent failures).

