import { Product } from "@/lib/product/model/product.model";
import { ProductGrid } from "@/components/ProductGrid";
import { ErrorToastHandler, type ToastErrorPayload } from "@/components/ErrorToastHandler";
import { HeroCarousel } from "@/components/HeroCarousel";
import { CardView } from "@/components/CardView";
import type { HeroBannerWithId, CustomCard } from "@/lib/app-settings/app-settings.schema";
import { getFeaturedProducts } from "@/lib/app-settings/app-settings.service";

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

async function fetchCustomCards(): Promise<{ cards: CustomCard[]; error: ToastErrorPayload | null }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/admin/settings/custom-cards`;

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
        cards: [],
        error: {
          message: body.message || body.error || "Failed to load custom cards",
          status: res.status,
          body,
          url: res.url,
          method: "GET",
        },
      };
    }

    const data = await res.json();
    // Convert object to array of non-null cards
    const cardsArray = Object.values(data).filter((card): card is CustomCard => card !== null);
    return { cards: cardsArray, error: null };
  } catch (error) {
    return {
      cards: [],
      error: {
        message: error instanceof Error ? error.message : "Failed to load custom cards",
        body: error instanceof Error ? { stack: error.stack } : { error },
        url,
        method: "GET",
      },
    };
  }
}

export default async function Home() {
  const [
    { banners, error: heroBannersError },
    { products, error: productsError },
    { cards, error: customCardsError },
  ] = await Promise.all([fetchHeroBanners(), fetchProducts(), fetchCustomCards()]);

  // Fetch featured products
  let featuredProducts: Product[] = [];
  let featuredError: ToastErrorPayload | null = null;
  try {
    featuredProducts = await getFeaturedProducts();
  } catch (error) {
    featuredError = {
      message: error instanceof Error ? error.message : "Failed to load featured products",
      body: error instanceof Error ? { stack: error.stack } : { error },
      method: "GET",
    };
  }

  // Split featured products
  const firstFeaturedProducts = featuredProducts.slice(0, 4);
  const remainingFeaturedProducts = featuredProducts.slice(4);

  // Filter out featured products from all products
  const featuredIds = new Set(featuredProducts.map((p) => p.id));
  const nonFeaturedProducts = products.filter((p) => !featuredIds.has(p.id));

  // Split cards into three views
  const twoItemCards = cards.slice(0, 2);
  const threeItemCards = cards.slice(2, 5);
  const oneItemCard = cards.slice(5, 6);

  // Determine if single card should appear before or after all products
  // If 4 or fewer featured products, show single card at the end
  const showSingleCardBeforeProducts = featuredProducts.length > 4;
  const showSingleCardAfterProducts = featuredProducts.length <= 4;

  return (
    <div className="min-h-screen">
      {/* Hero Banner Section */}
      {banners.length > 0 && <HeroCarousel banners={banners} />}
      {heroBannersError && <ErrorToastHandler error={heroBannersError} />}

      {/* Two-Item Card View - Below Hero */}
      {twoItemCards.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <CardView cards={twoItemCards} />
        </section>
      )}
      {customCardsError && <ErrorToastHandler error={customCardsError} />}

      {/* First 4 Featured Products */}
      {firstFeaturedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12 space-y-6">
          {featuredError && <ErrorToastHandler error={featuredError} />}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Handpicked for you</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Featured Products</h2>
            </div>
          </div>
          <ProductGrid products={firstFeaturedProducts} emptyMessage="" />
        </section>
      )}

      {/* Three-Item Card View */}
      {threeItemCards.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <CardView cards={threeItemCards} />
        </section>
      )}

      {/* Remaining Featured Products */}
      {remainingFeaturedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12 space-y-6">
          <ProductGrid products={remainingFeaturedProducts} emptyMessage="" />
        </section>
      )}

      {/* One-Item Card View - Before Products (if more than 4 featured) */}
      {oneItemCard.length > 0 && showSingleCardBeforeProducts && (
        <section className="container mx-auto px-4 py-8">
          <CardView cards={oneItemCard} />
        </section>
      )}

      {/* All Non-Featured Products */}
      {nonFeaturedProducts.length > 0 && (
        <section id="catalog" className="container mx-auto px-4 py-12 space-y-6">
          {productsError && <ErrorToastHandler error={productsError} />}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--text-muted)]">All products</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">In-stock catalog</h2>
            </div>
            <div className="text-sm text-[var(--text-muted)]">{nonFeaturedProducts.length} items</div>
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
              products={nonFeaturedProducts}
              emptyMessage="No products yet. Add items in the admin panel to showcase them here."
            />
          )}
        </section>
      )}

      {/* One-Item Card View - After Products (if 4 or fewer featured) */}
      {oneItemCard.length > 0 && showSingleCardAfterProducts && (
        <section className="container mx-auto px-4 py-8 pb-12">
          <CardView cards={oneItemCard} />
        </section>
      )}
    </div>
  );
}
