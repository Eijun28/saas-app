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
import { JsonLd } from "@/components/seo/JsonLd";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  ...seoConfig.defaultMetadata,
  title: seoConfig.pages.home.title,
  description: seoConfig.pages.home.description,
  keywords: [...seoConfig.pages.home.keywords],
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#FAF9F6" />
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
      </body>
    </html>
  );
}