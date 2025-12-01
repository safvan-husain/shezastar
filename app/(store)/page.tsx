import Link from "next/link";
import { Product } from "@/lib/product/model/product.model";
import { ProductGrid } from "@/components/ProductGrid";

async function fetchProducts(): Promise<Product[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/products?limit=200`, { cache: "no-store" });
    if (!res.ok) return [];

    const data = await res.json();
    return data.products ?? [];
  } catch (error) {
    console.error("Failed to load products", error);
    return [];
  }
}

export default async function Home() {
  const products = await fetchProducts();

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <section className="relative overflow-hidden py-16 sm:py-20 border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-subtle)] via-transparent to-[var(--bg-elevated)] opacity-80" aria-hidden />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl space-y-6">
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--text-muted)]">Vehicle Electronic Gadgets</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight">
              Precision tech for every ride.
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
              Explore dash cams, infotainment, sensors, and accessories curated with clean design and reliable performance.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-lg hover:bg-[var(--text-primary)] transition-colors"
              >
                Go to Admin Panel
              </Link>
              <Link
                href="#catalog"
                className="px-6 py-3 border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
              >
                Browse catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="container mx-auto px-4 py-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--text-muted)]">All products</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">In-stock catalog</h2>
          </div>
          <div className="text-sm text-[var(--text-muted)]">{products.length} items</div>
        </div>

        <ProductGrid products={products} emptyMessage="No products yet. Add items in the admin panel to showcase them here." />
      </section>
    </div>
  );
}
