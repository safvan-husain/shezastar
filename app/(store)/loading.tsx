export default function StorefrontHomeLoading() {
  return (
    <div className="min-h-screen">
      <section className="h-[560px] animate-pulse bg-[var(--storefront-bg-subtle)]" />
      <section className="container mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[4/3] animate-pulse rounded-md bg-[var(--storefront-bg-subtle)]" />
              <div className="h-4 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
