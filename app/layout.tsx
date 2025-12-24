import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { CurrencyProvider } from "@/lib/currency/CurrencyContext";
import { getExchangeRates } from "@/lib/currency/currency.service";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sheza Star",
  description: "Sheza Star",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rates = await getExchangeRates();

  return (
    <html lang="en">
      <head>
        <Script id="strip-extension-body-attrs" strategy="beforeInteractive">
          {`(function () {
  function strip() {
    if (!document.body) return false;
    document.body.removeAttribute('cz-shortcut-listen');
    return true;
  }

  if (strip()) return;

  var observer = new MutationObserver(function () {
    if (strip()) observer.disconnect();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();`}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CurrencyProvider initialRates={rates}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
