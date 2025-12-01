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
    <div className="min-h-screen">
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
