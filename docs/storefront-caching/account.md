# Account (`/account`)

## What users expect

- Per-user profile details, addresses, preferences
- Fast initial layout; content can stream

## Best default: PPR + request-time account data

### With Cache Components (PPR)

**Static shell**:
- Layout, tabs, skeletons

**Per-user data**:
- Account reads will likely require `cookies()` (session), which makes them request-time.
- Use one of:
  - **Dynamic + Suspense** (simple, always correct)
  - **`'use cache: private'`** (if you want caching/prefetch and can tolerate short-lived staleness)

If you use `'use cache: private'`, keep lifetimes short and ensure sensitive data is never shared.

### Without Cache Components

- This route is typically SSR/dynamic.
- Still cache non-personalized reference data (countries list, static settings descriptors).

## ISR vs SSR tradeoffs

- **ISR is not appropriate** for personalized account pages.
- **PPR** is ideal: instant shell + streaming user data.

## Invalidation strategy

- After profile/address update (Server Action):
  - `updateTag(\`account:${userId}\`)` if you tag the account read
  - Consider `cookies.set` invalidation effects: setting/deleting cookies in a Server Action invalidates the Router Cache (auth transitions)

## Pitfalls

- Don’t mix runtime APIs inside a shared `use cache` scope; use a dynamic wrapper and pass arguments, or use `'use cache: private'`.

### Review
use `use cache private`

