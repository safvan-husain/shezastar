# Storefront Caching Implementation (actionable)

This document is the “do exactly this” checklist to implement fast storefront loads using **Cache Components (PPR)** and aggressive server caching, while respecting your reviews:
- `/cart`: **use PPR + dynamic island**, **do not** use `'use cache: private'`
- `/category`: use **Cache Components (PPR)**
- `/category/[slug]`: prefer **ISR-style behavior** (time-based + on-demand revalidation; avoid runtime filtering)

References (Next.js docs used to derive this plan):
- Cache Components / PPR: `/docs/app/getting-started/cache-components`
- Caching interactions: `/docs/app/guides/caching`
- ISR + on-demand revalidation: `/docs/app/guides/incremental-static-regeneration`
- `use cache`, `cacheLife`, `cacheTag`, `revalidateTag`, `updateTag`: `/docs/app/api-reference/...`

---

## 0) Prerequisites (must do first)

### 0.1 Enable Cache Components

Edit `next.config.ts` and enable the flag:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

Notes:
- With `cacheComponents: true`, **Route Segment Config** like `export const revalidate = ...` is disabled; use `cacheLife(...)` inside `use cache` scopes instead.
- Cache Components requires Node.js runtime (don’t set `runtime = 'edge'` for cached routes).

### 0.2 Adopt a tag naming convention (used everywhere)

Use small, consistent tags so invalidation is predictable:

- Global settings:
  - `settings:hero-banners`
  - `settings:custom-cards`
  - `settings:featured-products`
- Catalog:
  - `catalog:products` (broad list)
  - `catalog:product:{id}`
  - `catalog:categories`
  - `catalog:category:{slugOrId}` (metadata)
  - `catalog:category-products:{slugOrId}` (the “grid” result)

### 0.3 Create a single “cached loaders” module

Add a server-only module (new) to centralize caching logic so pages stay clean:

- Create `lib/storefront/storefront-cache.ts` with exported async functions like:
  - `getHeroBannersCached()`
  - `getCustomCardsCached()`
  - `getFeaturedProductsCached()`
  - `getProductsCached({ limit })`
  - `getAllCategoriesCached()`
  - `getCategoryGridCached(slugOrId)`
  - `getProductCached(id)`
  - `getRelatedProductsCached(categoryIds, excludeProductId)`

Each loader should follow this structure:
- `'use cache'`
- `cacheTag(...)` using the convention above
- `cacheLife('hours'|'days'|'weeks'|'max')` (pick per data volatility)
- Call the *service layer directly* (prefer `lib/*/*.service.ts`) instead of `fetch('http://localhost:3000/api/...')`

Why: your current storefront pages use `fetch(..., { cache: 'no-store' })`, which opts out of the Data Cache and prevents route caching.

---

## 1) Global storefront layout refactor (required for PPR to work)

Right now `app/(store)/layout.tsx` makes every storefront route dynamic by eagerly loading session/cart/wishlist on the server.

### Goal
Keep the storefront **layout prerenderable** and move runtime/session-dependent work to the client.

### 1.1 Stop reading session/cart/wishlist in the server layout

Edit `app/(store)/layout.tsx`:
- Remove:
  - `getOrCreateStorefrontSession()`
  - `getCartForCurrentSession()`
  - `ensureWishlist(...)`
- Render your providers without server-fetched initial data (see next step).

### 1.2 Make providers support “no initial data” bootstrap

Update these client providers to accept optional initial values and bootstrap themselves via existing APIs:

- `components/storefront/StorefrontSessionProvider.tsx`
  - Change `initialSession: StorefrontSession` → `initialSession?: StorefrontSession | null`
  - On mount, call **POST** `/api/storefront/session` (you already have `refreshSession`) and set session state.
  - Expose `session: StorefrontSession | null` + `isReady` boolean so consumers can handle “bootstrapping”.

- `components/storefront/StorefrontCartProvider.tsx`
  - Change `initialCart: Cart | null` → `initialCart?: Cart | null`
  - On mount (or after session is ready), call `refreshCart()` to hydrate.

- `components/storefront/StorefrontWishlistProvider.tsx`
  - Keep as-is, but ensure it doesn’t assume session is immediately available (it already checks).

This is the key move that lets the server layout be static while cart/wishlist/auth hydrate client-side.

### 1.3 Make Navbar SSR-friendly and error-visible

`components/NavbarWrapper.tsx` currently:
- reads session server-side (dynamic)
- swallows category errors (logs + returns empty)

Change it so:
- It **only** loads categories via `getAllCategoriesCached()` (from your new cached loader module).
- It returns an error payload (not just console.error) and renders a client error handler to show a toast.
- Remove `getStorefrontSession()` and stop passing `isAuthenticated` as a prop.

Then update `components/Navbar.tsx` to derive auth state from `useStorefrontSession()` (client) instead of a server prop.

---

## 2) Per-page implementation

Below, “do this” steps reference the current code in `app/(store)/*`.

