export function CategoryPageSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading category products">
      <div className="space-y-3">
        <div className="h-4 w-64 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
        <div className="h-8 w-80 max-w-full animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="aspect-[4/3] animate-pulse rounded-md bg-[var(--storefront-bg-subtle)]" />
            <div className="h-4 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
