import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Camera, Star, Clock, Heart, Shield, MessageCircle } from 'lucide-react'
import { seoConfig } from '@/lib/seo/config'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateServiceSchema, generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  ...seoConfig.defaultMetadata,
  title: seoConfig.pages.photographeMariage.title,
  description: seoConfig.pages.photographeMariage.description,
  keywords: [...seoConfig.pages.photographeMariage.keywords],
  alternates: { canonical: '/photographe-mariage' },
  openGraph: {
    ...seoConfig.defaultMetadata.openGraph,
    images: seoConfig.defaultMetadata.openGraph?.images ? [...seoConfig.defaultMetadata.openGraph.images] : undefined,
    title: seoConfig.pages.photographeMariage.title,
    description: seoConfig.pages.photographeMariage.description,
  },
}

const styles = [
  {
    name: 'Reportage',
    desc: 'Moments spontanés et authentiques, sans mise en scène. L\'histoire de votre journée telle qu\'elle s\'est vraiment passée.',
  },
  {
    name: 'Posé & classique',
    desc: 'Portraits soignés et compositions élégantes. Idéal pour un mariage traditionnel et raffiné.',
  },
  {
    name: 'Lifestyle',
    desc: 'La spontanéité guidée. Des mises en situation naturelles pour des images vivantes et chaleureuses.',
  },
  {
    name: 'Fine art',
    desc: 'Traitement lumineux, esthétique film ou argentique. Tendance pour les mariages bohèmes et champêtres.',
  },
  {
    name: 'Multiculturel',
    desc: 'Spécialiste des cérémonies mixtes (franco-africain, franco-indien, franco-maghrébin...). Chaque tradition est valorisée.',
  },
]

const faqs = [
  {
    question: 'Quel est le prix d\'un photographe de mariage en France ?',
    answer: 'Les tarifs varient de 800 € pour un photographe débutant à plus de 5 000 € pour un professionnel reconnu. Le budget moyen est de 1 800 à 2 500 € pour une journée complète. Prévoyez 8 à 12 % de votre budget mariage total.',
  },
  {
    question: 'Combien de temps à l\'avance réserver son photographe de mariage ?',
    answer: 'Les bons photographes se réservent 12 à 18 mois à l\'avance, surtout en saison (mai à septembre). Dès que vous avez votre date, commencez vos recherches.',
  },
  {
    question: 'Combien de photos reçoit-on après un mariage ?',
    answer: 'En général, vous recevez entre 400 et 800 photos retouchées pour une journée complète. Certains photographes livrent plus selon leur style (reportage vs posé).',
  },
  {
    question: 'Quelle est la différence entre photographe et vidéaste mariage ?',
    answer: 'Le photographe capture des instants figés ; le vidéaste crée un film de votre journée (généralement 3 à 8 minutes). Beaucoup de couples optent pour les deux. Certains professionnels proposent les deux prestations.',
  },
  {
    question: 'Comment choisir le bon style de photographie pour son mariage ?',
    answer: 'Créez un dossier d\'inspiration sur Pinterest ou Instagram avec des photos qui vous touchent. Identifiez les styles récurrents (reportage, posé, fine art...) et cherchez un photographe dont le portfolio correspond à cette esthétique.',
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
  { name: 'Prestataires mariage', url: '/prestataires-mariage' },
  { name: 'Photographe mariage', url: '/photographe-mariage' },
])

const serviceSchema = generateServiceSchema({
  name: 'Photographe mariage',
  description: 'NUPLY vous met en relation avec les meilleurs photographes mariage vérifiés en France. Comparez les styles, les tarifs et obtenez des devis personnalisés.',
  serviceType: 'Wedding Photography',
})

