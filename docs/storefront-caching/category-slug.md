# Category Page (`/category/[slug]`)

## What users expect

- Fast category landing with product grid
- Filtering/sorting may be dynamic; the base category should be fast and cacheable

## Best default: PPR + cached category + optionally dynamic refinements

### With Cache Components (PPR)

**Static shell**:
- Layout, header, category title skeletons, filter UI skeleton

**Cached shared content (`use cache`)**:
- Category metadata: `cacheTag(\`category:${slug}\`)`, `cacheLife('days')`
- Default product listing for the category (no user-specific filters): `cacheTag(\`category-products:${slug}\`)`, `cacheLife('hours'|'days')`

**Dynamic islands (Suspense)**:
- Personalized blocks (“recommended for you”) → `use cache: private` (per-user)
- Real-time inventory/price widgets if required → either:
  - Keep uncached (`fetch` with `cache: 'no-store'`) inside a Suspense boundary, or
  - Cache briefly (`cacheLife('minutes')`/`'hours'`) and revalidate by tag when inventory changes

### Pre-generating popular categories

If you want the hottest categories to be static from build:
- Use `generateStaticParams` to return a **partial** list of category slugs (top N).
- Leave the rest to generate on first request (default `dynamicParams = true`).

This improves cold-start performance for the most common routes without exploding build time.

## ISR vs SSR vs PPR

- **PPR (recommended):** base category page is cached/prerendered, while optional dynamic refinements render at request time.
- **ISR (alternative without Cache Components):** good if category page is “mostly static” and can be revalidated on a timer. Use `revalidatePath(\`/category/${slug}\`)` or `revalidateTag(...)` after admin updates. (review - use this one)
- **SSR:** only needed if the page’s main content depends on runtime APIs or user-specific query params; prefer to isolate those parts into Suspense islands.

## Invalidation strategy

- Admin changes category (name/slug/hero) → `updateTag(\`category:${slug}\`)` and `updateTag('categories')`
- Admin changes product assignment in category → `updateTag(\`category-products:${slug}\`)`
- Product update that affects all categories it appears in → either:
  - Invalidate `product:{id}` and rely on refetching, or
  - Also invalidate each affected `category-products:{slug}` if you denormalize listings

## Pitfalls

- If filtering uses `searchParams`, the route becomes dynamic unless you push that work behind Suspense; keep the “default view” cached and treat filtering as a dynamic refinement.
- Avoid giant cache keys from complex filter objects; caching highly-unique combinations yields low hit rates.

