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
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-FNR2XYCV84"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-FNR2XYCV84');`}
        </Script>
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
