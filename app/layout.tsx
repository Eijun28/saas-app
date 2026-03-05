import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GeistSans } from 'geist/font/sans';
import { NuplyNavbarMenu } from "@/components/NuplyNavbarMenu";
import MainWrapper from "@/components/layout/MainWrapper";
import FooterWrapper from "@/components/layout/FooterWrapper";
// import Chatbot from "@/components/Chatbot"; // Désactivé temporairement - à réactiver plus tard
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { seoConfig } from "@/lib/seo/config";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/seo/structured-data";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

// Les images OG/Twitter sont gérées par opengraph-image.tsx et twitter-image.tsx
// (convention Next.js file-based metadata — pas besoin de les déclarer ici)
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: seoConfig.pages.home.title,
  description: seoConfig.pages.home.description,
  keywords: [...seoConfig.pages.home.keywords],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: siteConfig.url,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nuply',
    creator: '@nuply',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#823F91" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${GeistSans.className} ${GeistSans.variable} antialiased bg-background`} suppressHydrationWarning>
        {/* Données structurées pour le SEO */}
        <JsonLd data={[generateOrganizationSchema(), generateWebSiteSchema()]} />
        <NuplyNavbarMenu />
        <div id="dialog-container" style={{ position: 'relative', zIndex: 99999 }} />
        <main>
          <MainWrapper>
            {children}
          </MainWrapper>
        </main>
        <FooterWrapper />

        {/* Chatbot désactivé temporairement - à réactiver plus tard */}
        {/* <Chatbot /> */}

        {/* Toaster pour les notifications */}
        <Toaster />
        <Analytics />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
