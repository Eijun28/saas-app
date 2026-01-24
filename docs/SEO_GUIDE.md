# Guide SEO pour NUPLY

Ce guide vous explique comment organiser et maintenir le SEO de votre site NUPLY.

## 📁 Structure de l'organisation SEO

### 1. Configuration centralisée (`lib/seo/config.ts`)

Toutes les métadonnées SEO sont centralisées dans ce fichier. C'est ici que vous devez modifier :
- Les titres et descriptions par défaut
- Les informations de l'entreprise
- Les métadonnées pour chaque page
- Les mots-clés

**Avantages :**
- ✅ Un seul endroit pour modifier le SEO
- ✅ Cohérence sur tout le site
- ✅ Facile à maintenir

### 2. Données structurées (`lib/seo/structured-data.tsx`)

Les données structurées (JSON-LD) aident Google à mieux comprendre votre site. Types disponibles :
- `Organization` : Informations sur votre entreprise
- `WebSite` : Informations sur le site
- `BreadcrumbList` : Fil d'Ariane
- `Article` : Pour les articles de blog
- `Service` : Pour vos services

### 3. Sitemap (`app/sitemap.ts`)

Le sitemap liste toutes les pages de votre site pour les moteurs de recherche.

**Pour ajouter des pages dynamiques :**
```typescript
// Exemple pour des articles de blog
const blogPosts = await getBlogPosts();
const blogPages = blogPosts.map((post) => ({
  url: `${baseUrl}/blog/${post.slug}`,
  lastModified: post.updatedAt,
  changeFrequency: 'weekly' as const,
  priority: 0.7,
}));
```

### 4. Robots.txt (`app/robots.ts`)

Indique aux robots quelles pages indexer ou non.

**Pages actuellement exclues :**
- `/couple/` - Espace privé couples
- `/prestataire/` - Espace privé prestataires
- `/admin/` - Administration
- `/api/` - Routes API
- `/auth/` - Authentification
- `/messages/` - Messagerie privée
- `/invitation/` - Invitations privées

## 🎯 Comment ajouter le SEO à une nouvelle page

### Méthode 1 : Page Server Component (recommandé)

Si votre page est un Server Component, ajoutez directement les métadonnées :

```typescript
import { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/config';

export const metadata: Metadata = generateSeoMetadata('home');
// ou pour une page personnalisée :
export const metadata: Metadata = createMetadata({
  title: 'Mon titre personnalisé',
  description: 'Ma description personnalisée',
  keywords: ['mot-clé1', 'mot-clé2'],
});
```

### Méthode 2 : Page Client Component

Si votre page est un Client Component (`'use client'`), créez un fichier `layout.tsx` dans le même dossier :

```typescript
// app/ma-page/layout.tsx
import { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/config';

export const metadata: Metadata = generateSeoMetadata('home');

export default function MaPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

### Méthode 3 : Métadonnées dynamiques

Pour des métadonnées qui dépendent de données (ex: article de blog) :

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const article = await getArticle(params.slug);
  
  return createMetadata({
    title: article.title,
    description: article.excerpt,
    keywords: article.tags,
    image: article.image,
    type: 'article',
  });
}
```

## 📝 Checklist SEO pour chaque nouvelle page

- [ ] Titre unique et descriptif (50-60 caractères)
- [ ] Description unique (150-160 caractères)
- [ ] Mots-clés pertinents
- [ ] URL canonique définie
- [ ] Image Open Graph (1200x630px)
- [ ] Données structurées si nécessaire
- [ ] Ajoutée au sitemap
- [ ] Testée avec Google Rich Results Test

## 🔍 Outils de vérification SEO

### 1. Google Search Console
- Surveillez l'indexation de vos pages
- Vérifiez les erreurs de crawl
- Analysez les performances

### 2. Google Rich Results Test
- Testez vos données structurées
- URL : https://search.google.com/test/rich-results

### 3. PageSpeed Insights
- Vérifiez les performances
- URL : https://pagespeed.web.dev/

### 4. Lighthouse (dans Chrome DevTools)
- Audit SEO complet
- Performance, accessibilité, SEO

## 🎨 Images Open Graph

Pour chaque page importante, créez une image Open Graph :
- **Dimensions** : 1200x630px
- **Format** : JPG ou PNG
- **Taille** : < 1MB
- **Emplacement** : `/public/images/og-[page-name].jpg`

Exemples :
- `/public/images/og-image.jpg` - Page d'accueil
- `/public/images/og-tarifs.jpg` - Page tarifs
- `/public/images/og-blog.jpg` - Page blog

## 📊 Métriques à suivre

1. **Indexation** : Nombre de pages indexées dans Google
2. **Position moyenne** : Position moyenne dans les résultats de recherche
3. **CTR** : Taux de clic depuis les résultats de recherche
4. **Trafic organique** : Visiteurs venant de Google
5. **Erreurs de crawl** : Pages non accessibles aux robots

## 🚀 Améliorations SEO à prévoir

### Court terme
- [ ] Créer les images Open Graph pour toutes les pages
- [ ] Ajouter des données structurées pour les prestataires publics
- [ ] Optimiser les titres et descriptions existantes
- [ ] Ajouter des breadcrumbs sur les pages importantes

### Moyen terme
- [ ] Créer un blog avec du contenu SEO-friendly
- [ ] Ajouter des FAQ avec données structurées
- [ ] Optimiser les images (alt text, lazy loading)
- [ ] Créer des pages de destination pour les mots-clés cibles

### Long terme
- [ ] Créer des backlinks de qualité
- [ ] Optimiser la vitesse de chargement
- [ ] Créer du contenu régulier (blog, guides)
- [ ] Internationalisation (si expansion prévue)

## 📚 Ressources utiles

- [Next.js Metadata Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)

## 🔄 Maintenance SEO

### Mensuel
- Vérifier Google Search Console pour les erreurs
- Analyser les performances des pages principales
- Mettre à jour le sitemap si nouvelles pages

### Trimestriel
- Réviser les métadonnées des pages principales
- Analyser les mots-clés et ajuster si nécessaire
- Vérifier les données structurées

### Annuel
- Audit SEO complet
- Révision de la stratégie de mots-clés
- Mise à jour des informations de l'entreprise

## ❓ Questions fréquentes

### Comment ajouter une nouvelle page au SEO ?
1. Ajoutez les métadonnées dans `lib/seo/config.ts` sous `pages`
2. Utilisez `generateMetadata()` dans votre page ou layout
3. Ajoutez la page au sitemap si elle doit être indexée

### Comment exclure une page de l'indexation ?
Dans les métadonnées de la page :
```typescript
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

### Comment ajouter des données structurées à une page ?
```typescript
import { JsonLd } from '@/components/seo/JsonLd';
import { generateArticleSchema } from '@/lib/seo/structured-data';

// Dans votre composant
<JsonLd data={generateArticleSchema({
  headline: 'Mon article',
  description: 'Description...',
})} />
```

---

**Dernière mise à jour** : {{ date }}
**Maintenu par** : Équipe NUPLY
