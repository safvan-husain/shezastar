import { NavbarWrapper } from "@/components/NavbarWrapper";
import { FooterWrapper } from "@/components/FooterWrapper";
import { StorefrontSessionProvider } from "@/components/storefront/StorefrontSessionProvider";
import { StorefrontWishlistProvider } from "@/components/storefront/StorefrontWishlistProvider";
import { StorefrontCartProvider } from "@/components/storefront/StorefrontCartProvider";
import { StorefrontAuthSuggestionProvider } from "@/components/storefront/StorefrontAuthSuggestionProvider";
import { CurrencyProvider } from "@/lib/currency/CurrencyContext";
import { getExchangeRates } from "@/lib/currency/currency.service";
import { WhatsAppFloatingButton } from "@/components/storefront/WhatsAppFloatingButton";
import { CountryProvider } from "@/lib/country/CountryContext";
import { getCachedActiveCountryPricings } from "@/lib/app-settings/app-settings-cache";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  'use cache';

  const rates = await getExchangeRates();
  const countries = await getCachedActiveCountryPricings();

  return (
    <StorefrontSessionProvider>
      <StorefrontAuthSuggestionProvider>
        <StorefrontWishlistProvider>
          <StorefrontCartProvider>
            <CountryProvider initialCountries={countries}>
              <CurrencyProvider initialRates={rates}>
                <div className="bg-white min-h-screen flex flex-col">
                  <div className="fixed top-0 left-0 right-0 z-[100]">
                    <NavbarWrapper />
                  </div>
                  <main className="flex-1 lg:mt-10">
                    {children}
                  </main>
                  <WhatsAppFloatingButton />
                  <FooterWrapper />
                </div>
              </CurrencyProvider>
            </CountryProvider>
          </StorefrontCartProvider>
        </StorefrontWishlistProvider>
      </StorefrontAuthSuggestionProvider>
    </StorefrontSessionProvider>
  );
}
