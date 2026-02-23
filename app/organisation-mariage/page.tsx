import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, ClipboardList, DollarSign, Calendar, MessageCircle, Users, Sparkles } from 'lucide-react'
import { seoConfig } from '@/lib/seo/config'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateServiceSchema, generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  ...seoConfig.defaultMetadata,
  title: seoConfig.pages.organisationMariage.title,
  description: seoConfig.pages.organisationMariage.description,
  keywords: [...seoConfig.pages.organisationMariage.keywords],
  alternates: { canonical: '/organisation-mariage' },
  openGraph: {
    ...seoConfig.defaultMetadata.openGraph,
    title: seoConfig.pages.organisationMariage.title,
    description: seoConfig.pages.organisationMariage.description,
  },
}

const steps = [
  {
    num: '01',
    title: 'Définir votre vision et budget',
    desc: 'Style de mariage, nombre d\'invités, enveloppe budgétaire globale. Ces décisions structurent toute l\'organisation.',
    link: '/blog/budget-mariage-comment-economiser',
    linkLabel: 'Guide budget mariage',
  },
  {
    num: '02',
    title: 'Réserver le lieu et la date',
    desc: 'C\'est la première décision concrète. Elle conditionne tout le reste. Réservez 12 à 18 mois à l\'avance pour les saisons populaires.',
    link: '/blog/trouver-salle-mariage',
    linkLabel: 'Trouver sa salle de mariage',
  },
  {
    num: '03',
    title: 'Sélectionner vos prestataires',
    desc: 'Photographe, traiteur, DJ, fleuriste... Choisissez et réservez vos prestataires clés le plus tôt possible.',
    link: '/prestataires-mariage',
    linkLabel: 'Trouver mes prestataires',
  },
  {
    num: '04',
    title: 'Gérer les invitations et le plan de table',
    desc: 'Save-the-date, faire-part, liste d\'invités, RSVP, plan de table. Une logistique qui demande de la rigueur.',
    link: '/blog/checklist-ultime-jour-j',
    linkLabel: 'Check-list mariage',
  },
  {
    num: '05',
    title: 'Planifier le jour J',
    desc: 'Rétroplanning minute par minute, coordination entre prestataires, plan B météo. Anticipez chaque scénario.',
    link: '/blog/checklist-ultime-jour-j',
    linkLabel: 'Voir la check-list',
  },
  {
    num: '06',
    title: 'Profiter de votre mariage',
    desc: 'Tout est organisé. Il n\'y a plus qu\'à vivre ce moment unique. NUPLY gère la coordination des prestataires en coulisses.',
    link: '/sign-up',
    linkLabel: 'Commencer gratuitement',
  },
]

const features = [
  {
    icon: ClipboardList,
    title: 'Check-list personnalisée',
    desc: 'Une liste de tâches adaptée à votre date et votre profil. Ne ratez plus aucune étape.',
  },
  {
    icon: DollarSign,
    title: 'Suivi de budget en temps réel',
    desc: 'Visualisez vos dépenses par catégorie et recevez des alertes si vous dépassez votre enveloppe.',
  },
  {
    icon: Calendar,
    title: 'Timeline & planning',
    desc: 'Votre rétroplanning mariage centralisé : des grandes étapes jusqu\'au déroulé minute par minute du jour J.',
  },
  {
    icon: MessageCircle,
    title: 'Messagerie prestataires',
    desc: 'Tous vos échanges avec les prestataires au même endroit. Finis les emails perdus dans le fil de conversation.',
  },
  {
    icon: Users,
    title: 'Gestion des invités',
    desc: 'Liste d\'invités, gestion des RSVP, régimes alimentaires, hébergement : tout est tracé.',
  },
  {
    icon: Sparkles,
    title: 'Matching prestataires',
    desc: 'Notre algorithme vous propose les prestataires les plus adaptés à votre style, région et budget.',
  },
]

