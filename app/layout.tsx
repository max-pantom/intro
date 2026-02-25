import type { Metadata } from "next";
import { Agentation } from "agentation";
import { DialRoot } from "dialkit";
import type { ReactNode } from "react";
import { SiteAnalytics } from "@/components/analytics/site-analytics";
import "dialkit/styles.css";
import "./globals.css";

const siteTitle = "Pantom Portfolio";
const siteDescription = "Pantom is a creative studio for design, development, branding, and MVP delivery.";

function getMetadataBase() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return new URL("http://localhost:3000");

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(withProtocol);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Pantom",
    title: siteTitle,
    description: siteDescription,
    url: "/",
    images: [
      {
        url: "/og/custom-og.png",
        width: 1200,
        height: 630,
        alt: "Pantom",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og/custom-og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <SiteAnalytics />
        {process.env.NODE_ENV === "development" && <Agentation />}
        <DialRoot />
      </body>
    </html>
  );
}
