# PROMPT CURSOR - SEO LANDING PAGE NUPLY

## CONTEXTE
Optimiser le SEO de la landing page NUPLY pour améliorer le référencement Google, les partages sociaux et les Core Web Vitals.

**Objectifs :**
- ✅ Metadata complète (OpenGraph, Twitter Card)
- ✅ Image OG optimisée (1200x630px)
- ✅ Structured Data (JSON-LD)
- ✅ Robots.txt + Sitemap.xml
- ✅ Performance (Core Web Vitals)
- ✅ Accessibilité sémantique

---

## 📝 PARTIE 1 : METADATA COMPLÈTE

### Problème actuel
`app/layout.tsx` n'a que title et description de base. Manque :
- OpenGraph tags
- Twitter Card
- Keywords
- Canonical URL
- Viewport
- Robots meta

### Solution : Metadata optimisée

```typescript
// app/layout.tsx - REMPLACER lignes 18-31

import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL('https://nuply.com'), // ⚠️ REMPLACER par votre domaine de production

  title: {
    default: "NUPLY — La plateforme mariage next-gen",
    template: "%s | NUPLY",
  },

  description: "Matching IA, prestataires vérifiés, budget, timeline, messagerie. Organisez votre mariage en toute sérénité avec NUPLY, la plateforme tout-en-un pour couples modernes.",

  keywords: [
    "mariage",
    "organisation mariage",
    "prestataires mariage",
    "matching IA mariage",
    "plateforme mariage",
    "budget mariage",
    "timeline mariage",
    "photographe mariage",
    "traiteur mariage",
    "DJ mariage",
    "wedding planner",
    "mariage france",
    "préparation mariage",
    "gestion mariage"
  ],

  authors: [{ name: "NUPLY" }],
  creator: "NUPLY",
  publisher: "NUPLY",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // OpenGraph
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://nuply.com', // ⚠️ REMPLACER par votre domaine
    siteName: 'NUPLY',
    title: 'NUPLY — La plateforme mariage next-gen',
    description: 'Matching IA, prestataires vérifiés, budget, timeline, messagerie. Tout le mariage au même endroit.',
    images: [
      {
        url: '/og-image.png', // ⚠️ Image à créer (voir PARTIE 2)
        width: 1200,
        height: 630,
        alt: 'NUPLY - Plateforme mariage next-gen avec matching IA',
        type: 'image/png',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@nuply', // ⚠️ REMPLACER par votre handle Twitter si vous en avez un
    creator: '@nuply',
    title: 'NUPLY — La plateforme mariage next-gen',
    description: 'Matching IA, prestataires vérifiés, budget, timeline, messagerie. Tout le mariage au même endroit.',
    images: ['/og-image.png'], // ⚠️ Image à créer
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons (déjà présents, on les garde)
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // Verification (optionnel)
  // verification: {
  //   google: 'votre-code-google-search-console',
  //   yandex: 'votre-code-yandex',
  // },
};
```

**Important :**
- Remplacer `https://nuply.com` par votre domaine de production
- L'image OG `/og-image.png` sera créée dans la PARTIE 2

---

## 🖼️ PARTIE 2 : IMAGE OPENGRAPH (OG-IMAGE)

### Objectif
Créer une image 1200x630px optimisée pour les partages sociaux (Facebook, Twitter, LinkedIn, WhatsApp).

### Option A : Créer manuellement avec Figma/Canva