const faqs = [
  {
    question: 'Par où commencer pour organiser son mariage ?',
    answer: 'Commencez par définir votre budget global et votre nombre d\'invités approximatif. Ces deux données conditionnent toutes les décisions suivantes (choix du lieu, du traiteur, etc.). Ensuite, fixez une date et réservez votre lieu de réception — c\'est la première décision concrète qui lancera le reste de l\'organisation.',
  },
  {
    question: 'Combien de temps à l\'avance faut-il commencer à organiser son mariage ?',
    answer: 'Idéalement 12 à 18 mois pour une saison haute (mai-septembre). Pour une date hors saison, 8 à 12 mois peuvent suffire. Certains lieux très recherchés se réservent 2 ans à l\'avance.',
  },
  {
    question: 'Faut-il un wedding planner pour organiser son mariage ?',
    answer: 'Non, un wedding planner n\'est pas indispensable. Avec les bons outils (comme NUPLY) et de l\'organisation, vous pouvez tout gérer vous-même. En revanche, une coordination jour J (prestataire présent le jour du mariage pour coordonner les équipes) est fortement recommandée pour profiter sereinement de votre journée.',
  },
  {
    question: 'Quel est le coût moyen d\'un mariage en France en 2026 ?',
    answer: 'Le budget moyen d\'un mariage en France est de 15 000 à 25 000 € pour un mariage de 80 à 120 personnes. Les régions et les prestataires choisis font fortement varier ce montant (Paris et Île-de-France sont 30 à 50 % plus chers que la province).',
  },
  {
    question: 'Comment gérer son budget mariage efficacement ?',
    answer: 'Définissez un plafond par poste (lieu, traiteur, photographe, etc.) et respectez-le. Utilisez un outil de suivi budgétaire comme le module Budget de NUPLY pour enregistrer chaque acompte et dépense en temps réel. Prévoyez toujours 10 % d\'imprévus.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Accueil', url: '/' },
  { name: 'Organisation mariage', url: '/organisation-mariage' },
])

const serviceSchema = generateServiceSchema({
  name: 'Organisation de mariage',
  description: 'NUPLY vous aide à organiser votre mariage de A à Z : checklist, budget, prestataires vérifiés, planning, messagerie. Tout votre mariage au même endroit.',
  serviceType: 'Wedding Planning',
})

