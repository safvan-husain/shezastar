# Home (`/`)

## What users expect

- Fast initial paint (hero + category navigation)
- “Fresh enough” catalog highlights (featured products, banners)
- Small personalized hints (cart count, user menu) are acceptable to load after the shell

## Best default: Cache Components (PPR)

### Static shell (prerendered)

- Header, footer, navigation
- Marketing copy, layout chrome, skeletons for dynamic blocks

### Cached shared content (`use cache`)

Use `use cache` for data that is the same for all users and changes only when admins update content:

- Hero banners / custom cards
- Featured product IDs + summary cards
- Category list / top-level navigation taxonomy

Recommended patterns:

- Wrap each “content block” in a cached function/component:
  - `cacheLife('days')` or `cacheLife('hours')` depending on how often admins change it
  - `cacheTag('hero-banners')`, `cacheTag('featured-products')`, `cacheTag('categories')`
- On admin mutation (Server Action), call:
  - `updateTag('hero-banners')`, `updateTag('featured-products')`, etc. for immediate “read-your-own-writes”
- On webhook/Route Handler, call:
  - `revalidateTag('featured-products', 'max')` for stale-while-revalidate behavior

### Request-time islands (wrapped in `<Suspense>`)

Keep runtime-dependent UI out of the shell:

- Cart count / mini-cart preview (depends on session cookie)
- “Welcome back” header state (depends on cookies)

These must be behind `<Suspense>` if they read runtime APIs (`cookies()`, `headers()`, `searchParams`).

## ISR vs SSR vs PPR for this page

- **PPR (recommended):** best of both worlds; most content is prerendered/cached while cart/auth islands stream at request time. (use this)
- **ISR (alternative, if Cache Components is off):** good when the whole page can be treated as mostly static and revalidated on a timer (or `revalidatePath('/')`).
- **SSR (not ideal):** makes the whole home page render per request if you read runtime APIs at the top level; avoid by isolating runtime work behind Suspense boundaries.

## Tradeoffs / pitfalls

- If you put `cookies()` or `searchParams` inside a `use cache` scope, it will error (use `use cache: private` or pass values in as arguments from a dynamic wrapper).
- Over-tagging can cause broad invalidations; prefer specific tags (e.g. `featured-products` vs `products` for all catalog).
- Remote cache (`'use cache: remote'`) only makes sense if your shared cached blocks are being recomputed too often due to in-memory eviction or multi-instance deployments.

