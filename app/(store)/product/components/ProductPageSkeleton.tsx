export function ProductDetailsSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_3fr]" aria-label="Loading product details">
      <div className="aspect-square w-full animate-pulse rounded-md bg-[var(--storefront-bg-subtle)]" />
      <div className="min-w-0 space-y-6">
        <div className="h-5 w-32 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
        <div className="space-y-3">
          <div className="h-9 w-full max-w-2xl animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
          <div className="h-9 w-4/5 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
        </div>
        <div className="h-10 w-48 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
        <div className="space-y-3">
          <div className="h-12 w-full animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
          <div className="h-12 w-full animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
        </div>
        <div className="grid grid-cols-[1fr_2fr_2fr_1fr] gap-4">
          <div className="h-12 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
          <div className="h-12 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
          <div className="h-12 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
          <div className="h-12 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
        </div>
      </div>
    </div>
  );
}
