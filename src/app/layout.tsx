import type { Metadata } from "next";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import { LangProvider } from "@/i18n";
import { PosthogProvider } from "../components/PosthogProvider";

const CANONICAL = "https://flood.canada.nshipyard.com";

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL),
  title: "Flood Watch Canada: historical floods, live rainfall, and flood protection",
  description:
    "26 years of news-reported flood events across Canada (Groundsource open data), live ECCC radar and weather alerts, and flood protection inventories. An Nshipyard open-data project by Richardson Dackam.",
  openGraph: {
    title: "Flood Watch Canada",
    description:
      "Where Canada has flooded since 2000, live rainfall radar, and what flood protection exists. Open data, EN/FR.",
    url: CANONICAL,
    siteName: "Flood Watch Canada",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flood Watch Canada",
    description:
      "Where Canada has flooded since 2000, live rainfall radar, and what flood protection exists. Open data, EN/FR.",
    images: ["/og.png"],
  },
  alternates: { canonical: CANONICAL },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      "/favicon.ico",
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col"><PosthogProvider>
        <LangProvider>{children}</LangProvider>
      </PosthogProvider></body>
    </html>
  );
}
