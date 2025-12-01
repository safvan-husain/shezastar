import { NavbarWrapper } from "@/components/NavbarWrapper";
import { FooterWrapper } from "@/components/FooterWrapper";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white relative min-h-screen flex flex-col">
      <NavbarWrapper />
      <main className="flex-1">{children}</main>
      <FooterWrapper />
    </div>
  );
}