**Template recommandé :**
- Dimensions : **1200x630px**
- Background : Gradient violet (#823F91 → #9D5FA8)
- Logo NUPLY centré en haut
- Texte principal : "La plateforme mariage next-gen"
- Sous-texte : "Matching IA • Budget • Timeline • Prestataires vérifiés"
- Éléments visuels : Icônes cœur, alliances, calendrier

**Emplacement :**
```
/public/og-image.png
```

### Option B : Générer automatiquement avec Next.js (Recommandé)

Next.js 14+ permet de générer des OG images dynamiquement avec ImageResponse.

```typescript
// CRÉER UN NOUVEAU FICHIER : app/opengraph-image.tsx

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'NUPLY - Plateforme mariage next-gen'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #823F91 0%, #9D5FA8 100%)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Logo/Titre */}
        <div
          style={{
            display: 'flex',
            fontSize: 120,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.05em',
            marginBottom: 20,
          }}
        >
          NUPLY
        </div>

        {/* Sous-titre */}
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: 40,
          }}
        >
          La plateforme mariage next-gen
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: 'rgba(255, 255, 255, 0.85)',
            gap: 30,
          }}
        >
          <span>✨ Matching IA</span>
          <span>•</span>
          <span>💰 Budget</span>
          <span>•</span>
          <span>📅 Timeline</span>
          <span>•</span>
          <span>✅ Prestataires vérifiés</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
```

**Avantages de l'Option B :**
- Génération automatique
- Texte toujours à jour
- Performance optimale
- Pas besoin de designer

---

## 🏷️ PARTIE 3 : STRUCTURED DATA (JSON-LD)

### Objectif
Aider Google à comprendre votre site avec Schema.org structured data.

### Types de données à implémenter
1. **Organization** : Informations sur NUPLY
2. **WebSite** : Informations sur le site
3. **LocalBusiness** (optionnel si vous avez une adresse physique)

### Actions

```typescript
// CRÉER UN NOUVEAU FICHIER : components/seo/StructuredData.tsx

'use client'

export function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NUPLY',
    url: 'https://nuply.com', // ⚠️ REMPLACER
    logo: 'https://nuply.com/images/logo.svg', // ⚠️ REMPLACER
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
      // email: 'contact@nuply.com', // ⚠️ AJOUTER
      availableLanguage: ['French'],
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NUPLY',
    url: 'https://nuply.com', // ⚠️ REMPLACER
    description: 'La plateforme mariage next-gen - Matching IA, prestataires vérifiés, budget, timeline',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://nuply.com/couple/recherche?q={search_term_string}', // ⚠️ REMPLACER
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
```

```typescript
// app/layout.tsx - AJOUTER dans le <body>

import { StructuredData } from '@/components/seo/StructuredData'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${GeistSans.className} ${inter.variable}`}>
      <body className="antialiased bg-white" suppressHydrationWarning>
        <StructuredData /> {/* ⚠️ AJOUTER ICI */}
        <Providers>
          <NuplyNavbarMenu />
          <main>
            <MainWrapper>
              {children}
            </MainWrapper>
          </main>
          <FooterWrapper />
          <Chatbot />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
```

---

## 🤖 PARTIE 4 : ROBOTS.TXT

### Objectif
Guider les moteurs de recherche sur les pages à crawler.

### Actions

```txt
# CRÉER UN NOUVEAU FICHIER : public/robots.txt

# Autoriser tous les robots
User-agent: *
Allow: /

# Bloquer les pages privées
Disallow: /couple/
Disallow: /prestataire/
Disallow: /api/
Disallow: /auth/

# Sitemap
Sitemap: https://nuply.com/sitemap.xml
```

**⚠️ Important :** Remplacer `https://nuply.com` par votre domaine.

---

## 🗺️ PARTIE 5 : SITEMAP.XML

### Objectif
Fournir à Google la liste complète des URLs à indexer.

### Actions (Next.js App Router)

```typescript
// CRÉER UN NOUVEAU FICHIER : app/sitemap.ts

import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nuply.com' // ⚠️ REMPLACER

  // Pages statiques
  const staticPages = [
    '',           // Homepage
    '/tarifs',    // Pricing
    '/sign-in',   // Sign in
    '/sign-up',   // Sign up
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Pages de blog (si vous en avez)
  // const blogPosts = await getBlogPosts() // Fetch depuis votre CMS
  // const blogPages = blogPosts.map((post) => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.6,
  // }))

  return [
    ...staticPages,
    // ...blogPages,
  ]
}
```

**Résultat :** Le sitemap sera automatiquement disponible sur `https://nuply.com/sitemap.xml`

---

## ⚡ PARTIE 6 : PERFORMANCE (CORE WEB VITALS)

### 6.1 Preload des polices critiques

