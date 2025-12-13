# Cart (`/cart`)

## What users expect

- Accurate, per-user cart contents
- Fast navigation to this page (even if data streams in)

## Best default: PPR with dynamic cart island -> use this (reviewed)

### With Cache Components (PPR)

**Static shell**:
- Page layout, cart skeleton, checkout CTA skeletons

**Dynamic / per-user content**:
- Cart contents depend on session cookie → must be request-time.
- Options:
  1. **Dynamic + Suspense (most common):** keep cart retrieval in a component inside `<Suspense>`.
  2. **`'use cache: private'`:** if cart payload is expensive and you want short-lived per-user caching + runtime prefetch. (review - do not use this, use dynamic island)

If you use `'use cache: private'`, add an explicit `cacheLife(...)` and keep it short; cart data changes often.

### Without Cache Components

- This page is usually **SSR/dynamic** because it’s personalized.
- You can still cache non-personalized helpers:
  - Shipping methods list, tax rules, or static copy can be cached via Data Cache.

## ISR vs SSR tradeoffs

- **ISR is usually wrong here**: cart is user-specific, and serving cached HTML across users is not acceptable.
- Use **PPR** to keep the shell fast and isolate personalization to a dynamic island.

## Invalidation strategy (maybe we don't need it when using dynamic island (confirm it? and implement))

- After cart mutation (add/remove/change quantity):
  - Use `updateTag('cart')` only if you tag cart reads and you need immediate freshness within the same UX flow.
  - Otherwise, `router.refresh()` (client) can be used to refetch current route, but note it doesn’t invalidate Data/Full Route caches.

## Pitfalls

- Don’t silently “drop” cart errors; surface full API error details to toast.
- Avoid caching checkout totals too long if taxes/shipping depend on dynamic inputs.

