"use client";

import React from "react";
import { TestimonialsColumn } from "./TestimonialsColumn";

const testimonials = [
  {
    text: "NUPLY nous a permis de trouver une négafa qui comprenait parfaitement nos traditions franco-algériennes. Notre mariage était exactement comme nous l'avions rêvé !",
    image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=100&h=100&fit=crop",
    name: "Sarah & Karim",
    role: "Mariage franco-algérien",
  },
  {
    text: "En tant que couple mixte, trouver des prestataires qui respectent nos deux cultures était un défi. NUPLY a rendu cela si simple !",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=100&h=100&fit=crop",
    name: "Priya & Thomas",
    role: "Mariage indo-français",
  },
  {
    text: "Le DJ que nous avons trouvé via NUPLY maîtrisait parfaitement la dabké et la variété française. Nos invités étaient ravis !",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=100&h=100&fit=crop",
    name: "Layla & Marc",
    role: "Mariage libano-français",
  },
  {
    text: "La messagerie intégrée nous a permis de communiquer facilement avec tous nos prestataires. Tout s'est déroulé à la perfection !",
    image: "https://images.unsplash.com/photo-1518621012428-ef8be442a055?w=100&h=100&fit=crop",
    name: "Amina & David",
    role: "Mariage maroco-français",
  },
  {
    text: "Grâce à NUPLY, nous avons trouvé un traiteur qui proposait des menus végétariens indiens ET français. Un vrai bonheur !",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=100&h=100&fit=crop",
    name: "Meera & Lucas",
    role: "Mariage indo-français",
  },
  {
    text: "L'IA de matching a vraiment compris nos besoins culturels spécifiques. Nous recommandons NUPLY à tous les couples multiculturels !",
    image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=100&h=100&fit=crop",
    name: "Fatima & Jean",
    role: "Mariage tuniso-français",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-gradient-to-br from-purple-50 via-white to-pink-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#0B0E12] mb-4">
            Ce que disent nos couples
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Découvrez les témoignages de couples qui ont organisé leur mariage multiculturel avec NUPLY
          </p>
        </div>

        <div className="relative h-[600px] overflow-hidden">
          <div className="absolute inset-0 flex gap-8">
            <div className="h-full overflow-hidden">
              <TestimonialsColumn
                testimonials={testimonials}
                duration={15}
                className="h-full"
              />
            </div>
            <div className="h-full overflow-hidden">
              <TestimonialsColumn
                testimonials={[...testimonials].reverse()}
                duration={18}
                className="h-full"
              />
            </div>
          </div>
          
          {/* Gradient overlays pour effet fade */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white via-white/80 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}