### 2.1 Home (`/`) — `app/(store)/page.tsx`

Current blockers:
- `fetchHeroBanners`, `fetchProducts`, `fetchCustomCards` all use `cache: "no-store"` and call internal API URLs.

Do:
- Replace the 3 fetchers with calls to cached loaders:
  - `getHeroBannersCached()` tagged `settings:hero-banners`, `cacheLife('days')`
  - `getCustomCardsCached()` tagged `settings:custom-cards`, `cacheLife('days')`
  - `getProductsCached({ limit: 200 })` tagged `catalog:products`, `cacheLife('hours')`
- Wrap featured products with caching too:
  - `getFeaturedProductsCached()` tagged `settings:featured-products`, `cacheLife('days')`
- Keep your existing toast error surfacing pattern (`ErrorToastHandler`) exactly as-is (don’t convert failures to empty UI silently).

Invalidate when admin changes:
- Hero banners change → `revalidateTag('settings:hero-banners', { expire: 0 })`
- Custom cards change → `revalidateTag('settings:custom-cards', { expire: 0 })`
- Featured products change → `revalidateTag('settings:featured-products', { expire: 0 })`
- Product edits that affect home grids → `revalidateTag('catalog:products', 'max')` (or `{ expire: 0 }` if you want immediate)

Where to wire invalidation:
- `app/api/admin/settings/hero-banners/route.ts` (POST) + `app/api/admin/settings/hero-banners/[id]/route.ts` (PUT/DELETE)
- `app/api/admin/settings/custom-cards/[cardKey]/route.ts` (already revalidates `/`; add tags too)
- `app/api/admin/settings/featured-products/route.ts` and `[id]/route.ts`

### 2.2 Category landing (`/category`) — `app/(store)/category/page.tsx`

Your review says “use PPR” here; the current page is static text only.

Two options (pick one):
- **Option A (minimal):** keep as-is (it’s already static and instant).
- **Option B (recommended):** show a category grid/list:
  - Load categories via `getAllCategoriesCached()` tagged `catalog:categories`, `cacheLife('days'|'weeks')`
  - Render a category list component (server or client), but keep the data load cached.

Invalidate when admin changes categories:
- Category create/update/delete → `revalidateTag('catalog:categories', { expire: 0 })`

Wire invalidation in:
- `app/api/categories/route.ts` (POST)
- `app/api/categories/[id]/route.ts` (PUT/DELETE)
- `app/api/categories/[id]/subcategories/route.ts` if it affects navigation tree

### 2.3 Category detail (`/category/[slug]`) — `app/(store)/category/[slug]/page.tsx`

Your review prefers “ISR-style” behavior:
- make the default category page **fully cacheable**
- avoid runtime filtering/sorting via `searchParams`
- update only when admin changes catalog

Current blockers:
- `fetchProducts(..., { cache: 'no-store' })`
- category tree loads uncached

Do:
- Replace `getAllCategories()` with `getAllCategoriesCached()`:
  - tag `catalog:categories`, `cacheLife('days'|'weeks')`
- Replace `fetchProducts(match.filterId)` with `getCategoryGridCached(match.filterId)`:
  - tag `catalog:category-products:{filterId}`, `cacheLife('hours')`
- Also cache the “category metadata” resolution if you want:
  - tag `catalog:category:{slug}` and/or `catalog:category:{id}`, `cacheLife('days')`

Make it truly “ISR-like”:
- Add `generateStaticParams()` to `app/(store)/category/[slug]/page.tsx` using `getAllCategoriesCached()` and return a list of slugs/ids:
  - Include category + subCategory + subSubCategory identifiers (your page supports matching by slug or id).
  - If the list is large, generate only top N and let the rest generate on first request.

Invalidate when admin changes:
- Category tree changes → `revalidateTag('catalog:categories', { expire: 0 })`
- Product assignment / product changes in a category → `revalidateTag('catalog:category-products:{filterId}', 'max')`
  - If you can determine the category IDs affected in the mutation handler, expire `{ expire: 0 }` for immediate correctness.

Wire invalidation in:
- `app/api/categories/[id]/route.ts` and subcategory routes
- `app/api/products/[id]/route.ts` (product updates should also revalidate related category grids)

### 2.4 Product detail (`/product/[id]`) — `app/(store)/product/[id]/page.tsx`

Current blockers:
- `fetchProduct` + `fetchRelatedProducts` both use `cache: 'no-store'`.

Do:
- Replace them with cached loaders:
  - `getProductCached(id)` tagged `catalog:product:{id}`, `cacheLife('days')`
  - `getRelatedProductsCached(product.subCategoryIds, product.id)` tagged `catalog:category-products:{categoryId}` OR a dedicated tag like `catalog:related:{categoryId}`, `cacheLife('hours'|'days')`
- Keep the existing toast-based error surfacing (`ProductErrorHandler`).

Optional (performance):
- Add `generateStaticParams()` returning top N product IDs (e.g. “featured” + most viewed) so those pages are in the build output.

