# Orders (`/orders`)

## What users expect

- Accurate per-user order history
- It’s acceptable to show a skeleton while loading

## Best default: PPR + per-user data island

### With Cache Components (PPR)

**Static shell**:
- Layout, table skeletons, filters UI

**Per-user orders list**:
- Load behind `<Suspense>`; it will be request-time because it depends on session cookies.
- If fetching orders is expensive and users revisit often, consider `'use cache: private'`:
  - `cacheLife('minutes')` or a small custom profile
  - Tag by user: `cacheTag(\`orders:${userId}\`)` and optionally per-order `cacheTag(\`order:${orderId}\`)`

### Without Cache Components

- SSR/dynamic is typical (user-specific).
- Cache shared reference data (status labels, help content), but not the order list across users.

## ISR vs SSR tradeoffs

- **ISR** is usually not appropriate for per-user lists.
- Use **private caching** if you need speed without cross-user leakage.

## Invalidation strategy

- After a new order is created / status changes:
  - If it’s a user-driven action (Server Action), `updateTag(\`orders:${userId}\`)` for immediate visibility.
  - If it’s an admin action or webhook, `revalidateTag(\`orders:${userId}\`, 'max')` may be sufficient (refreshes on next visit).

## Pitfalls

- Be careful with stale order status; choose short cacheLife or don’t cache if UX requires real-time state.

