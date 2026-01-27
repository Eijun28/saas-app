"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FadeInOnScroll } from "@/components/landing/animations";
import {
  FileText,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  Bell,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

const couplesSteps: Step[] = [
  {
    number: 1,
    icon: FileText,
    title: "Décrivez votre mariage",
    description: "Discutez avec notre IA et décrivez votre mariage avec vos origines culturelles, traditions et budget.",
  },
  {
    number: 2,
    icon: Sparkles,
    title: "L'IA vous matche",
    description: "Notre algorithme compare votre profil avec les prestataires disponibles.",
  },
  {
    number: 3,
    icon: MessageSquare,
    title: "Échangez et comparez",
    description: "Contactez les prestataires via la messagerie et consultez leurs devis.",
  },
  {
    number: 4,
    icon: ShieldCheck,
    title: "Réservez en confiance",
    description: "Validez votre réservation avec un paiement sécurisé via tiers de confiance.",
  },
];

const prestatairesSteps: Step[] = [
  {
    number: 1,
    icon: UserPlus,
    title: "Créez votre profil",
    description: "Inscrivez-vous et complétez votre profil avec vos spécialités culturelles.",
  },
  {
    number: 2,
    icon: Bell,
    title: "Recevez des demandes qualifiées",
    description: "L'algorithme vous envoie uniquement les demandes correspondant à vos spécialités.",
  },
  {
    number: 3,
    icon: MessageSquare,
    title: "Gérez vos échanges",
    description: "Répondez aux couples et envoyez vos devis directement depuis la plateforme.",
  },
  {
    number: 4,
    icon: TrendingUp,
    title: "Développez votre activité",
    description: "Pilotez votre activité avec notre outil pensé pour votre activité.",
  },
];

interface TimelineProps {
  steps: Step[];
}

function Timeline({ steps }: TimelineProps) {
  return (
    <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
      {/* Mobile (< 640px): Timeline verticale avec points */}
      <div className="sm:hidden space-y-8 relative pl-6">
        {/* Ligne verticale continue */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#823F91] via-[#c081e3] to-[#823F91]/20" />
        
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={`step-${step.number}`}
              className="relative"
            >
              {/* Point rond sur la ligne */}
              <div className="absolute -left-[10px] top-0 w-5 h-5 rounded-full bg-gradient-to-br from-[#823F91] to-[#c081e3] border-2 border-white shadow-lg z-10" />
              
              {/* Contenu */}
              <div className="pl-6">
                <h3 className="font-bold text-base sm:text-lg text-[#823F91] mb-3 leading-tight min-h-[2.5rem] sm:min-h-[3rem]">
                  {step.title}
                </h3>
                <p style={{ color: "hsl(var(--beige-800))" }} className="text-xs sm:text-sm leading-relaxed font-medium mt-3 min-h-[3.5rem] sm:min-h-[4rem]">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tablette/iPad (640px - 1024px): Timeline horizontale 2x2 avec chemin continu logique */}
      <div className="hidden sm:block lg:hidden relative">
        {/* Container pour les étapes en grille 2x2 */}
        <div className="relative grid grid-cols-2 gap-x-8 md:gap-x-12 gap-y-14 md:gap-y-16">
          {/* Chemin continu logique : Étape 1 → Étape 2 → Étape 3 → Étape 4 */}
          
          {/* Ligne horizontale première rangée : du centre de la colonne gauche au centre de la colonne droite */}
          <div className="absolute top-[3.5rem] md:top-[4rem] left-[25%] right-[25%] h-0.5 md:h-1 bg-gradient-to-r from-[#823F91] via-[#c081e3] to-[#c081e3] z-0" />
          
          {/* Ligne en Z inversé : Étape 2 (droite, haut) → descente verticale → horizontale → Étape 3 (gauche, bas) */}
          {/* Partie verticale : descente depuis étape 2 (75%) */}
          <div className="absolute top-[3.5rem] md:top-[4rem] left-[75%] w-0.5 md:w-1 h-[13rem] md:h-[15rem] bg-gradient-to-b from-[#c081e3] via-[#823F91] to-[#823F91] z-0" />
          {/* Partie horizontale : connexion de droite (75%) vers gauche (25%) */}
          <div className="absolute top-[13rem] md:top-[15rem] left-[25%] right-[75%] h-0.5 md:h-1 bg-gradient-to-r from-[#823F91] to-[#823F91] z-0" />
          
          {/* Ligne horizontale deuxième rangée : du centre de la colonne gauche au centre de la colonne droite */}
          <div className="absolute top-[13rem] md:top-[15rem] left-[25%] right-[25%] h-0.5 md:h-1 bg-gradient-to-r from-[#823F91] via-[#c081e3] to-[#823F91] z-0" />
          
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isFirstRow = index < 2;
            const isLeftColumn = index % 2 === 0;

            return (
              <div
                key={`step-${step.number}`}
                className="relative flex flex-col items-center z-10"
              >
                {/* Titre au-dessus - hauteur fixe pour éviter l'empiètement */}
                <div className="text-center mb-0 min-h-[3rem] md:min-h-[3.5rem] flex items-center justify-center">
                  <h3 className="font-semibold text-sm md:text-base text-[#823F91] leading-tight px-2">
                    {step.title}
                  </h3>
                </div>
                
                {/* Point rond sur la ligne */}
                <div className="absolute top-[3.5rem] md:top-[4rem] w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-[#823F91] to-[#c081e3] border-2 md:border-[3px] border-white shadow-lg z-20" />
                
                {/* Texte en dessous - hauteur fixe pour alignement */}
                <div className="text-center mt-10 md:mt-12 min-h-[4rem] md:min-h-[4.5rem] flex items-start justify-center">
                  <p style={{ color: "hsl(var(--beige-700))" }} className="text-xs md:text-sm leading-relaxed px-2">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop (>= 1024px): Timeline horizontale complète 4 colonnes */}
      <div className="hidden lg:block relative">
        {/* Ligne horizontale continue */}
        <div className="absolute top-[4rem] xl:top-[4.5rem] left-0 right-0 h-1 bg-gradient-to-r from-[#823F91] via-[#c081e3] to-[#823F91]" />
        
        {/* Container pour les étapes */}
        <div className="relative grid grid-cols-4 gap-6 xl:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={`step-${step.number}`}
                className="relative flex flex-col items-center"
              >
                {/* Titre au-dessus - hauteur fixe pour éviter l'empiètement */}
                <div className="text-center mb-0 min-h-[3.5rem] xl:min-h-[4rem] flex items-center justify-center">
                  <h3 className="font-semibold text-base xl:text-lg text-[#823F91] leading-tight">
                    {step.title}
                  </h3>
                </div>
                
                {/* Bâton vertical sur la ligne */}
                <div className="absolute top-[3.5rem] xl:top-[4rem] w-3 h-8 bg-gradient-to-b from-[#823F91] to-[#c081e3] rounded-full shadow-lg z-10" />
                
                {/* Texte en dessous - hauteur fixe pour alignement */}
                <div className="text-center mt-12 min-h-[4.5rem] xl:min-h-[5rem] flex items-start justify-center">
                  <p style={{ color: "hsl(var(--beige-700))" }} className="text-sm xl:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
        {/* Header */}
        <FadeInOnScroll className="text-center mb-8 sm:mb-10 md:mb-12">
          {/* Titre */}
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2 md:px-4"
            style={{ color: "#823F91" }}
          >
            Comment Nuply fonctionne ?
          </h2>

          {/* Sous-titre */}
          <p
            className="text-base sm:text-lg md:text-xl max-w-2xl md:max-w-3xl mx-auto px-2 md:px-4"
            style={{ color: "hsl(var(--beige-800))" }}
          >
            Une expérience personnalisée selon votre profil
          </p>
        </FadeInOnScroll>

        {/* Tabs */}
        <FadeInOnScroll delay={0.2}>
          <style dangerouslySetInnerHTML={{__html: `
            #how-it-works [data-slot="tabs-trigger"][data-state="inactive"] {
              color: #823F91 !important;
              background-color: white !important;
            }
            #how-it-works [data-slot="tabs-trigger"][data-state="active"] {
              color: white !important;
            }
            #how-it-works [data-slot="tabs-content"] {
              animation: none !important;
              transition: none !important;
            }
          `}} />
          <Tabs defaultValue="couples" className="w-full">
            <TabsList
              className={cn(
                "w-full sm:w-fit mx-auto bg-white/80 backdrop-blur-sm border rounded-lg p-1 sm:p-1.5 md:p-2",
                "shadow-sm"
              )}
              style={{ borderColor: "#c081e3" }}
            >
              <TabsTrigger
                value="couples"
                className={cn(
                  "px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-md transition-none font-medium",
                  "text-sm sm:text-base md:text-lg",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#c081e3]",
                  "data-[state=active]:text-white data-[state=active]:shadow-md",
                  "data-[state=inactive]:bg-white data-[state=inactive]:hover:bg-white/90"
                )}
              >
                Pour les couples
              </TabsTrigger>
              <TabsTrigger
                value="prestataires"
                className={cn(
                  "px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-md transition-none font-medium",
                  "text-sm sm:text-base md:text-lg",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#823F91] data-[state=active]:to-[#c081e3]",
                  "data-[state=active]:text-white data-[state=active]:shadow-md",
                  "data-[state=inactive]:bg-white data-[state=inactive]:hover:bg-white/90"
                )}
              >
                Pour les prestataires
              </TabsTrigger>
            </TabsList>

            <TabsContent value="couples" className="mt-6 sm:mt-8">
              <Timeline steps={couplesSteps} />

              {/* CTA */}
              <div className="mt-8 sm:mt-10 md:mt-12 text-center">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg text-sm sm:text-base"
                  style={{
                    background: "linear-gradient(to right, #823F91, #c081e3)",
                  }}
                >
                  Trouver mes prestataires
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="prestataires" className="mt-6 sm:mt-8">
              <Timeline steps={prestatairesSteps} />

              {/* CTA */}
              <div className="mt-8 sm:mt-10 md:mt-12 text-center">
                <Link
                  href="/sign-up?type=vendor"
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg text-sm sm:text-base"
                  style={{
                    background: "linear-gradient(to right, #823F91, #c081e3)",
                  }}
                >
                  Rejoindre Nuply
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