```typescript
// app/layout.tsx - AJOUTER dans <head> via metadata

export const metadata: Metadata = {
  // ... (metadata existante)

  // Ajouter après la section icons
  other: {
    'theme-color': '#823F91',
  },
}

// Puis dans le composant RootLayout, ajouter un <head> custom si besoin
// Ou utiliser next/font qui optimise automatiquement ✅ (déjà fait avec Geist/Inter)
```

### 6.2 Images optimisées avec Next.js Image

**Vérifier que toutes les images utilisent `next/image` :**

```typescript
// components/landing/Hero.tsx - VÉRIFIER

import Image from 'next/image'

// MAUVAIS ❌
<img src="/images/logo.svg" alt="NUPLY" />

// BON ✅
<Image
  src="/images/logo.svg"
  alt="NUPLY - Plateforme mariage next-gen"
  width={200}
  height={60}
  priority // Pour les images above-the-fold
/>
```

### 6.3 Lazy loading des composants non critiques

```typescript
// app/page.tsx - OPTIMISER avec dynamic import

import dynamic from 'next/dynamic'
import Hero from '@/components/landing/Hero'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'

// Lazy load des sections below-the-fold
const HowItWorks = dynamic(() => import('@/components/how-it-works'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
})

const AnimatedListNuply = dynamic(() => import('@/components/landing/AnimatedListNuply'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
})

const CallToAction = dynamic(() => import('@/components/landing/CallToAction'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
})

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-white overflow-x-hidden relative">
        {/* Above the fold - pas de lazy loading */}
        <Hero />

        {/* Below the fold - lazy loading */}
        <HowItWorks />
        <FeaturesGrid />

        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                  Matching en temps réel
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  Notre IA trouve vos prestataires parfaits automatiquement
                </p>
              </div>
              <div className="max-w-2xl mx-auto">
                <AnimatedListNuply />
              </div>
            </div>
          </div>
        </section>

        <CallToAction />

        {/* Chatbot lazy loaded */}
        <Chatbot />
      </div>
    </SmoothScrollProvider>
  )
}
```

---

## ♿ PARTIE 7 : ACCESSIBILITÉ & SÉMANTIQUE

### 7.1 Attributs alt manquants

**Vérifier et ajouter des alt descriptifs à TOUTES les images :**

```typescript
// RECHERCHER dans tout le projet : <img ou <Image sans alt

// BON ✅
<Image
  src="/images/logo.svg"
  alt="Logo NUPLY - Plateforme de mariage next-generation"
  width={200}
  height={60}
/>

// MAUVAIS ❌
<Image src="/images/logo.svg" width={200} height={60} />
```

### 7.2 Structure sémantique HTML

**S'assurer d'une hiérarchie de titres correcte :**

```html
<!-- Page structure -->
<main>
  <section> <!-- Hero -->
    <h1>Titre principal de la page</h1>
  </section>

  <section> <!-- How it works -->
    <h2>Comment ça marche</h2>
    <article>
      <h3>Étape 1</h3>
    </article>
  </section>

  <section> <!-- Features -->
    <h2>Fonctionnalités</h2>
  </section>
</main>
```

**Règles :**
- Une seule `<h1>` par page
- Hiérarchie logique (h1 → h2 → h3)
- Utiliser `<section>`, `<article>`, `<nav>`, `<header>`, `<footer>`

### 7.3 Liens et boutons accessibles

```typescript
// BON ✅ - Lien avec texte descriptif
<Link href="/sign-up" className="...">
  Commencer gratuitement
</Link>

// MAUVAIS ❌ - Lien "Cliquez ici"
<a href="/sign-up">Cliquez ici</a>

// BON ✅ - Bouton avec aria-label si icône seule
<button aria-label="Rechercher" className="...">
  <Search className="h-5 w-5" />
</button>
```

---

## 🎯 CHECKLIST DE VALIDATION SEO

Après avoir appliqué tous les changements :

### Metadata
- [ ] Title optimisé (50-60 caractères)
- [ ] Description optimisée (150-160 caractères)
- [ ] Keywords pertinents (10-15 mots-clés)
- [ ] OpenGraph complet (title, description, image, url)
- [ ] Twitter Card configuré
- [ ] Canonical URL défini

