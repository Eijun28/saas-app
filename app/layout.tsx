import type { Metadata } from "next";
import "./globals.css";
import { NuplyNavbarMenu } from "@/components/NuplyNavbarMenu";
import MainWrapper from "@/components/layout/MainWrapper";
import FooterWrapper from "@/components/layout/FooterWrapper";
import Chatbot from "@/components/Chatbot";
import { Toaster } from "@/components/ui/sonner";

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
    <html lang="fr">
      <body className="antialiased bg-white" suppressHydrationWarning>
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
      </body>
    </html>
  );
}