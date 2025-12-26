import { NavbarWrapper } from "@/components/NavbarWrapper";
import { FooterWrapper } from "@/components/FooterWrapper";
import { StorefrontSessionProvider } from "@/components/storefront/StorefrontSessionProvider";
import { StorefrontWishlistProvider } from "@/components/storefront/StorefrontWishlistProvider";
import { getOrCreateStorefrontSession } from "@/app/actions/session";
import { ensureWishlist } from "@/lib/wishlist";
import { getCartForCurrentSession } from "@/lib/cart";
import { StorefrontCartProvider } from "@/components/storefront/StorefrontCartProvider";
import { StorefrontAuthSuggestionProvider } from "@/components/storefront/StorefrontAuthSuggestionProvider";
import { CurrencyProvider } from "@/lib/currency/CurrencyContext";
import { getExchangeRates } from "@/lib/currency/currency.service";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOrCreateStorefrontSession();
  const cart = await getCartForCurrentSession();
  const rates = await getExchangeRates();

  return (
    <StorefrontSessionProvider initialSession={session}>
      <StorefrontAuthSuggestionProvider>
        <StorefrontWishlistProvider initialWishlist={await ensureWishlist(session)}>
          <StorefrontCartProvider initialCart={cart}>
            <CurrencyProvider initialRates={rates}>
              <div className="bg-white min-h-screen flex flex-col">
                <div className="fixed top-0 left-0 right-0 z-[100]">
                  <NavbarWrapper />
                </div>
                <main className="flex-1">
                  {children}
                </main>
                <FooterWrapper />
              </div>
            </CurrencyProvider>
          </StorefrontCartProvider>
        </StorefrontWishlistProvider>
      </StorefrontAuthSuggestionProvider>
    </StorefrontSessionProvider>
  );
}
