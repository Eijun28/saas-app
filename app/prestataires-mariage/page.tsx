import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Camera, Music, ChefHat, Flower2, MapPin, Sparkles, Star, Users } from 'lucide-react'
import { seoConfig } from '@/lib/seo/config'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateServiceSchema, generateBreadcrumbSchema } from '@/lib/seo/structured-data'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  ...seoConfig.defaultMetadata,
  title: seoConfig.pages.prestatairesMarriage.title,
  description: seoConfig.pages.prestatairesMarriage.description,
  keywords: [...seoConfig.pages.prestatairesMarriage.keywords],
  alternates: { canonical: '/prestataires-mariage' },
  openGraph: {
    ...seoConfig.defaultMetadata.openGraph,
    images: seoConfig.defaultMetadata.openGraph?.images ? [...seoConfig.defaultMetadata.openGraph.images] : undefined,
    title: seoConfig.pages.prestatairesMarriage.title,
    description: seoConfig.pages.prestatairesMarriage.description,
  },
}

const categories = [
  {
    icon: Camera,
    title: 'Photographe & Vidéaste',
    description: 'Immortalisez chaque instant de votre jour J avec des professionnels passionnés.',
    keywords: ['photographe mariage', 'vidéaste mariage', 'reportage photo'],
    href: '/photographe-mariage',
    color: '#823F91',
  },
  {
    icon: ChefHat,
    title: 'Traiteur',
    description: 'Régalez vos invités avec un menu raffiné, du cocktail au dîner assis.',
    keywords: ['traiteur mariage', 'buffet mariage', 'cocktail réception'],
    href: '/blog/guide-preparation-mariage-couples',
    color: '#9B59B6',
  },
  {
    icon: Music,
    title: 'DJ & Groupe de musique',
    description: 'Faites danser vos invités jusqu\'au bout de la nuit avec le bon prestataire musical.',
    keywords: ['DJ mariage', 'groupe musique mariage', 'animation mariage'],
    href: '/blog/guide-preparation-mariage-couples',
    color: '#7D3C98',
  },
  {
    icon: MapPin,
    title: 'Salle & Domaine',
    description: 'Châteaux, domaines, salles des fêtes : trouvez le lieu qui correspond à votre vision.',
    keywords: ['salle mariage', 'domaine mariage', 'château mariage'],
    href: '/blog/trouver-salle-mariage',
    color: '#6C3483',
  },
  {
    icon: Flower2,
    title: 'Fleuriste & Décoration',
    description: 'Bouquets, arches florales, centres de table : sublimez votre réception.',
    keywords: ['fleuriste mariage', 'décoration mariage', 'fleurs mariage'],
    href: '/blog/guide-preparation-mariage-couples',
    color: '#A569BD',
  },
  {
    icon: Sparkles,
    title: 'Wedding Planner',
    description: 'Confiez l\'organisation de votre mariage à un expert et profitez de chaque instant.',
    keywords: ['wedding planner', 'coordinateur mariage', 'organisateur mariage'],
    href: '/organisation-mariage',
    color: '#884EA0',
  },
]

const faqs = [
  {
    question: 'Comment trouver des prestataires mariage vérifiés ?',
    answer: 'NUPLY sélectionne et vérifie chaque prestataire avant de l\'intégrer à la plateforme. Vous pouvez consulter leurs profils, leurs avis et contacter directement via notre messagerie.',
  },
  {
    question: 'Combien coûte en moyenne un prestataire mariage ?',
    answer: 'Les tarifs varient selon la catégorie : photographe (1 200 à 4 000 €), traiteur (50 à 150 € par personne), DJ (800 à 2 500 €), wedding planner (1 000 à 15 000 €). NUPLY vous permet de comparer les offres et d\'obtenir des devis personnalisés.',
  },
  {
    question: 'NUPLY propose-t-il des prestataires pour les mariages multiculturels ?',
    answer: 'Oui. NUPLY est spécialisé dans les mariages multiculturels (franco-africain, franco-maghrébin, franco-indien, franco-asiatique...). De nombreux prestataires de la plateforme ont une expertise spécifique dans ces cérémonies mixtes.',
  },
  {
    question: 'À quelle date doit-on réserver ses prestataires ?',
    answer: 'Le plus tôt possible ! Les meilleurs prestataires (photographe, salle, traiteur) se réservent 12 à 18 mois à l\'avance pour les dates de saison (mai à septembre). Commencez vos recherches dès la confirmation de votre date.',
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
])

const serviceSchema = generateServiceSchema({
  name: 'Mise en relation prestataires mariage',
  description: 'NUPLY connecte les couples avec les meilleurs prestataires mariage vérifiés en France : photographes, traiteurs, DJ, wedding planners et salles de réception.',
  serviceType: 'Wedding Planning',
})

