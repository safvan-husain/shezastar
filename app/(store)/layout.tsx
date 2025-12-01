import { NavbarWrapper } from "@/components/NavbarWrapper";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white relative min-h-screen">
      <NavbarWrapper />
      {children}
    </div>
  );
}
