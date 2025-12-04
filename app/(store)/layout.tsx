import { NavbarWrapper } from "@/components/NavbarWrapper";
import { FooterWrapper } from "@/components/FooterWrapper";
import { StorefrontSessionProvider } from "@/components/storefront/StorefrontSessionProvider";
import { ensureStorefrontSessionAction } from "@/app/actions/session";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await ensureStorefrontSessionAction();
  return (
    <StorefrontSessionProvider initialSession={session}>
      <div className="bg-white min-h-screen">
        <div className="fixed top-0 left-0 right-0 z-50">
          <NavbarWrapper />
        </div>
        <main>{children}</main>
        <FooterWrapper />
      </div>
    </StorefrontSessionProvider>
  );
}
