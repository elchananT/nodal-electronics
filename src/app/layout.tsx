import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { Providers } from "@/components/site/providers";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s — ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    siteName: SITE.name,
    type: "website",
    images: [{ url: "/brand/logo-1024.png", width: 1024, height: 1024, alt: "Nodal logo" }],
  },
  twitter: { card: "summary", title: `${SITE.name} — ${SITE.tagline}`, description: SITE.description },
};

export const viewport: Viewport = { themeColor: "#0c0d10", colorScheme: "dark" };

// Fonts: self-hosted Clash Display + General Sans live in globals.css (@font-face).
// Instrument Serif, JetBrains Mono and Geist (variable, breathing wordmark) come from <link>:
// next/font/google breaks with the Turbopack Tailwind loader.
const FONTS =
  "https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400..600&display=swap";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        <SmoothScroll />
        <Providers>{children}</Providers>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