Invalidate when admin changes:
- Product update/delete → `revalidateTag(\`catalog:product:${id}\`, { expire: 0 })`
- If product appears in category grids → `revalidateTag('catalog:products', 'max')` and targeted `catalog:category-products:{...}` when possible.

Wire invalidation in:
- `app/api/products/[id]/route.ts` (PUT/DELETE)
- `app/api/products/route.ts` (POST)

### 2.5 Cart (`/cart`) — `app/(store)/cart/page.tsx`  ✅ (reviewed)

Your review: use **PPR + dynamic island**, **do not** use `'use cache: private'`.

Do:
- Convert the page to:
  - A static shell (title, layout, skeleton)
  - A `<Suspense fallback={<CartSkeleton/>}>` boundary rendering a server `CartContent` component
- Put *all* session/cart/stock reads inside `CartContent` so Cache Components can prerender the shell.

Caching/invalidation:
- Don’t add cache tags for cart contents.
- No `revalidateTag('cart')` needed if the cart is fetched live and mutations update client state (your cart provider already does this).
- Keep `router.refresh()` as a last-resort (e.g. after checkout redirect) but prefer updating provider state from mutation responses.

### 2.6 Wishlist (`/wishlist`) — `app/(store)/wishlist/page.tsx`

Do:
- Same pattern as cart:
  - Static shell
  - `<Suspense fallback={<WishlistSkeleton/>}>` around a server component that loads wishlist + products
- Keep wishlist membership dynamic (per session); cache **product details** via `getProductCached(id)` so the expensive part is shared and invalidatable.

Invalidate:
- Product updates → `revalidateTag(\`catalog:product:${id}\`, { expire: 0 })`

### 2.7 Account (`/account`) — `app/(store)/account/page.tsx`

This is a sign-in page (static form). Do:
- Nothing for caching (it should remain fully prerenderable).

### 2.8 Register (`/account/register`) — `app/(store)/account/register/page.tsx`

Static form. Do:
- Nothing for caching.

### 2.9 Orders (`/orders`) — `app/(store)/orders/page.tsx`

This is per-session/user. Do:
- Move order fetching behind `<Suspense>` so the shell prerenders.
- Add toast error surfacing (currently it will throw and won’t show the detailed toast body/status):
  - Catch errors from `getOrCreateStorefrontSession()` and `getOrdersBySessionId(...)`
  - Render `ErrorToastHandler` with full payload (status/body/url/method) per `agents/frontend.md`

No caching across users for the list; treat as dynamic content.

### 2.10 Checkout success (`/checkout/success`) — `app/(store)/checkout/success/page.tsx`
### 2.11 Checkout cancel (`/checkout/cancel`) — `app/(store)/checkout/cancel/page.tsx`

Static copy pages. Do:
- Nothing for caching.

---

## 3) Mutation → revalidation wiring (what to change in API routes)

Today you use `revalidatePath(...)` in a few admin endpoints. For storefront caching, switch to (or add) **tag invalidation** so you don’t have to enumerate paths.

Important Next.js rule:
- In **Route Handlers**, use `revalidateTag(tag, 'max')` for SWR semantics, or `revalidateTag(tag, { expire: 0 })` when you want the next request to block and fetch fresh.
- `updateTag(...)` is Server Actions only.

### 3.1 Settings routes

- `app/api/admin/settings/hero-banners/route.ts` and `app/api/admin/settings/hero-banners/[id]/route.ts`
  - after create/update/delete: `revalidateTag('settings:hero-banners', { expire: 0 })`

- `app/api/admin/settings/custom-cards/[cardKey]/route.ts`
  - after update: `revalidateTag('settings:custom-cards', { expire: 0 })`

- `app/api/admin/settings/featured-products/route.ts` and `[id]/route.ts`
  - after add/remove: `revalidateTag('settings:featured-products', { expire: 0 })`

### 3.2 Catalog routes

- `app/api/products/route.ts` (POST) + `app/api/products/[id]/route.ts` (PUT/DELETE)
  - always: `revalidateTag('catalog:products', 'max')`
  - per-product: `revalidateTag(\`catalog:product:${id}\`, { expire: 0 })`
  - optional (if you can derive affected category IDs): `revalidateTag(\`catalog:category-products:${categoryId}\`, 'max')`

- `app/api/categories/route.ts` + `app/api/categories/[id]/route.ts` + subcategory routes
  - `revalidateTag('catalog:categories', { expire: 0 })`

---

## 4) Acceptance checklist (how to know it worked)

- Build no longer errors with “Uncached data was accessed outside of `<Suspense>`”.
- Storefront home/category/product pages stop using `cache: 'no-store'` and instead use `use cache` + tags.
- Admin updates cause storefront data to refresh on next visit (or immediately if you used `{ expire: 0 }`).
- Any data/API failure still surfaces via toast with full status/body/url/method (no silent fallbacks).

