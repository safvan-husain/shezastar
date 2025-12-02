import { Product } from "@/lib/product/model/product.model";
import { ProductGrid } from "@/components/ProductGrid";
import { ErrorToastHandler, type ToastErrorPayload } from "@/components/ErrorToastHandler";
import { HeroCarousel } from "@/components/HeroCarousel";
import type { HeroBannerWithId } from "@/lib/app-settings/app-settings.schema";

type ErrorBody = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

async function fetchHeroBanners(): Promise<{ banners: HeroBannerWithId[]; error: ToastErrorPayload | null }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/admin/settings/hero-banners`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      let body: ErrorBody = {};
      try {
        body = await res.json();
      } catch {
        body = { error: "Failed to parse response body" };
      }

      return {
        banners: [],
        error: {
          message: body.message || body.error || "Failed to load hero banners",
          status: res.status,
          body,
          url: res.url,
          method: "GET",
        },
      };
    }

    const data = await res.json();
    return { banners: Array.isArray(data) ? data : [], error: null };
  } catch (error) {
    return {
      banners: [],
      error: {
        message: error instanceof Error ? error.message : "Failed to load hero banners",
        body: error instanceof Error ? { stack: error.stack } : { error },
        url,
        method: "GET",
      },
    };
  }
}

async function fetchProducts(): Promise<{ products: Product[]; error: ToastErrorPayload | null }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/products?limit=200`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      let body: ErrorBody = {};
      try {
        body = await res.json();
      } catch {
        body = { error: "Failed to parse response body" };
      }

      return {
        products: [],
        error: {
          message: body.message || body.error || "Failed to load products",
          status: res.status,
          body,
          url: res.url,
          method: "GET",
        },
      };
    }

    const data = await res.json();
    return { products: data.products ?? [], error: null };
  } catch (error) {
    return {
      products: [],
      error: {
        message: error instanceof Error ? error.message : "Failed to load products",
        body: error instanceof Error ? { stack: error.stack } : { error },
        url,
        method: "GET",
      },
    };
  }
}

export default async function Home() {
  const [{ banners, error: heroBannersError }, { products, error: productsError }] = await Promise.all([
    fetchHeroBanners(),
    fetchProducts(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Banner Section */}
      {banners.length > 0 && <HeroCarousel banners={banners} />}
      {heroBannersError && <ErrorToastHandler error={heroBannersError} />}

      {/* Product Catalog Section */}
      <section id="catalog" className="container mx-auto px-4 py-12 space-y-6">
        {productsError && <ErrorToastHandler error={productsError} />}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--text-muted)]">All products</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">In-stock catalog</h2>
          </div>
          <div className="text-sm text-[var(--text-muted)]">{products.length} items</div>
        </div>

        {productsError ? (
          <div className="rounded-xl border-2 border-[var(--storefront-border)] p-6 text-[var(--storefront-text-secondary)]">
            <p className="font-semibold text-[var(--storefront-text-primary)]">Unable to load products</p>
            <p className="text-sm mt-2">
              We could not load the catalog right now. Please try again shortly and copy the toast details if you
              need to report this issue.
            </p>
          </div>
        ) : (
          <ProductGrid
            products={products}
            emptyMessage="No products yet. Add items in the admin panel to showcase them here."
          />
        )}
      </section>
    </div>
  );
}
