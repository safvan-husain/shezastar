# Next.js Build & SEO Optimization Guide

This document explains how to handle database connections during the build process while maintaining high SEO performance using Next.js 16 patterns.

## 1. Problem: Build Fails Due to DB Connection
By default, Next.js attempts to pre-render pages at build time. If your Server Components or data-fetching logic connect to a database that is offline during the build (common in CI/CD), the build will fail.

## 2. Solution: Force Dynamic Rendering
To bypass the database requirement during `npm run build`, we opt out of static generation for the affected route segments.

### How to use:
Add the following segment configuration to your `layout.tsx` or `page.tsx`:

```tsx
// app/(store)/layout.tsx or page.tsx
export const dynamic = "force-dynamic";

export default async function Layout({ children }) {
  // This will now only execute at runtime (on request),
  // effectively bypassing the build-time DB dependency.
  return <div>{children}</div>;
}
```

## 3. Maintaining SEO Performance
Even with `force-dynamic` (Dynamic Rendering/SSR), your SEO remains excellent because:
1. **Full HTML Delivery**: Search engine bots still receive a fully rendered HTML document from the server.
2. **Metadata API**: `generateMetadata` functions run at runtime and inject SEO tags before the response is sent.

### Example: Dynamic SEO with Metadata
```tsx
// app/product/[id]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.id);
  return {
    title: product.name,
    description: product.description,
  };
}
```

## 4. Advanced: Static Performance at Runtime
In Next.js 16, you can regain "Static Site performance" on dynamic pages using the `"use cache"` directive. This allows you to cache expensive database queries *at runtime* without requiring them at build time.

### Implementation Pattern:
```tsx
// lib/products.ts
export async function getCachedProducts() {
  "use cache"; // Next.js 16 Directive
  // This executes on the first request and caches the result.
  // Subsequent users get the result instantly, similar to a static page.
  return await db.products.findMany();
}
```

## Summary Table

| Feature | Static Generation (SSG) | Dynamic Rendering (SSR) | Dynamic + "use cache" |
| :--- | :--- | :--- | :--- |
| **Build-time DB Required** | Yes | **No** | **No** |
| **SEO Quality** | Excellent | Excellent | Excellent |
| **User Load Speed** | Instant | Depends on DB | Instant (after first hit) |
| **Data Freshness** | At Build Time | Per Request | Configurable (TTL) |

---
*For more information, refer to the [Next.js Documentation on Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config).*
