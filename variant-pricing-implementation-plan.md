# Variant Pricing & Stock Plan

## Goals

- Represent per-variant (combination) pricing alongside stock in `product.variantStock`.
- Make the “Variants” step work in terms of price deltas (relative to base/offer price), not standalone prices.
- Add pricing controls to the “Variant stock” step so stock and price are edited together, per combination.
- Ensure storefront, cart, and checkout all use the same per-combination pricing model.

---

## Data Model Changes

1. **Extend `VariantStock` with pricing**
   - File: `lib/product/product.schema.ts`.
   - Update `VariantStockSchema` to include a pricing field next to `stockCount`, for example:
     - `priceDelta?: number` — amount added to `(offerPrice ?? basePrice)` for this exact combination.
   - Semantics:
     - Effective unit price for a combination = `(offerPrice ?? basePrice) + (priceDelta ?? 0)`.
     - If `priceDelta` is `undefined`, treat it as `0` (no change from base/offer price).

2. **Mirror schema changes in models**
   - File: `lib/product/model/product.model.ts`.
   - Update `ProductDocument` and `Product` interfaces so `variantStock` entries include `priceDelta?: number`.
   - Ensure `toProduct` / `toProducts` carry `priceDelta` through from MongoDB to the API-facing model.

3. **Legacy pricing fields**
   - No legacy variant-level pricing (`priceModifier`) is preserved. All effective pricing should flow through `variantStock.priceDelta` going forward.

4. **Optional migration strategy**
   - For existing products created before this change:
     - Option A (simple): leave `priceDelta` empty; existing products behave as base/offer-only until you explicitly configure per-combination pricing.
     - Option B (richer): write a one-off script that derives `priceDelta` for each combination from whatever previous pricing rules you used and populates `variantStock.priceDelta`.

---

## Admin UI – Variants Step (Delta-Oriented)

1. **Clarify “delta price” semantics**
   - Files: `app/(admin)/products/components/steps/VariantsStep.tsx`, `app/(admin)/products/components/VariantSelector.tsx`.
   - The “Price Delta (optional)” input acts purely as a delta conceptually:
     - Label: “Price Delta (preview / defaults)”.
     - Help text: “Amount added to the base/offer price when this variant is involved. Final prices per combination are set in the stock step.”

2. **Scope of delta in this step**
   - Keep a single `priceDelta` per variant **type** for now (no per-item deltas needed to satisfy the current requirement).
   - Purpose:
     - Used as a default/suggestion when we later create per-combination `priceDelta` entries in the stock step.
     - Used only for admin preview (e.g., in `ReviewStep`) until per-combination values exist.

3. **Admin preview update**
   - File: `app/(admin)/products/components/steps/ReviewStep.tsx`.
   - While per-combination `priceDelta` is not yet defined, continue to use the variant-level delta for preview:
     - Effective preview price = `(offerPrice ?? basePrice) + sum(activeVariantType.priceDelta)`.
   - Once per-combination `priceDelta` is available, the preview should prefer:
     - `variantStock.priceDelta` for the exact combination (if set),
     - else fall back to the variant-level delta logic.

---

## Admin UI – Variant Stock + Price Step

1. **Extend `VariantStockStep` props**
   - File: `app/(admin)/products/components/steps/VariantStockStep.tsx`.
   - In `ProductForm`, pass into `VariantStockStep`:
     - `basePrice` and `offerPrice` (as numbers, parsed from the string state).

2. **Add per-combination pricing UI**
   - For each generated `combinations` row:
     - Keep existing “Stock” input, bound to `stockValues[combo.key]` → `variantStock[].stockCount`.
     - Add a numeric “Price Delta” input:
       - Bound to a new `priceDeltaValues[combo.key]`.
       - Initialize from:
         - existing `variantStock` entry’s `priceDelta` if present,
         - else the sum of relevant variant-level deltas (optional, for good defaults),
         - else `0`.
     - Show a read-only “Effective Price” label:
       - `effective = (offerPrice || basePrice) + (priceDeltaValues[combo.key] || 0)`.
       - Render as formatted currency for admin clarity.

3. **Persisting `priceDelta`**
   - When building `newVariantStock` in `VariantStockStep`, include:
     - `variantCombinationKey`,
     - `stockCount`,
     - `priceDelta` (from `priceDeltaValues`).
   - `ProductForm` should submit `variantStock` with both `stockCount` and optional `priceDelta` to the API.

---

## Pricing Logic (Backend & Storefront)

1. **Central helper for combination price**
   - File: `lib/product/product.utils.ts` (or a new dedicated module).
   - Add a function, e.g.:
     - `getCombinationPrice(product: Product, selectedVariantItemIds: string[]): number`.
   - Behavior:
     - Compute `key = getVariantCombinationKey(selectedVariantItemIds)`.
     - Find `stockEntry` in `product.variantStock` where `variantCombinationKey === key`.
     - Base price = `product.offerPrice ?? product.basePrice`.
     - If `stockEntry?.priceDelta` is defined:
       - `return base + stockEntry.priceDelta`.
     - Else:
       - Option A (simple): `return base` (no delta).
       - Option B (optional): fall back to sum of variant-level deltas for those items.

2. **Use helper in server flows**
   - Cart service (add/update item):
     - When computing `unitPrice` for a cart line, call `getCombinationPrice(product, selectedVariantItemIds)`.
   - Checkout session creation:
     - Ensure that `unit_amount` for Stripe is based on the same combination price, not only `basePrice/offerPrice`.
   - Any reporting or webhook logic that relies on per-item price should use the same helper or store the already-computed `unitPrice` from the time of purchase.

3. **Storefront product page**
   - File: `app/(store)/product/components/ProductDetails.tsx`.
   - When the user selects variants and we know `selectedVariantItemIds`:
     - Compute the effective price on the client from `product.basePrice`, `product.offerPrice`, and `product.variantStock[].priceDelta` (mirroring `getCombinationPrice`).
     - Display this price to the user in real time.
   - The price used for cart/checkout remains authoritative from the backend; the client-side logic is for display only.

---

## API & Validation Updates

1. **Product create/update schemas**
   - Files: `lib/product/product.schema.ts`, product API routes under `app/api/products`.
   - Ensure `CreateProductSchema` and `UpdateProductSchema` accept `variantStock[].priceDelta`.
   - Validate `priceDelta` as a number (can be negative for discounts).

2. **TypeScript types**
   - Update any local admin types (e.g., in `ProductForm`, `VariantsStep`, `VariantStockStep`) to include `priceDelta` where they model `variantStock`.

3. **Tests**
   - Add/adjust tests for:
     - A product with no `priceDelta` (price = base/offer).
     - A product with per-combination `priceDelta` (price = base/offer + delta).
     - Mixing variant-level deltas and per-combination deltas, ensuring the per-combination value wins when present.

---

## Rollout & Compatibility

1. **Safe rollout**
   - Initially treat `priceDelta` as optional to avoid breaking existing records.
   - Gate any new UI parts that depend on it behind schema presence checks so older products still load.

2. **Migration (optional but recommended)**
   - For key products, backfill `variantStock.priceDelta` manually or via script to match current pricing expectations.
