import type { Metadata } from "next";
import { Agentation } from "agentation";
import { Geist_Mono, Inter, Noto_Serif } from "next/font/google";
import type { ReactNode } from "react";
import { SiteAnalytics } from "@/components/analytics/site-analytics";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const notoSerif = Noto_Serif({ variable: "--font-serif" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        url: "/opengraph-image",
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
    images: ["/twitter-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSerif.variable}`}>
      <body
        className={`${geistMono.variable} antialiased`}
      >
        {children}
        <SiteAnalytics />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
