import type { Metadata } from "next";
import { Agentation } from "agentation";
import { Geist_Mono, Inter, Noto_Serif } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const notoSerif = Noto_Serif({ variable: "--font-serif" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pantom Portfolio",
  description: "Pantom is a creative studio for design, development, branding, and MVP delivery.",
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
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
