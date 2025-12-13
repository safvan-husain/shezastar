# Category Index (`/category`)

## What users expect

- Near-instant list of categories
- Stable content; rarely changes compared to product inventory

## Best default: fully cached + prerenderable

### With Cache Components (PPR) (review - use this)

- Render the page as a static shell with a cached category list:
  - `use cache` + `cacheLife('days'|'weeks')`
  - `cacheTag('categories')`
- Invalidate on admin updates:
  - `updateTag('categories')` from the category mutation Server Action

### Without Cache Components (no PPR)

Two good choices:

- **Static rendering + fetch caching** (default behavior unless you opt out), and optionally add:
  - `fetch(..., { next: { revalidate: 86400 } })` for daily refresh
- **ISR (route-level `export const revalidate`)** when you want a simple global policy:
  - Pros: very simple mental model
  - Cons: coarser invalidation than tags; if anything changes you may regenerate more than necessary

## SSR vs ISR tradeoffs

- **SSR** only if you need runtime APIs (usually unnecessary for category index).
- **ISR or `use cache`** is preferred: categories are shared across users and can be invalidated on demand when admins change them.

## Pitfalls

- Don’t use `searchParams` for filtering on this route if you want it fully static; prefer a dedicated `/category/[slug]` page for parameterized category pages.
- Always surface data errors to the UI (toast) instead of silently rendering an empty list.

