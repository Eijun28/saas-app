'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PricingColumn, PricingColumnProps } from '@/components/ui/pricing-column';
import { Section } from '@/components/ui/section';
import Particles from '@/components/Particles';

export default function PricingSection() {
  const [userType, setUserType] = useState<'couples' | 'prestataires'>('couples');

  // Plan unique pour les couples
  const couplesPricing: PricingColumnProps[] = [
    {
      name: "Gratuit",
      description: "Tout ce dont vous avez besoin pour trouver vos prestataires parfaits.",
      price: 0,
      priceNote: "Gratuit pour toujours",
      cta: {
        variant: "glow",
        label: "Créer mon compte gratuit",
        href: "/sign-up",
      },
      features: [
        "Créer votre profil couple",
        "Matching AI par culture et tradition",
        "Messages illimités avec les prestataires",
        "Accès à tous les portfolios",
        "Support par email",
      ],
      variant: "glow-brand",
    },
  ];

  // Plans pour les prestataires
  const prestatairesPricing: PricingColumnProps[] = [
    {
      name: "Gratuit",
      description: "Testez la plateforme sans engagement.",
      price: 0,
      priceNote: "Gratuit pour toujours",
      cta: {
        variant: "outline",
        label: "Créer mon profil",
        href: "/sign-up",
      },
      features: [
        "Créer votre profil professionnel",
        "Apparaître dans les recherches",
        "Recevoir jusqu'à 3 demandes par mois",
        "Portfolio basique (10 photos max)",
        "Support par email",
      ],
      variant: "default",
      className: "hidden lg:flex",
    },
    {
      name: "Premium",
      icon: <User className="size-4" />,
      description: "Pour les professionnels qui veulent plus de visibilité.",
      price: 49,
      priceNote: "Sans engagement • Résiliable à tout moment",
      cta: {
        variant: "glow",
        label: "Passer Premium",
        href: "/sign-up?plan=premium",
      },
      features: [
        "Demandes de contacts illimitées",
        "Portfolio illimité avec galeries privées",
        "Badge professionnel vérifié",
        "Apparition prioritaire dans les matchs",
        "Support prioritaire par email et chat",
      ],
      variant: "glow-brand",
    },
    {
      name: "Pro",
      icon: <Users className="size-4" />,
      description: "Pour dominer votre catégorie et maximiser vos réservations.",
      price: 79,
      priceNote: "Sans engagement • Résiliable à tout moment",
      cta: {
        variant: "glow",
        label: "Devenir Pro",
        href: "/sign-up?plan=pro",
      },
      features: [
        "Tout de Premium, plus :",
        "Position #1 garanti dans votre spécialité",
        "Analytics détaillés et reporting mensuel",
        "Publicité sponsorisée sur la plateforme",
        "Account manager dédié et formation incluse",
      ],
      variant: "glow",
    },
  ];

  const currentPricing = userType === 'couples' ? couplesPricing : prestatairesPricing;
  const title = "Tarifs simples et transparents";
  const description = "Pas de frais cachés. Changez ou annulez quand vous voulez.";

  return (
    <>
      {/* Background de particules - couvre toute la page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
        <Particles
          particleCount={200}
          particleSpread={10}
          speed={0.24}
          particleColors={["#823F91","#c081e3","#823F91"]}
          moveParticlesOnHover={false}
          particleHoverFactor={1}
          alphaParticles={false}
          particleBaseSize={50}
          sizeRandomness={0.5}
          cameraDistance={20}
          disableRotation={false}
          className=""
        />
      </div>

      <Section 
        className="min-h-screen bg-background relative z-10"
      >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 px-4 text-center sm:gap-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight"
            style={{ color: 'rgba(130, 63, 145, 1)' }}
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-md text-slate-600 max-w-[600px] font-medium sm:text-xl"
          >
            {description}
          </motion.p>
        </div>

        {/* Toggle Couples / Prestataires */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-slate-200">
            <button
              onClick={() => setUserType('couples')}
              className={cn(
                "px-5 py-2 rounded-full font-medium text-sm transition-all duration-300",
                userType === 'couples'
                  ? 'bg-[#823F91] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Pour les couples
            </button>
            <button
              onClick={() => setUserType('prestataires')}
              className={cn(
                "px-5 py-2 rounded-full font-medium text-sm transition-all duration-300",
                userType === 'prestataires'
                  ? 'bg-[#823F91] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Pour les prestataires
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={userType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "max-w-container mx-auto grid gap-8 w-full",
              userType === 'couples'
                ? "grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 max-w-sm"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {currentPricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <PricingColumn
                  name={plan.name}
                  icon={plan.icon}
                  description={plan.description}
                  price={plan.price}
                  priceNote={plan.priceNote}
                  cta={plan.cta}
                  features={plan.features}
                  variant={plan.variant}
                  className={plan.className}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-4"
        >
          <p className="text-slate-600 text-sm">
            {userType === 'couples' 
              ? "Aucune carte bancaire requise • Gratuit pour toujours"
              : "Sans engagement • Résiliable à tout moment"}
          </p>
        </motion.div>
      </div>
    </Section>
    </>
  );
}
