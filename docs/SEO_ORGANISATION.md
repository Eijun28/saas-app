# Organisation SEO - Vue d'ensemble

## 📂 Structure des fichiers SEO

```
nuply/
├── lib/seo/
│   ├── config.ts              # Configuration SEO centralisée
│   └── structured-data.tsx     # Données structurées (JSON-LD)
├── components/seo/
│   └── JsonLd.tsx              # Composant pour injecter JSON-LD
├── app/
│   ├── sitemap.ts             # Sitemap dynamique (/sitemap.xml)
│   ├── robots.ts              # Robots.txt dynamique (/robots.txt)
│   ├── layout.tsx             # Layout principal avec métadonnées
│   └── [pages]/
│       └── layout.tsx         # Layouts avec métadonnées par page
└── docs/
    ├── SEO_GUIDE.md           # Guide complet du SEO
    └── SEO_ORGANISATION.md    # Ce fichier
```

## 🎯 Comment ça fonctionne

### 1. Configuration centralisée (`lib/seo/config.ts`)

**Rôle** : Toutes les métadonnées SEO sont définies ici.

**Contenu** :
- Métadonnées par défaut (Open Graph, Twitter Cards, robots)
- Métadonnées spécifiques pour chaque page
- Fonctions utilitaires pour générer les métadonnées

**Avantage** : Un seul endroit pour modifier le SEO de tout le site.

### 2. Données structurées (`lib/seo/structured-data.tsx`)

**Rôle** : Génère les schémas JSON-LD pour aider Google à comprendre votre contenu.

**Types disponibles** :
- `Organization` : Informations sur votre entreprise
- `WebSite` : Informations sur le site
- `BreadcrumbList` : Fil d'Ariane
- `Article` : Pour les articles de blog
- `Service` : Pour vos services

### 3. Sitemap (`app/sitemap.ts`)

**Rôle** : Liste toutes les pages indexables pour les moteurs de recherche.

**URL** : `https://nuply.fr/sitemap.xml`

**Pages actuellement incluses** :
- Page d'accueil
- Tarifs
- Blog
- Contact
- Inscription / Connexion
- Mentions légales

**Pour ajouter des pages dynamiques** : Modifiez le fichier et ajoutez vos pages.

### 4. Robots.txt (`app/robots.ts`)

**Rôle** : Indique aux robots quelles pages indexer ou non.

**URL** : `https://nuply.fr/robots.txt`

**Pages exclues** :
- `/couple/` - Espace privé
- `/prestataire/` - Espace privé
- `/admin/` - Administration
- `/api/` - Routes API
- `/auth/` - Authentification
- `/messages/` - Messagerie privée
- `/invitation/` - Invitations privées

## 📝 Pages avec métadonnées SEO

Toutes les pages principales ont maintenant des métadonnées SEO :

✅ **Page d'accueil** (`app/page.tsx`)
- Métadonnées dans `app/layout.tsx`

✅ **Tarifs** (`app/tarifs/page.tsx`)
- Métadonnées dans `app/tarifs/layout.tsx`

✅ **Blog** (`app/blog/page.tsx`)
- Métadonnées dans `app/blog/layout.tsx`

✅ **Contact** (`app/contact/page.tsx`)
- Métadonnées dans `app/contact/layout.tsx`

✅ **Inscription** (`app/sign-up/page.tsx`)
- Métadonnées dans `app/sign-up/layout.tsx`

✅ **Connexion** (`app/sign-in/page.tsx`)
- Métadonnées dans `app/sign-in/layout.tsx`

✅ **Mentions légales** (`app/legal/page.tsx`)
- Métadonnées directement dans la page

## 🚀 Prochaines étapes recommandées

### 1. Créer les images Open Graph

Pour chaque page importante, créez une image 1200x630px :
- `/public/images/og-image.jpg` - Page d'accueil
- `/public/images/og-tarifs.jpg` - Page tarifs
- `/public/images/og-blog.jpg` - Page blog
- etc.

Puis mettez à jour `lib/seo/config.ts` pour référencer ces images.

### 2. Ajouter des pages dynamiques au sitemap

Quand vous aurez des articles de blog ou des profils prestataires publics :
1. Modifiez `app/sitemap.ts`
2. Ajoutez vos pages dynamiques
3. Le sitemap sera automatiquement mis à jour

### 3. Personnaliser les métadonnées

Pour personnaliser les métadonnées d'une page :
1. Ouvrez `lib/seo/config.ts`
2. Modifiez la section `pages` correspondante
3. Ou utilisez `createMetadata()` pour des métadonnées personnalisées

### 4. Ajouter des données structurées

Pour ajouter des données structurées à une page :
```typescript
import { JsonLd } from '@/components/seo/JsonLd';
import { generateArticleSchema } from '@/lib/seo/structured-data';

// Dans votre composant
<JsonLd data={generateArticleSchema({
  headline: 'Mon article',
  description: 'Description...',
})} />
```

## 📚 Documentation complète

Pour plus de détails, consultez :
- **`docs/SEO_GUIDE.md`** : Guide complet avec toutes les instructions
- **`lib/seo/config.ts`** : Code commenté avec exemples

## ✅ Checklist SEO

Avant de mettre en production, vérifiez :

- [ ] Toutes les pages ont des métadonnées uniques
- [ ] Les images Open Graph sont créées et référencées
- [ ] Le sitemap inclut toutes les pages importantes
- [ ] Le robots.txt exclut les pages privées
- [ ] Les données structurées sont présentes sur les pages importantes
- [ ] Les URLs canoniques sont définies
- [ ] Testez avec Google Rich Results Test
- [ ] Soumettez le sitemap dans Google Search Console

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. **Sitemap** : Visitez `https://votre-domaine.com/sitemap.xml`
2. **Robots.txt** : Visitez `https://votre-domaine.com/robots.txt`
3. **Métadonnées** : Utilisez l'outil de prévisualisation de Google Search Console
4. **Données structurées** : Utilisez [Google Rich Results Test](https://search.google.com/test/rich-results)

---

**Créé le** : {{ date }}
**Dernière mise à jour** : {{ date }}
