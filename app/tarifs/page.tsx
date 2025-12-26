'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

export default function PricingSection() {
  const [userType, setUserType] = useState<'couples' | 'prestataires'>('couples');

  // Plan unique pour les couples
  const couplesPricing = [
    {
      name: "Gratuit",
      price: "0€",
      period: "à vie",
      description: "Tout ce dont vous avez besoin pour trouver vos prestataires parfaits.",
      features: [
        "Créer votre profil couple",
        "Matching AI par culture et tradition",
        "Messages illimités avec les prestataires",
        "Accès à tous les portfolios",
        "Support par email",
      ],
      cta: "Créer mon compte gratuit",
      ctaLink: "/sign-up",
    },
  ];

  // Plans pour les prestataires
  const prestatairesPricing = [
    {
      name: "Gratuit",
      price: "0€",
      period: "à vie",
      description: "Testez la plateforme sans engagement.",
      features: [
        "Créer votre profil professionnel",
        "Apparaître dans les recherches",
        "Recevoir jusqu'à 3 demandes par mois",
        "Portfolio basique (10 photos max)",
        "Support par email",
      ],
      cta: "Créer mon profil",
      ctaLink: "/sign-up",
    },
    {
      name: "Premium",
      price: "49€",
      period: "/ mois",
      description: "Pour les professionnels qui veulent plus de visibilité.",
      features: [
        "Demandes de contacts illimitées",
        "Portfolio illimité avec galeries privées",
        "Badge professionnel vérifié",
        "Apparition prioritaire dans les matchs",
        "Support prioritaire par email et chat",
      ],
      cta: "Passer Premium",
      ctaLink: "/sign-up?plan=premium",
    },
    {
      name: "Pro",
      price: "79€",
      period: "/ mois",
      description: "Pour dominer votre catégorie et maximiser vos réservations.",
      features: [
        "Tout de Premium, plus :",
        "Position #1 garanti dans votre spécialité",
        "Analytics détaillés et reporting mensuel",
        "Publicité sponsorisée sur la plateforme",
        "Account manager dédié et formation incluse",
      ],
      cta: "Devenir Pro",
      ctaLink: "/sign-up?plan=pro",
    },
  ];

  const currentPricing = userType === 'couples' ? couplesPricing : prestatairesPricing;

  return (
    <section className={`${inter.className} py-20 bg-white`}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-3"
          >
            Tarifs simples et transparents
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base text-slate-600 max-w-2xl mx-auto"
          >
            Pas de frais cachés. Changez ou annulez quand vous voulez.
          </motion.p>
        </div>

        {/* Toggle Couples / Prestataires */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-slate-200">
            <button
              onClick={() => setUserType('couples')}
              className={`
                px-5 py-2 rounded-full font-medium text-sm transition-all duration-300
                ${userType === 'couples'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              Pour les couples
            </button>
            <button
              onClick={() => setUserType('prestataires')}
              className={`
                px-5 py-2 rounded-full font-medium text-sm transition-all duration-300
                ${userType === 'prestataires'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
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
            className={`grid gap-4 max-w-5xl mx-auto ${
              userType === 'couples' 
                ? 'lg:grid-cols-1 max-w-sm' 
                : 'lg:grid-cols-3'
            }`}
          >
            {currentPricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col p-6 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow h-full"
              >
                {/* Nom du plan */}
                <h3 className="text-base font-semibold text-slate-900 mb-4">
                  {plan.name}
                </h3>

                {/* Prix */}
                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-slate-900 tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-slate-500 text-base">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-600 text-sm mb-6 min-h-[2.5rem] leading-snug">
                  {plan.description}
                </p>

                {/* CTA Button */}
                <Link href={plan.ctaLink}>
                  <button className="w-full py-3 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 group mb-6">
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>

                {/* Features List */}
                <ul className="space-y-2.5 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-slate-700 text-sm leading-snug">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <p className="text-slate-600 text-sm">
            {userType === 'couples' 
              ? "Aucune carte bancaire requise • Gratuit pour toujours"
              : "Sans engagement • Résiliable à tout moment"}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