export default function OrganisationMariagePage() {
  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema, serviceSchema]} />

      <div className="min-h-screen bg-[#FBF8F3]">

        {/* Hero */}
        <section className="pt-24 pb-16 px-4 sm:px-6 text-center bg-gradient-to-b from-[#823F91]/5 to-transparent">
          <div className="max-w-4xl mx-auto">
            <nav className="text-sm text-[#8B7866] mb-6" aria-label="Fil d'Ariane">
              <Link href="/" className="hover:text-[#823F91] transition-colors">Accueil</Link>
              <span className="mx-2">/</span>
              <span className="text-[#4A3A2E] font-medium">Organisation mariage</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#823F91]/10 text-[#823F91] text-sm font-semibold mb-6">
              <ClipboardList className="h-4 w-4" />
              Tout-en-un
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2C1810] mb-6 leading-tight">
              Organisez votre{' '}
              <span className="text-[#823F91]">mariage</span>{' '}
              sereinement, de A à Z
            </h1>

            <p className="text-lg sm:text-xl text-[#4A3A2E] max-w-2xl mx-auto mb-8 leading-relaxed">
              NUPLY centralise tout ce dont vous avez besoin pour organiser votre mariage : check-list, budget,
              recherche de prestataires, planning et messagerie. Sans stress, sans oubli.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#823F91] text-white rounded-xl font-semibold text-base hover:bg-[#6D3478] transition-colors"
              >
                Commencer gratuitement
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/blog/guide-preparation-mariage-couples"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-[#823F91] text-[#823F91] rounded-xl font-semibold text-base hover:bg-[#823F91]/5 transition-colors"
              >
                Guide complet 2026
              </Link>
            </div>
          </div>
        </section>

        {/* Étapes */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C1810] text-center mb-3">
              Les 6 étapes clés de l'organisation mariage
            </h2>
            <p className="text-[#8B7866] text-center max-w-xl mx-auto mb-12">
              Suivez ces étapes dans l'ordre pour organiser votre mariage sans stress et sans oubli.
            </p>

            <div className="space-y-5">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 flex gap-5 items-start"
                  style={{ boxShadow: '0 2px 8px rgba(130,63,145,0.07), 0 8px 24px rgba(130,63,145,0.04)' }}
                >
                  <div
                    className="text-lg font-black text-[#823F91] min-w-[36px] pt-0.5"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#2C1810] mb-1">{step.title}</h3>
                    <p className="text-sm text-[#8B7866] leading-relaxed mb-3">{step.desc}</p>
                    <Link
                      href={step.link}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#823F91] hover:underline"
                    >
                      {step.linkLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features NUPLY */}
        <section className="py-16 px-4 sm:px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C1810] text-center mb-3">
              NUPLY : la plateforme d'organisation mariage tout-en-un
            </h2>
            <p className="text-[#8B7866] text-center max-w-xl mx-auto mb-12">
              Tout ce dont vous avez besoin pour organiser votre mariage, au même endroit.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl p-6"
                    style={{ background: 'rgba(130,63,145,0.04)', border: '1px solid rgba(130,63,145,0.08)' }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#823F91]/10 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-[#823F91]" />
                    </div>
                    <h3 className="font-bold text-[#2C1810] mb-2">{feature.title}</h3>
                    <p className="text-sm text-[#8B7866] leading-relaxed">{feature.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C1810] text-center mb-10">
              Questions fréquentes sur l'organisation du mariage
            </h2>
            <div className="space-y-5">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6"
                  style={{ boxShadow: '0 1px 4px rgba(44,24,16,0.04), 0 4px 16px rgba(130,63,145,0.05)' }}
                >
                  <h3 className="font-bold text-[#2C1810] mb-2">{faq.question}</h3>
                  <p className="text-sm text-[#8B7866] leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Liens articles */}
        <section className="py-12 px-4 sm:px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-[#2C1810] text-center mb-8">
              Nos guides pour organiser votre mariage
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Guide complet : préparer son mariage', href: '/blog/guide-preparation-mariage-couples', tag: 'Organisation' },
                { title: 'Budget mariage : répartition et économies', href: '/blog/budget-mariage-comment-economiser', tag: 'Budget' },
                { title: 'Trouver la salle de mariage parfaite', href: '/blog/trouver-salle-mariage', tag: 'Lieu' },
                { title: 'Check-list ultime pour le jour J', href: '/blog/checklist-ultime-jour-j', tag: 'Jour J' },
                { title: 'Wedding planner ou organisation solo ?', href: '/blog/wedding-planner-ou-organisation-solo', tag: 'Conseils' },
                { title: 'Tendances mariage 2026', href: '/blog/tendances-mariage-2026', tag: 'Inspiration' },
              ].map((article, i) => (
                <Link
                  key={i}
                  href={article.href}
                  className="group bg-[#FBF8F3] rounded-xl p-4 hover:bg-[#823F91]/5 transition-colors"
                >
                  <span className="text-[11px] font-semibold text-[#823F91] block mb-2">{article.tag}</span>
                  <span className="text-sm font-semibold text-[#2C1810] group-hover:text-[#823F91] transition-colors leading-snug flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {article.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6">
          <div
            className="max-w-3xl mx-auto text-center text-white py-12 px-8 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #823F91, #6D3478)', boxShadow: '0 8px 32px rgba(130,63,145,0.25)' }}
          >
            <ClipboardList className="h-10 w-10 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Commencez à organiser votre mariage
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8">
              Créez votre compte gratuit sur NUPLY et accédez à tous les outils pour organiser votre mariage sereinement : check-list, budget, prestataires vérifiés et planning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#823F91] rounded-xl font-bold hover:bg-white/90 transition-colors"
              >
                Créer mon compte gratuit
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/tarifs"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/40 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
