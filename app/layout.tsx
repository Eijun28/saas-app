import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { Inter } from 'next/font/google';
import "./globals.css";
import { NuplyNavbarMenu } from "@/components/NuplyNavbarMenu";
import MainWrapper from "@/components/layout/MainWrapper";
import FooterWrapper from "@/components/layout/FooterWrapper";
import Chatbot from "@/components/Chatbot";
import Providers from "@/components/providers/Providers";
import { Toaster } from "@/components/ui/sonner";
import { StructuredData } from "@/components/seo/StructuredData";

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nuply.com'), // ⚠️ REMPLACER par votre domaine de production

  title: {
    default: "NUPLY — La plateforme mariage next-gen",
    template: "%s | NUPLY",
  },

  description: "Matching IA, prestataires vérifiés, budget, timeline, messagerie. Organisez votre mariage en toute sérénité avec NUPLY, la plateforme tout-en-un pour couples modernes.",

  keywords: [
    "mariage",
    "organisation mariage",
    "prestataires mariage",
    "matching IA mariage",
    "plateforme mariage",
    "budget mariage",
    "timeline mariage",
    "photographe mariage",
    "traiteur mariage",
    "DJ mariage",
    "wedding planner",
    "mariage france",
    "préparation mariage",
    "gestion mariage"
  ],

  authors: [{ name: "NUPLY" }],
  creator: "NUPLY",
  publisher: "NUPLY",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // OpenGraph
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://nuply.com', // ⚠️ REMPLACER par votre domaine
    siteName: 'NUPLY',
    title: 'NUPLY — La plateforme mariage next-gen',
    description: 'Matching IA, prestataires vérifiés, budget, timeline, messagerie. Tout le mariage au même endroit.',
    images: [
      {
        url: '/og-image.png', // ⚠️ Image à créer (voir PARTIE 2)
        width: 1200,
        height: 630,
        alt: 'NUPLY - Plateforme mariage next-gen avec matching IA',
        type: 'image/png',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@nuply', // ⚠️ REMPLACER par votre handle Twitter si vous en avez un
    creator: '@nuply',
    title: 'NUPLY — La plateforme mariage next-gen',
    description: 'Matching IA, prestataires vérifiés, budget, timeline, messagerie. Tout le mariage au même endroit.',
    images: ['/og-image.png'], // ⚠️ Image à créer
  },

  // Robots
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

  // Icons
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

  // Theme color
  other: {
    'theme-color': '#823F91',
  },

  // Verification (optionnel - décommenter et remplir si nécessaire)
  // verification: {
  //   google: 'votre-code-google-search-console',
  //   yandex: 'votre-code-yandex',
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${GeistSans.className} ${inter.variable}`}>
      <body className={`${GeistSans.className} antialiased bg-white`} suppressHydrationWarning>
        <StructuredData />
        <Providers>
          <NuplyNavbarMenu />
          <main>
            <MainWrapper>
              {children}
            </MainWrapper>
          </main>
          <FooterWrapper />
          
          {/* Chatbot visible sur TOUTES les pages */}
          <Chatbot />
          
          {/* Toaster pour les notifications */}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}