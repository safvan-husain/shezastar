import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { getSiteUrl } from "@/lib/seo/canonical";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: "Sheza Star",
  description: "Sheza Star",
  verification: {
    google: "F-okKleFkRCZUcJ63vdcySGzx-e_hcI_pK9eGKBdgMU",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-4GE35E5NBK"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-4GE35E5NBK');`}
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
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
