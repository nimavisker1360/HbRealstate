import Script from "next/script";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getSiteUrl } from "../lib/seo";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-KMXZ73K0CE";

const getMetadataBase = (): URL => {
  try {
    return new URL(getSiteUrl());
  } catch (_error) {
    return new URL("https://example.com");
  }
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "HB Real Estate | Buy Verified Properties",
    template: "%s | HB Real Estate",
  },
  description:
    "Find verified real estate listings with city and property-type landing pages, transparent filters, and SEO-ready property details.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              send_page_view: true
            });
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
