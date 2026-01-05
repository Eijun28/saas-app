"use client";

import { AnimatedListNuply } from "@/components/landing/AnimatedListNuply";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background (optionnel - ajoute un bg Aceternity si tu veux) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-purple-50 to-white" />
      
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left side - Texte */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
                Trouvez vos prestataires
                <span className="text-[#823F91]">
                  {" "}en quelques clics
                </span>
              </h1>
              <p className="text-xl text-gray-600">
                Notre IA match automatiquement vos critères avec les meilleurs prestataires pour votre mariage multiculturel
              </p>
            </div>
            
            <div className="flex gap-4">
              <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Commencer gratuitement
              </button>
              <button className="px-8 py-4 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Voir comment ça marche
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8">
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-gray-600">Taux de satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-bold">2.5k+</div>
                <div className="text-sm text-gray-600">Mariages organisés</div>
              </div>
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-gray-600">Prestataires certifiés</div>
              </div>
            </div>
          </div>

          {/* Right side - Animated List */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur-2xl opacity-20" />
            <AnimatedListNuply className="relative" />
          </div>
        </div>
      </div>
    </section>
  );
}

