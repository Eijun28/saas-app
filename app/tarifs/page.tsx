'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PricingColumn, PricingColumnProps } from '@/components/ui/pricing-column';
import { Section } from '@/components/ui/section';
import Particles from '@/components/Particles';
import { CheckoutButton } from '@/components/stripe/CheckoutButton';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';

export default function PricingSection() {
  const [userType, setUserType] = useState<'couples' | 'prestataires'>('couples');
  const [billingPeriod, setBillingPeriod] = useState<'day' | 'month'>('month');
  const { user } = useUser();
  const router = useRouter();

  // Plan unique pour les couples
  const couplesPricing: PricingColumnProps[] = [
    {
      name: "Gratuit",
      description: "Tout ce dont vous avez besoin pour trouver vos prestataires parfaits.",
      price: 0,
      priceNote: "Gratuit pour toujours",
      billingPeriod: "month",
      cta: {
        variant: "default",
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
      variant: "default",
    },
  ];

  // Fonction pour calculer le prix selon la période
  const calculatePrice = (monthlyPrice: number, period: 'day' | 'month'): number => {
    if (period === 'day') {
      return monthlyPrice / 30; // Approximation : 30 jours par mois
    }
    return monthlyPrice;
  };

  // Plans pour les prestataires (prix mensuels de base)
  const prestatairesPricingBase: Array<Omit<PricingColumnProps, 'price' | 'billingPeriod'> & { monthlyPrice: number; comingSoon?: boolean }> = [
    {
      name: "PACK STARTER",
      description: "Pour tester NUPLY",
      monthlyPrice: 0,
      priceNote: "Gratuit pour toujours",
      cta: {
        variant: "outline",
        label: user ? "Activer Starter" : "S'inscrire et activer Starter",
        href: "/sign-up?plan=starter",
      },
      features: [
        "Profil prestataire basique (10 photos)",
        "5 demandes de contact/mois",
        "Messagerie avec couples (48h de délai de réponse max)",
        "Visibilité dans les résultats de recherche",
      ],
      variant: "default",
    },
    {
      name: "PACK PRO",
      icon: <User className="size-4" />,
      description: "L'essentiel pour réussir sur NUPLY",
      monthlyPrice: 59,
      priceNote: "",
      cta: {
        variant: "default",
        label: user ? "Activer Pro" : "S'inscrire et activer Pro",
        href: user ? undefined : "/sign-up?plan=pro",
        planType: "pro",
        onClick: user ? undefined : () => router.push("/sign-up?plan=pro"),
      },
      features: [
        "Demandes illimitées",
        "Galerie professionnelle (40 photos + 3 vidéos)",
        "Calendrier de disponibilités synchronisé",
        "Intégration Google Calendar (sync auto)",
        "Système de devis en ligne",
        "Messagerie instantanée",
        "Tableau de bord analytics (conversions, vues)",
        "Badge \"Prestataire Pro\"",
        "Contrats numériques avec signature",
        "Paiements en ligne + acomptes sécurisés",
      ],
      variant: "default",
      comingSoon: true,
    },
    {
      name: "PACK PREMIUM",
      icon: <Users className="size-4" />,
      description: "Pour les prestataires établis",
      monthlyPrice: 89,
      priceNote: "",
      cta: {
        variant: "default",
        label: user ? "Activer Premium" : "S'inscrire et activer Premium",
        href: user ? undefined : "/sign-up?plan=premium",
        planType: "premium",
        onClick: user ? undefined : () => router.push("/sign-up?plan=premium"),
      },
      features: [
        "Tout du pack Pro",
        "Page prestataire personnalisée (mini-site brandé)",
        "Paiements en ligne + acomptes sécurisés",
        "Multi-comptes équipe (jusqu'à 3 utilisateurs)",
        "Galerie illimitée + portfolio interactif",
        "CRM intégré (suivi clients, relances auto)",
        "Support prioritaire + account manager dédié",
        "Exports comptables automatisés",
      ],
      variant: "default",
      comingSoon: true,
    },
  ];

  // Convertir les prix de base en prix selon la période sélectionnée
  const prestatairesPricing: PricingColumnProps[] = prestatairesPricingBase.map(plan => ({
    ...plan,
    price: calculatePrice(plan.monthlyPrice, billingPeriod),
    billingPeriod,
    comingSoon: plan.comingSoon || false,
  }));

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

        {/* Bandeau Offre Gratuite */}
        {userType === 'prestataires' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-2xl"
          >
            <div className="relative overflow-hidden rounded-lg border border-[#823F91]/20 bg-gradient-to-r from-[#823F91]/5 via-[#E8D4EF]/10 to-[#823F91]/5 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-[#823F91]" />
                <span className="text-sm font-medium text-slate-700">
                  <span className="font-semibold text-[#823F91]">Offre de lancement :</span> Gratuit pendant 3 mois
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Toggle Couples / Prestataires */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-4"
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

          {/* Toggle Période de facturation (uniquement pour prestataires) */}
          {userType === 'prestataires' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-slate-200"
            >
              <button
                onClick={() => setBillingPeriod('day')}
                className={cn(
                  "px-4 py-2 rounded-full font-medium text-xs transition-all duration-300",
                  billingPeriod === 'day'
                    ? 'bg-[#823F91] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Par jour
              </button>
              <button
                onClick={() => setBillingPeriod('month')}
                className={cn(
                  "px-4 py-2 rounded-full font-medium text-xs transition-all duration-300",
                  billingPeriod === 'month'
                    ? 'bg-[#823F91] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Par mois
              </button>
            </motion.div>
          )}
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
                <div className="relative flex flex-col h-full">
                  <PricingColumn
                    name={plan.name}
                    icon={plan.icon}
                    description={plan.description}
                    price={plan.price}
                    priceNote={plan.priceNote}
                    billingPeriod={plan.billingPeriod}
                    cta={
                      user && plan.cta.planType && plan.price > 0
                        ? {
                            ...plan.cta,
                            href: undefined,
                            onClick: undefined,
                          }
                        : plan.cta
                    }
                    features={plan.features}
                    variant={plan.variant}
                    className={plan.className}
                    comingSoon={plan.comingSoon}
                  />
                  {user && plan.cta.planType && plan.price > 0 && !plan.comingSoon && (
                    <div className="px-6 pb-6">
                      <CheckoutButton
                        planType={plan.cta.planType}
                        variant={plan.cta.variant}
                        className="w-full mt-4"
                      >
                        {plan.cta.label}
                      </CheckoutButton>
                    </div>
                  )}
                </div>
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
              : "Annulez à tout moment • Aucun engagement"}
          </p>
        </motion.div>
      </div>
    </Section>
    </>
  );
}
