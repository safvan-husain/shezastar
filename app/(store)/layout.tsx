import { Suspense } from "react";
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
import { WhatsAppFloatingButton } from "@/components/storefront/WhatsAppFloatingButton";
import { CountryProvider } from "@/lib/country/CountryContext";
import { getActiveCountryPricings } from "@/lib/app-settings/app-settings.service";

// export const dynamic = "force-dynamic";

async function StorefrontProvidersWrapper({ children }: { children: React.ReactNode }) {
  const session = await getOrCreateStorefrontSession();
  const cart = await getCartForCurrentSession();
  const rates = await getExchangeRates();
  const countries = await getActiveCountryPricings();
  const wishlist = await ensureWishlist(session);

  return (
    <StorefrontSessionProvider initialSession={session}>
      <StorefrontAuthSuggestionProvider>
        <StorefrontWishlistProvider initialWishlist={wishlist}>
          <StorefrontCartProvider initialCart={cart}>
            <CountryProvider initialCountries={countries}>
              <CurrencyProvider initialRates={rates}>
                {children}
              </CurrencyProvider>
            </CountryProvider>
          </StorefrontCartProvider>
        </StorefrontWishlistProvider>
      </StorefrontAuthSuggestionProvider>
    </StorefrontSessionProvider>
  );
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <Suspense fallback={<div className="h-16 bg-white border-b" />}>
          <NavbarWrapper />
        </Suspense>
      </div>
      <main className="flex-1 lg:mt-10 overflow-x-hidden">
        <Suspense fallback={<div className="container mx-auto px-4 py-8 animate-pulse bg-gray-50 h-96 rounded-xl mt-24" />}>
          <StorefrontProvidersWrapper>
            {children}
          </StorefrontProvidersWrapper>
        </Suspense>
      </main>
      <WhatsAppFloatingButton />
      <FooterWrapper />
    </div>
  );
}
