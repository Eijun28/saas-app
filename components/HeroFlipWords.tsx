"use client";

import React from "react";
import Link from "next/link";
import { FlipWords } from "@/components/ui/flip-words";
import { Button } from "@/components/ui/button";

export function HeroFlipWords() {
  const words = ["traditions", "cultures", "héritages", "origines"];

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative h-[90vh] flex items-center justify-center px-4 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center space-y-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-neutral-900 leading-tight">
            Célébrez vos{" "}
            <FlipWords 
              words={words} 
              className="text-[#823F91]" 
              duration={3000}
            />
            <br />
            avec les bons prestataires
          </h1>

          <p className="text-xl md:text-2xl text-neutral-600 max-w-3xl mx-auto">
            La première plateforme qui connecte les couples multiculturels 
            avec des prestataires qui comprennent leurs traditions
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              asChild
              size="lg" 
              className="text-lg px-8 py-6 bg-[#823F91] hover:bg-[#6D3478]"
            >
              <Link href="/sign-up">Commencer gratuitement</Link>
            </Button>

            <Button 
              asChild
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-[#823F91] text-[#823F91] hover:bg-[#E8D4EF]"
            >
              <a href="/#fonctionnement" onClick={(e) => handleScrollToSection(e, 'fonctionnement')}>
                Voir comment ça marche
              </a>
            </Button>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>127 couples actifs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>250+ prestataires vérifiés</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>Note 4.9/5</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-200 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>
    </section>
  );
}
