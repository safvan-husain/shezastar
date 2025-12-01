import { NavbarWrapper } from "@/components/NavbarWrapper";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarWrapper />
      {children}
    </>
  );
}
