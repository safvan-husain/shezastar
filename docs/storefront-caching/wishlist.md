# Wishlist (`/wishlist`)

## What users expect

- Accurate per-user wishlist
- Content is not as time-sensitive as cart but must not leak between users

## Best default: PPR + per-user caching (optional)

### With Cache Components (PPR)

**Static shell**:
- Layout, empty-state skeletons, product card skeletons

**Per-user data**:
- Load wishlist in a request-time component inside `<Suspense>`. (use this island approach).
- If wishlist reads are expensive, use `'use cache: private'`:
  - `cacheLife('minutes'|'hours')` (based on how frequently users change it)
  - Optional `cacheTag(\`wishlist:${userId}\`)` if you need explicit invalidation hooks

### Without Cache Components

- Typically SSR/dynamic due to auth/session cookies.
- Cache shared product card data separately (Data Cache), but don’t cache the wishlist membership list across users.

## ISR vs SSR tradeoffs

- **SSR** for membership list; **cached** product summaries for rendering the cards.
- **PPR** improves perceived performance: users see the shell immediately while the list streams in.

## Invalidation strategy

- On wishlist mutation:
  - If using Server Actions, `updateTag(\`wishlist:${userId}\`)` ensures immediate consistency.
  - Otherwise, use `revalidateTag(..., 'max')` for eventual consistency (less common for direct user actions).

## Pitfalls

- Keep cache keys small; don’t include large arrays of IDs as cache key inputs.
- Surface API failures via toast with full body/status.

