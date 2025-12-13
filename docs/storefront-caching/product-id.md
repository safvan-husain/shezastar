# Product Detail (`/product/[id]`)

## What users expect

- Fast product content (images, description, specs)
- Price/stock might change more frequently than description
- Personalized blocks (recommendations, recently viewed) can stream in

## Best default: split the page by data volatility

### With Cache Components (PPR)

**Static shell**:
- Page layout, hero image container, skeletons for price/stock, skeletons for recommendations

**Cached shared content (`use cache`)** (stable or moderate change rate): (if possible revalidate once admin update this product)
- Product core data (name, description, media): `cacheTag(\`product:${id}\`)`, `cacheLife('days')`
- Related products that are editorially curated: `cacheTag(\`product-related:${id}\`)`, `cacheLife('days'|'weeks')`

**Higher-churn shared data** (choose one):
- If price/stock changes a few times per day: keep it cached with shorter life:
  - `cacheTag(\`product-price:${id}\`)`, `cacheLife('hours'|'minutes')`
- If it must be real-time: render request-time inside Suspense:
  - `fetch(..., { cache: 'no-store' })` in a dynamic component (use this or revalidate cache once admin update the product)

**Personalized blocks**:
- Recommendations (“for you”) can use `'use cache: private'` so it can still be cached/prefetched per user without leaking between users.

### Without Cache Components (no PPR)

Two typical models:

- **ISR:** `export const revalidate = ...` for the entire page
  - Pros: simple, great TTFB after cached
  - Cons: forces a single freshness policy; if you need real-time stock, you’ll end up SSR anyway
- **Dynamic rendering (SSR) with cached data fetches:**
  - Pros: you can still cache product data via `fetch(..., { cache: 'force-cache' })` / `next.revalidate`
  - Cons: the Full Route Cache is skipped when dynamic APIs are used; more server rendering cost

## Invalidation strategy (admin-driven)

When an admin changes a product:
- Use `updateTag(\`product:${id}\`)` to make the next visit block and fetch fresh content (read-your-own-writes).
- Also update any list tags the product appears in (e.g. featured blocks):
  - `updateTag('featured-products')` or `updateTag(\`category-products:${slug}\`)` as needed.

For webhook-driven updates (e.g. external inventory system): (not applicale right now)
- Prefer `revalidateTag(\`product-price:${id}\`, 'max')` to avoid stampedes; content updates on next visit.

## Pitfalls

- Don’t read `cookies()` in a shared `use cache` scope; pass session values as arguments or use `'use cache: private'`.
- Keep cache tags specific to avoid invalidating too broadly (e.g. `product:123` vs `products`).

