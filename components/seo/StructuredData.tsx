'use client'

export function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nuply.com' // ⚠️ REMPLACER par votre domaine

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NUPLY',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.svg`, // ⚠️ REMPLACER si votre logo est ailleurs
    description: 'Plateforme mariage next-gen avec matching IA, prestataires vérifiés, gestion budget et timeline',
    sameAs: [
      // ⚠️ AJOUTER vos réseaux sociaux
      // 'https://www.facebook.com/nuply',
      // 'https://www.instagram.com/nuply',
      // 'https://www.linkedin.com/company/nuply',
      // 'https://twitter.com/nuply',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      // email: 'contact@nuply.com', // ⚠️ AJOUTER votre email
      availableLanguage: ['French'],
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NUPLY',
    url: baseUrl,
    description: 'La plateforme mariage next-gen - Matching IA, prestataires vérifiés, budget, timeline',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/couple/recherche?q={search_term_string}`, // ⚠️ REMPLACER si votre route de recherche est différente
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  )
}