export default function PrestatairesMarriagePage() {
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
              <span className="text-[#4A3A2E] font-medium">Prestataires mariage</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#823F91]/10 text-[#823F91] text-sm font-semibold mb-6">
              <Star className="h-4 w-4" />
              Prestataires vérifiés
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2C1810] mb-6 leading-tight">
              Trouvez vos{' '}
              <span className="text-[#823F91]">prestataires mariage</span>{' '}
              vérifiés en France
            </h1>

            <p className="text-lg sm:text-xl text-[#4A3A2E] max-w-2xl mx-auto mb-8 leading-relaxed">
              Photographe, traiteur, DJ, salle de réception, wedding planner... NUPLY vous met en relation
              avec les meilleurs professionnels du mariage, adaptés à votre style, votre budget et votre région.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#823F91] text-white rounded-xl font-semibold text-base hover:bg-[#6D3478] transition-colors"
              >
                Trouver mes prestataires
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-[#823F91] text-[#823F91] rounded-xl font-semibold text-base hover:bg-[#823F91]/5 transition-colors"
              >
                Lire nos conseils
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-10 px-4 bg-white border-y border-[#EBE4DA]">
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '100 %', label: 'Prestataires vérifiés' },
              { value: '6', label: 'Catégories de prestataires' },
              { value: '0 €', label: 'Inscription couple' },
              { value: '1', label: 'Plateforme tout-en-un' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#823F91]">{stat.value}</div>
                <div className="text-sm text-[#8B7866] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C1810] text-center mb-3">
              Tous vos prestataires mariage au même endroit
            </h2>
            <p className="text-[#8B7866] text-center max-w-xl mx-auto mb-12">
              Comparez les profils, lisez les avis et obtenez des devis personnalisés directement depuis NUPLY.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((cat) => {
                const Icon = cat.icon
                return (
                  <Link
                    key={cat.title}
                    href={cat.href}
                    className="group bg-white rounded-2xl p-6 transition-all duration-200 hover:translate-y-[-2px]"
                    style={{ boxShadow: '0 2px 8px rgba(130,63,145,0.07), 0 8px 24px rgba(130,63,145,0.05)' }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `${cat.color}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: cat.color }} />
                    </div>
                    <h3 className="text-base font-bold text-[#2C1810] group-hover:text-[#823F91] transition-colors mb-2">
                      {cat.title}
                    </h3>
                    <p className="text-sm text-[#8B7866] leading-relaxed mb-3">
                      {cat.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.keywords.slice(0, 2).map(kw => (
                        <span key={kw} className="text-[11px] px-2 py-0.5 rounded-full bg-[#823F91]/8 text-[#823F91] font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Pourquoi NUPLY */}
        <section className="py-16 px-4 sm:px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C1810] text-center mb-12">
              Pourquoi choisir NUPLY pour vos prestataires mariage ?
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  title: 'Prestataires 100 % vérifiés',
                  desc: 'Chaque professionnel est sélectionné et validé par notre équipe avant d\'apparaître sur la plateforme.',
                },
                {
                  title: 'Matching intelligent',
                  desc: 'Notre algorithme vous propose les prestataires les plus adaptés à votre style, votre budget et votre région.',
                },
                {
                  title: 'Tout centralisé',
                  desc: 'Budget, planning, messagerie, devis : gérez tout votre mariage depuis une seule interface.',
                },
                {
                  title: 'Spécialiste multiculturel',
                  desc: 'NUPLY est conçu pour les mariages multiculturels. Trouvez des prestataires qui comprennent vos traditions.',
                },
                {
                  title: 'Devis gratuit et sans engagement',
                  desc: 'Envoyez votre brief à plusieurs prestataires simultanément et comparez leurs propositions.',
                },
                {
                  title: 'Accompagnement de A à Z',
                  desc: 'De la recherche des prestataires jusqu\'au jour J, NUPLY vous accompagne à chaque étape.',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-[#823F91] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-[#2C1810] mb-1">{item.title}</div>
                    <div className="text-sm text-[#8B7866] leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C1810] text-center mb-10">
              Questions fréquentes sur les prestataires mariage
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

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6">
          <div
            className="max-w-3xl mx-auto text-center text-white py-12 px-8 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #823F91, #6D3478)', boxShadow: '0 8px 32px rgba(130,63,145,0.25)' }}
          >
            <Users className="h-10 w-10 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Commencez à trouver vos prestataires mariage
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8">
              Créez votre compte gratuitement et accédez à des centaines de prestataires vérifiés adaptés à votre projet de mariage.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#823F91] rounded-xl font-bold hover:bg-white/90 transition-colors"
            >
              Créer mon compte gratuit
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

      </div>
    </>
  )
}
