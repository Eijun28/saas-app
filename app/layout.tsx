import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GeistSans } from 'geist/font/sans';
import { NuplyNavbarMenu } from "@/components/NuplyNavbarMenu";
import MainWrapper from "@/components/layout/MainWrapper";
import FooterWrapper from "@/components/layout/FooterWrapper";
// import Chatbot from "@/components/Chatbot"; // Désactivé temporairement - à réactiver plus tard
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "NUPLY — Le mariage moderne",
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
      <body className={`${GeistSans.className} antialiased bg-background`} suppressHydrationWarning>
        <NuplyNavbarMenu />
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
      </body>
    </html>
  );
}