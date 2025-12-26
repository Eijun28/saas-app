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

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "NUPLY — La plateforme mariage next-gen",
  description: "Matching IA, prestataires vérifiés, budget, timeline, messagerie. Tout le mariage au même endroit.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${GeistSans.className} ${inter.variable}`}>
      <body className="antialiased bg-white" suppressHydrationWarning>
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