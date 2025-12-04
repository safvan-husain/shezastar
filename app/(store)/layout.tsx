import { NavbarWrapper } from "@/components/NavbarWrapper";
import { FooterWrapper } from "@/components/FooterWrapper";
import { StorefrontSessionProvider } from "@/components/storefront/StorefrontSessionProvider";
import { StorefrontWishlistProvider } from "@/components/storefront/StorefrontWishlistProvider";
import { StorefrontCartProvider } from "@/components/storefront/StorefrontCartProvider";
import { ensureStorefrontSessionAction } from "@/app/actions/session";
import { ensureWishlist } from "@/lib/wishlist";
import { getCartForCurrentSession } from "@/lib/cart";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await ensureStorefrontSessionAction();
  const cart = await getCartForCurrentSession();

  return (
    <StorefrontSessionProvider initialSession={session}>
      <StorefrontWishlistProvider initialWishlist={await ensureWishlist(session.sessionId)}>
        <StorefrontCartProvider initialCart={cart}>
        <div className="bg-white min-h-screen">
          <div className="fixed top-0 left-0 right-0 z-50">
            <NavbarWrapper />
          </div>
          <main>{children}</main>
          <FooterWrapper />
        </div>
        </StorefrontCartProvider>
      </StorefrontWishlistProvider>
    </StorefrontSessionProvider>
  );
}
