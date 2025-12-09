'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { CircleCheck, Sparkles, Filter, Shield, UserCheck, TrendingUp, Settings, Gift } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const couplePlans = [
  {
    id: 'gratuit',
    name: 'Gratuit',
    description: 'Parfait pour commencer votre projet',
    monthlyPrice: '0€',
    yearlyPrice: '0€',
    features: [
      { text: 'Matching basique' },
      { text: 'Accès application' },
      { text: 'Recherche limitée' },
      { text: 'Profil personnalisé' },
      { text: 'Accès à la communauté' },
    ],
    button: {
      text: 'Commencer',
      url: '/sign-up',
    },
  },
]

const prestatairePlans = [
  {
    id: 'decouverte',
    name: 'Découverte',
    description: 'Parfait pour débuter sur la plateforme',
    monthlyPrice: '0€',
    hasFreeTrial: false,
    features: [
      { text: 'Présence basique' },
      { text: 'Profil public simple' },
      { text: 'Fonctionnalités limitées' },
      { text: 'Visibilité standard' },
    ],
    button: {
      text: 'Commencer gratuitement',
      url: '/sign-up',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les prestataires professionnels',
    monthlyPrice: '49€',
    hasFreeTrial: true,
    features: [
      { text: 'Fiche prestataire avancée' },
      { text: 'Visibilité renforcée' },
      { text: 'Accès tableau de bord complet' },
      { text: 'Priorité dans le matching' },
      { text: 'Statistiques basiques' },
      { text: 'Support standard' },
    ],
    button: {
      text: 'Essayer gratuitement',
      url: '/sign-up',
    },
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Solution complète pour maximiser votre visibilité',
    monthlyPrice: '79€',
    hasFreeTrial: true,
    features: [
      { text: 'Mise en avant premium' },
      { text: 'Gestion complète des demandes' },
      { text: 'Statistiques détaillées avancées' },
      { text: 'Support prioritaire 24/7' },
      { text: 'Booster de visibilité illimité' },
      { text: 'Badge "Prestataire Vérifié"' },
      { text: 'Accès aux fonctionnalités beta' },
    ],
    button: {
      text: 'Essayer gratuitement',
      url: '/sign-up',
    },
    popular: true,
  },
]

const benefits = [
  {
    icon: Sparkles,
    title: 'Matching IA',
    description: 'Trouvez les prestataires parfaits grâce à notre intelligence artificielle',
  },
  {
    icon: Filter,
    title: 'Filtres avancés',
    description: 'Affinez votre recherche selon vos critères précis',
  },
  {
    icon: Shield,
    title: 'Prestataires vérifiés',
    description: 'Tous nos prestataires sont vérifiés et qualifiés',
  },
  {
    icon: UserCheck,
    title: 'Profil optimisé',
    description: 'Mettez en valeur votre profil pour attirer les meilleurs clients',
  },
  {
    icon: TrendingUp,
    title: 'Visibilité plus élevée',
    description: 'Augmentez votre visibilité et votre taux de conversion',
  },
  {
    icon: Settings,
    title: 'Gestion simplifiée',
    description: 'Tout centralisé : demandes, agenda, messagerie',
  },
]

const faqs = [
  {
    question: 'Puis-je changer de formule à tout moment ?',
    answer: 'Oui, vous pouvez changer de formule à tout moment depuis votre tableau de bord. Les changements prennent effet immédiatement.',
  },
  {
    question: 'Comment fonctionne le mois gratuit ?',
    answer: 'Pour les formules Pro et Premium, vous bénéficiez d\'un mois d\'essai gratuit sans engagement. Aucun paiement ne sera effectué pendant cette période, et vous pouvez annuler à tout moment.',
  },
  {
    question: 'Y a-t-il des frais cachés ?',
    answer: 'Non, tous nos prix sont transparents. Il n\'y a pas de frais cachés, pas de frais de transaction supplémentaires.',
  },
  {
    question: 'Que se passe-t-il si j\'annule mon abonnement ?',
    answer: 'Vous pouvez annuler votre abonnement à tout moment. Vous garderez l\'accès jusqu\'à la fin de votre période de facturation.',
  },
  {
    question: 'Les prix incluent-ils la TVA ?',
    answer: 'Oui, tous les prix affichés incluent la TVA applicable en France.',
  },
]

function PricingContent({ plans, isPrestataire = false }: { plans: typeof couplePlans | typeof prestatairePlans, isPrestataire?: boolean }) {
  return (
    <div className="flex flex-col items-stretch gap-8 md:flex-row justify-center w-full">
      {plans.map((plan: any) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="relative"
        >
          <Card
            className={`flex w-full md:w-80 flex-col justify-between text-left transition-all duration-300 ${
              plan.popular 
                ? 'border-[#823F91] shadow-lg shadow-purple-500/20 ring-2 ring-[#823F91]/20' 
                : 'border-border/10 hover:shadow-xl hover:shadow-purple-500/10'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white px-4 py-1 text-xs font-semibold">
                  ⭐ Plus populaire
                </Badge>
              </div>
            )}

            <CardHeader className="pb-6">
              <CardTitle>
                <p className="text-2xl font-bold">{plan.name}</p>
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                {plan.description}
              </p>
              <div className="flex items-end mt-4">
                <span className="text-4xl font-semibold">
                  {plan.monthlyPrice}
                </span>
                <span className="text-muted-foreground text-xl font-medium">
                  /mois
                </span>
              </div>
              
              {plan.hasFreeTrial && (
                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-[#823F91]">
                  <Gift className="h-4 w-4" />
                  <span>1er mois gratuit</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="px-6 pb-6">
              <Separator className="mb-6" />
              {plan.id === 'premium' && isPrestataire && (
                <p className="mb-3 font-semibold text-sm text-gray-700">
                  Tout dans Pro, et :
                </p>
              )}
              <ul className="space-y-4">
                {plan.features.map((feature: any, index: number) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <CircleCheck className="size-4 text-[#823F91] flex-shrink-0" />
                    <span>{feature.text}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="mt-auto px-6 pb-6">
              <Button 
                asChild 
                className={`w-full transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:shadow-lg hover:shadow-purple-500/30'
                    : 'bg-[#823F91] hover:bg-[#6D3478]'
                }`}
              >
                <Link href={plan.button.url}>
                  {plan.button.text}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Pricing Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-pretty text-4xl font-semibold lg:text-6xl"
            >
              Tarifs
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-muted-foreground lg:text-xl"
            >
              Choisissez la formule adaptée à vos besoins
            </motion.p>

            <Tabs defaultValue="couples" className="w-full">
              {/* Toggle Role */}
              <div className="flex justify-center mb-12">
                <TabsList className="h-12 px-1 bg-gray-100 rounded-xl">
                  <TabsTrigger value="couples" className="px-6 py-2 text-sm font-medium rounded-lg">
                    Couples
                  </TabsTrigger>
                  <TabsTrigger value="prestataires" className="px-6 py-2 text-sm font-medium rounded-lg">
                    Prestataires
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Pricing Cards */}
              <TabsContent value="couples" className="mt-0">
                <PricingContent plans={couplePlans} isPrestataire={false} />
              </TabsContent>

              <TabsContent value="prestataires" className="mt-0">
                <PricingContent plans={prestatairePlans} isPrestataire={true} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-white to-purple-50/30">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-semibold text-gray-900 mb-4">
              Ce que vous obtenez avec Nuply
            </h2>
            <p className="text-muted-foreground text-lg">
              Des fonctionnalités pensées pour simplifier votre organisation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:shadow-purple-500/10 transition-all duration-300 p-6"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#9D5FA8]/10 to-[#823F91]/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-[#823F91]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 bg-white">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-semibold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-muted-foreground text-lg">
              Tout ce que vous devez savoir sur nos offres
            </p>
          </motion.div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="rounded-xl border border-gray-200 bg-white px-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  )
}