export default function PhotographeMariagePage() {
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
              <Link href="/prestataires-mariage" className="hover:text-[#823F91] transition-colors">Prestataires mariage</Link>
              <span className="mx-2">/</span>
              <span className="text-[#4A3A2E] font-medium">Photographe mariage</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#823F91]/10 text-[#823F91] text-sm font-semibold mb-6">
              <Camera className="h-4 w-4" />
              Photographes vérifiés
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2C1810] mb-6 leading-tight">
              Trouvez votre{' '}
              <span className="text-[#823F91]">photographe de mariage</span>{' '}
              idéal
            </h1>

            <p className="text-lg sm:text-xl text-[#4A3A2E] max-w-2xl mx-auto mb-8 leading-relaxed">
              Vos photos de mariage traverseront des décennies. NUPLY vous met en relation avec des photographes
              professionnels vérifiés, adaptés à votre style et votre budget.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#823F91] text-white rounded-xl font-semibold text-base hover:bg-[#6D3478] transition-colors"
              >
                Trouver mon photographe
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/blog/choisir-photographe-mariage"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-[#823F91] text-[#823F91] rounded-xl font-semibold text-base hover:bg-[#823F91]/5 transition-colors"
              >
                Guide complet
              </Link>
            </div>
          </div>
        </section>

        {/* Prix indicatifs */}
        <section className="py-12 px-4 bg-white border-y border-[#EBE4DA]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-[#2C1810] text-center mb-8">
              Tarifs indicatifs – Photographe mariage en France
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { level: 'Débutant', price: '800 – 1 200 €', desc: 'Portfolio en construction' },
                { level: 'Intermédiaire', price: '1 200 – 2 500 €', desc: 'Expérience confirmée' },
                { level: 'Expérimenté', price: '2 500 – 4 000 €', desc: 'Style affirmé' },
                { level: 'Reconnu', price: '4 000 € +', desc: 'Photographe primé' },
              ].map((tier, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 text-center"
                  style={{ background: `rgba(130,63,145,${0.04 + i * 0.02})` }}
                >
                  <div className="text-xs font-semibold text-[#823F91] mb-1">{tier.level}</div>
                  <div className="text-base font-extrabold text-[#2C1810] mb-1">{tier.price}</div>
                  <div className="text-xs text-[#8B7866]">{tier.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-[#8B7866] mt-4">
              Prix pour une journée complète (cérémonie + réception). Fourchettes indicatives, hors déplacements.
            </p>
          </div>
        </section>

        {/* Styles */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C1810] text-center mb-3">
              Choisir le bon style de photographie
            </h2>
            <p className="text-[#8B7866] text-center max-w-xl mx-auto mb-10">
              Chaque photographe a son univers. Identifiez le style qui correspond à votre vision avant de choisir.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {styles.map((style) => (
                <div
                  key={style.name}
                  className="bg-white rounded-2xl p-5"
                  style={{ boxShadow: '0 2px 8px rgba(130,63,145,0.07), 0 8px 24px rgba(130,63,145,0.04)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-4 w-4 text-[#823F91]" />
                    <span className="font-bold text-[#2C1810]">{style.name}</span>
                  </div>
                  <p className="text-sm text-[#8B7866] leading-relaxed">{style.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Avantages NUPLY */}
        <section className="py-16 px-4 sm:px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C1810] text-center mb-12">
              Pourquoi passer par NUPLY pour votre photographe ?
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Shield,
                  title: 'Photographes 100 % vérifiés',
                  desc: 'Chaque photographe est sélectionné et validé par notre équipe. Vous choisissez parmi des professionnels de confiance.',
                },
                {
                  icon: Star,
                  title: 'Matching selon vos critères',
                  desc: 'Style, région, budget, disponibilité : notre algorithme vous propose uniquement les photographes qui correspondent à votre brief.',
                },
                {
                  icon: MessageCircle,
                  title: 'Messagerie centralisée',
                  desc: 'Échangez directement avec plusieurs photographes depuis votre espace NUPLY. Comparez les offres en un clin d\'œil.',
                },
                {
                  icon: Clock,
                  title: 'Devis rapides et gratuits',
                  desc: 'Envoyez votre brief une seule fois et recevez plusieurs propositions personnalisées sans démarchage chronophage.',
                },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#823F91]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-[#823F91]" />
                    </div>
                    <div>
                      <div className="font-bold text-[#2C1810] mb-1">{item.title}</div>
                      <div className="text-sm text-[#8B7866] leading-relaxed">{item.desc}</div>
                    </div>
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
              Questions fréquentes sur le photographe de mariage
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

            <div className="mt-8 text-center">
              <Link
                href="/blog/choisir-photographe-mariage"
                className="inline-flex items-center gap-2 text-[#823F91] font-semibold hover:underline"
              >
                Lire notre guide complet : choisir son photographe de mariage
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6">
          <div
            className="max-w-3xl mx-auto text-center text-white py-12 px-8 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #823F91, #6D3478)', boxShadow: '0 8px 32px rgba(130,63,145,0.25)' }}
          >
            <Camera className="h-10 w-10 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Trouvez votre photographe de mariage
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8">
              Créez votre compte gratuit sur NUPLY, remplissez votre brief et recevez des propositions de photographes vérifiés adaptés à votre projet.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#823F91] rounded-xl font-bold hover:bg-white/90 transition-colors"
            >
              Commencer gratuitement
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

      </div>
    </>
  )
}
