# Storefront Caching Playbook (per page)

This folder documents recommended caching + rendering strategies for each **storefront** route under `app/(store)/...`.

These recommendations are based on Next.js docs for:
- Cache Components / Partial Prerendering (PPR): `/docs/app/getting-started/cache-components`
- Caching overview + interactions: `/docs/app/guides/caching`
- ISR: `/docs/app/guides/incremental-static-regeneration`
- `use cache`, `cacheLife`, `cacheTag`, `updateTag`, `revalidateTag`: `/docs/app/api-reference/...`

## Prerequisite: enable Cache Components (PPR)

Most pages below assume Cache Components is enabled:

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

When `cacheComponents` is enabled, Route Segment Config options like `export const revalidate = ...` are disabled (use `cacheLife` instead).

## Quick decision rules

1. **Prefer Cache Components (PPR)** when you want “mostly static” pages that still have small dynamic islands (cart, auth, personalized blocks).  
   - Static shell is prerendered, dynamic islands render at request time behind `<Suspense>`.
2. **Use `use cache` + `cacheLife`** for shared, non-personalized data (catalog, categories, hero banners).  
   - Pair with `cacheTag` and invalidate with `updateTag` (Server Actions) or `revalidateTag(..., 'max')` (webhooks/Route Handlers).
3. **Use `'use cache: private'`** for per-user content that still benefits from caching/prefetch (recommendations, account summary), but never shared between users.
4. **Use ISR (route `export const revalidate = ...`)** only if you are *not* using Cache Components.  
   - With Cache Components enabled, prefer `cacheLife` instead of segment `revalidate` (segment config is disabled when `cacheComponents` is on).
5. **SSR / dynamic rendering** is unavoidable when you need runtime APIs (`cookies()`, `headers()`, `searchParams`) in the render path.  
   - With PPR, keep this dynamic work inside `<Suspense>` so the rest of the page stays fast.

## Storefront routes covered

- `/` → `home.md`
- `/category` → `category-index.md`
- `/category/[slug]` → `category-slug.md`
- `/product/[id]` → `product-id.md`
- `/cart` → `cart.md`
- `/wishlist` → `wishlist.md`
- `/account` → `account.md`
- `/account/register` → `account-register.md`
- `/orders` → `orders.md`
- `/checkout/success` → `checkout-success.md`
- `/checkout/cancel` → `checkout-cancel.md`

## Project rule: error surfacing

Never swallow data-fetching or API errors. Server Components should return typed error objects and delegate to a client-side `ErrorHandler` that triggers the toast system with `status`, full `body`, `url`, and `method` (per `agents/frontend.md`).