### Images & Médias
- [ ] Image OG créée (1200x630px)
- [ ] Toutes les images ont un attribut alt descriptif
- [ ] Images optimisées (WebP, compression)
- [ ] next/image utilisé partout
- [ ] Priority sur images above-the-fold

### Structured Data
- [ ] JSON-LD Organization ajouté
- [ ] JSON-LD WebSite ajouté
- [ ] Validé avec Google Rich Results Test

### Fichiers SEO
- [ ] robots.txt créé et configuré
- [ ] sitemap.xml généré automatiquement
- [ ] Domaine de production configuré dans tous les fichiers

### Performance
- [ ] Lazy loading sur composants below-the-fold
- [ ] Polices optimisées (Geist/Inter déjà OK)
- [ ] Lighthouse Score > 90 (Performance, Accessibility, Best Practices, SEO)

### Accessibilité
- [ ] Hiérarchie de titres correcte (h1 → h2 → h3)
- [ ] Tous les liens/boutons ont du texte ou aria-label
- [ ] Contraste suffisant (WCAG AA minimum)
- [ ] Navigation au clavier fonctionnelle

---

## 🚀 ORDRE D'EXÉCUTION

1. **Metadata** : Mettre à jour `app/layout.tsx` avec metadata complète ✅
2. **OG Image** : Créer `app/opengraph-image.tsx` (ou `/public/og-image.png`) ✅
3. **Structured Data** : Créer `components/seo/StructuredData.tsx` et l'ajouter au layout ✅
4. **Robots.txt** : Créer `public/robots.txt` ✅
5. **Sitemap** : Créer `app/sitemap.ts` ✅
6. **Performance** : Lazy load composants + vérifier next/image ✅
7. **Accessibilité** : Ajouter alt + vérifier hiérarchie HTML ✅
8. **Tests** : Lighthouse + Google Search Console + Rich Results Test ✅

---

## 🔍 OUTILS DE VALIDATION

### Avant déploiement :
```bash
# Lighthouse (local)
npm run build
npm run start
# Puis ouvrir DevTools > Lighthouse

# Vérifier le sitemap
curl http://localhost:3000/sitemap.xml

# Vérifier robots.txt
curl http://localhost:3000/robots.txt
```

### Après déploiement :
1. **Google Search Console** : https://search.google.com/search-console
   - Soumettre le sitemap
   - Vérifier l'indexation
   - Surveiller les erreurs

2. **Google Rich Results Test** : https://search.google.com/test/rich-results
   - Tester les structured data

3. **PageSpeed Insights** : https://pagespeed.web.dev/
   - Vérifier les Core Web Vitals

4. **Social Media Debuggers** :
   - Facebook : https://developers.facebook.com/tools/debug/
   - Twitter : https://cards-dev.twitter.com/validator
   - LinkedIn : https://www.linkedin.com/post-inspector/

---

## ⚠️ NOTES IMPORTANTES

1. **Domaine de production** : Remplacer TOUS les `https://nuply.com` par votre vrai domaine
2. **Variables d'environnement** : Utiliser `process.env.NEXT_PUBLIC_SITE_URL` si disponible
3. **Réseaux sociaux** : Ajouter vos vrais liens sociaux dans structured data
4. **Email contact** : Ajouter un vrai email de contact

---

## ✨ RÉSULTAT ATTENDU

**Google :**
- ✅ Indexation rapide et complète
- ✅ Rich snippets dans les résultats de recherche
- ✅ Meilleur classement grâce aux Core Web Vitals

**Réseaux sociaux :**
- ✅ Belle preview card avec image OG
- ✅ Titre et description optimisés
- ✅ Meilleur engagement sur les partages

**Utilisateurs :**
- ✅ Chargement ultra-rapide (< 2s)
- ✅ Expérience fluide et accessible
- ✅ Compatible tous appareils

**Lighthouse Score attendu :**
- Performance : > 95
- Accessibility : > 95
- Best Practices : > 95
- SEO : 100

---

**FIN DU PROMPT SEO - PRÊT POUR V1** 🚀
