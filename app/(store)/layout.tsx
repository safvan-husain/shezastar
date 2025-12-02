import { NavbarWrapper } from "@/components/NavbarWrapper";
import { FooterWrapper } from "@/components/FooterWrapper";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavbarWrapper />
      </div>
      <main>{children}</main>
      <FooterWrapper />
    </div>
  );
}
