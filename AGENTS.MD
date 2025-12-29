# Nuply - Plateforme de Matching Multiculturel pour Mariages

> Documentation complète pour les agents IA travaillant sur le projet Nuply

## 📚 Table des Matières

1. [Stack Technique Détectée](#stack-technique-détectée)
2. [Structure du Projet](#structure-du-projet)
3. [Commandes Disponibles](#commandes-disponibles)
4. [Conventions de Code](#conventions-de-code)
5. [Composants Réutilisables](#composants-réutilisables)
6. [Variables & Styles Custom](#variables--styles-custom)
7. [Fichiers Critiques](#fichiers-critiques)
8. [Règles pour les Agents](#règles-pour-les-agents)

---

## Stack Technique Détectée

### Framework & Core
- **Next.js**: `16.0.3` (App Router, React Server Components)
- **React**: `19.2.0` (dernière version stable)
- **React DOM**: `19.2.0`
- **TypeScript**: `5.x` (strict mode activé)
- **Node.js**: `20+`

### Styling & UI
- **Tailwind CSS**: `4.x` (dernière version avec `@tailwindcss/postcss`)
- **PostCSS**: Configuration moderne
- **tw-animate-css**: `1.4.0` (animations Tailwind custom)
- **class-variance-authority**: `0.7.1` (variants de composants)
- **clsx**: `2.1.1` + **tailwind-merge**: `3.4.0` (utility `cn()`)
- **Geist**: `1.5.1` (police Vercel)
- **Google Fonts**: Inter (weights 300-700)

### Animation
- **Framer Motion**: `12.23.26` (animations déclaratives)
- **Motion**: `12.23.26` (alternative lightweight)
- **Lenis**: `1.3.15` + `@studio-freight/lenis 1.0.42` (smooth scroll)

### UI Components
- **Radix UI**: ~25 composants primitifs (@radix-ui/react-*)
- **shadcn/ui**: 68 composants UI custom
- **Lucide React**: `0.554.0` (icônes)
- **Vaul**: `1.1.2` (drawer mobile)
- **Sonner**: `2.0.7` (toasts)
- **cmdk**: `1.1.1` (command palette)
- **Recharts**: `3.5.1` (graphiques)

### Backend & Database
- **Supabase JS**: `2.86.2` (client JavaScript)
- **Supabase SSR**: `0.5.2` (Server-Side Rendering)
- **Supabase Auth Helpers**: `0.15.0` (authentification)

### Forms & Validation
- **React Hook Form**: `7.67.0` (gestion de formulaires)
- **Zod**: `4.1.13` (validation de schémas)
- **@hookform/resolvers**: `3.10.0` (intégration Zod + RHF)

### State Management
- **Zustand**: `5.0.8` (state management léger)

### AI & Chat
- **OpenAI**: `6.10.0`
- **AI SDK**: `5.0.107` (@ai-sdk/openai: `2.0.77`, @ai-sdk/react: `2.0.107`)

### Utilities
- **date-fns**: `4.1.0` (manipulation de dates)
- **pdf-lib**: `1.17.1` (génération PDF)
- **lru-cache**: `11.2.4` (cache en mémoire)
- **dotenv**: `17.2.3` (variables d'environnement)
- **cobe**: `0.6.5` (globe 3D)

### Dev Dependencies
- **ESLint**: `9.x` + `eslint-config-next`
- **Jest**: `30.2.0` + `@testing-library/react 16.3.0`
- **ts-jest**: `29.4.6`
- **tsx**: `4.21.0` (exécution TypeScript)
- **Sharp**: `0.34.5` (optimisation d'images)

---

## Structure du Projet

```
nuply/
├── app/                                    # Next.js App Router (16.0.3)
│   ├── layout.tsx                          # Root layout avec Inter font + Navbar
│   ├── page.tsx                            # Landing page (Hero + Features + CTA)
│   ├── globals.css                         # Design system complet (509 lignes)
│   │
│   ├── (auth)/                             # Groupe de routes auth
│   │   ├── layout.tsx                      # Layout auth
│   │   └── auth/callback/route.ts          # Callback Supabase
│   │
│   ├── sign-in/                            # Page de connexion
│   ├── sign-up/                            # Page d'inscription
│   ├── tarifs/                             # Page de pricing
│   ├── subscription/                       # Gestion abonnements
│   ├── messages/                           # Page de messagerie
│   ├── invitation/[token]/                 # Invitation collaborateurs
│   │
│   ├── couple/                             # Dashboard couple
│   │   ├── layout.tsx                      # Layout avec sidebar
│   │   ├── sidebar-wrapper.tsx             # Wrapper sidebar client
│   │   ├── mobile-menu-client.tsx          # Menu mobile
│   │   ├── page.tsx                        # Dashboard
│   │   ├── matching/                       # Matching IA
│   │   ├── recherche/                      # Recherche prestataires
│   │   ├── profil/                         # Profil couple
│   │   ├── budget/                         # Gestion budget
│   │   ├── collaborateurs/                 # Gestion collaborateurs
│   │   ├── demandes/                       # Demandes envoyées
│   │   ├── messagerie/                     # Messagerie couple
│   │   └── notifications/                  # Notifications
│   │
│   ├── prestataire/                        # Dashboard prestataire
│   │   ├── layout.tsx                      # Layout avec sidebar
│   │   ├── sidebar-wrapper.tsx             # Wrapper sidebar client
│   │   ├── mobile-menu-client.tsx          # Menu mobile
│   │   ├── page.tsx                        # Dashboard
│   │   ├── demandes-recues/                # Demandes reçues
│   │   ├── profil-public/                  # Profil public
│   │   ├── agenda/                         # Agenda & disponibilités
│   │   └── messagerie/                     # Messagerie prestataire
│   │
│   └── api/                                # API Routes
│       ├── auth/signout/route.ts           # Déconnexion
│       ├── chatbot/route.ts                # Chatbot IA
│       ├── collaborateurs/
│       │   ├── invite/route.ts             # Invitation collaborateurs
│       │   └── invitation/[token]/
│       │       ├── route.ts                # Infos invitation
│       │       └── accept/route.ts         # Acceptation invitation
│       └── marriage-admin/
│           ├── create/route.ts             # Création dossier administratif
│           ├── generate-document/route.ts  # Génération documents
│           ├── generate-pdf/route.ts       # Génération PDF
│           └── upload-document/route.ts    # Upload documents
│
├── components/                             # Composants React
│   ├── Chatbot.tsx                         # Chatbot IA (14722 lignes)
│   ├── CityAutocomplete.tsx                # Autocomplete villes
│   ├── HeroFlipWords.tsx                   # Hero avec mots qui flip
│   ├── NuplyNavbarMenu.tsx                 # Navbar principale (16204 lignes)
│   ├── calendar.tsx                        # Calendrier custom
│   ├── how-it-works.tsx                    # Section "Comment ça marche"
│   ├── marquee-reviews.tsx                 # Carrousel d'avis
│   │
│   ├── auth/                               # Composants authentification
│   ├── budget/                             # Composants budget
│   ├── couple/                             # Composants spécifiques couple
│   ├── dashboard/                          # Composants dashboard
│   ├── marriage-admin/                     # Composants admin mariage
│   ├── prestataire/                        # Composants spécifiques prestataire
│   ├── pricing/                            # Composants pricing
│   │   ├── PricingHeader.tsx
│   │   ├── PriceToggle.tsx
│   │   ├── ProfileToggle.tsx
│   │   ├── PricingCard.tsx
│   │   └── FinaryPricingCard.tsx
│   ├── profile/                            # Composants profil
│   ├── provider/                           # Composants provider
│   ├── providers/                          # Context providers
│   ├── signup/                             # Composants inscription
│   │
│   ├── home/                               # Composants page d'accueil
│   │   ├── FinalCTA.tsx
│   │   ├── PlatformFusionAnimation.tsx
│   │   ├── WhyNuply.tsx
│   │   ├── HowItWorks.tsx
│   │   └── FloatingHighlight.tsx
│   │
│   ├── landing/                            # Composants landing page (16 fichiers)
│   │   ├── Hero.tsx                        # Hero principal moderne (185 lignes)
│   │   ├── HeroSection.tsx                 # Hero ancien (64 lignes) ⚠️ LEGACY
│   │   ├── FeaturesGrid.tsx                # Grille de features Bento (433 lignes)
│   │   ├── HowItWorks.tsx                  # Section "Comment ça marche"
│   │   ├── CallToAction.tsx                # CTA final
│   │   ├── AnimatedListNuply.tsx           # Liste animée de matches (131 lignes)
│   │   ├── AnimatedBeamNuply.tsx           # Animation de faisceau (8899 lignes)
│   │   ├── AlternatingSections.tsx         # Sections alternées
│   │   ├── FeatureBlock.tsx                # Bloc de feature
│   │   ├── Pricing.tsx                     # Section pricing
│   │   ├── TrustLogos.tsx                  # Logos de confiance
│   │   ├── FinalCTA.tsx                    # CTA final
│   │   ├── SmoothScrollProvider.tsx        # Provider Lenis
│   │   ├── animations.tsx                  # Animations réutilisables
│   │   └── README.md                       # Documentation landing
│   │
│   ├── layout/                             # Composants layout
│   │   └── (sidebar, topbar, navigation)
│   │
│   └── ui/                                 # shadcn/ui components (68 fichiers)
│       ├── accordion.tsx
│       ├── animated-beam.tsx
│       ├── animated-counter.tsx
│       ├── animated-list.tsx
│       ├── avatar-circles.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── bento-grid.tsx
│       ├── bottom-gradient.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── calendar-shadcn.tsx
│       ├── calendar18.tsx
│       ├── card.tsx
│       ├── card-decorator.tsx
│       ├── carousel.tsx
│       ├── chart.tsx
│       ├── chat-input.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── date-picker.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── empty-state.tsx
│       ├── flip-words.tsx
│       ├── form.tsx
│       ├── hero-video-dialog.tsx
│       ├── hover-card.tsx
│       ├── input.tsx
│       ├── loading-spinner.tsx
│       ├── marquee.tsx
│       ├── modern-card.tsx
│       ├── navbar-menu.tsx
│       ├── navigation-menu.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── pulsating-button.tsx
│       ├── range-slider.tsx
│       ├── resizable.tsx
│       ├── resizable-navbar.tsx
│       ├── ripple-button.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── select-radix.tsx
│       ├── separator.tsx
│       ├── skeleton.tsx
│       ├── sonner.tsx
│       ├── spotlight.tsx
│       ├── spotlight-preview.tsx
│       ├── switch.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       ├── toggle.tsx
│       ├── toggle-group.tsx
│       └── ... (68 fichiers au total)
│
├── lib/                                    # Utilitaires & helpers
│   ├── utils.ts                            # Utility cn() pour Tailwind
│   ├── animations.ts                       # Configurations animations
│   ├── scroll.ts                           # Utilities scroll
│   ├── constants.ts                        # Constantes globales
│   ├── design-system.ts                    # Configuration design system
│   ├── security.ts                         # Utilities sécurité
│   ├── rate-limit.ts                       # Rate limiting
│   │
│   ├── auth/                               # Authentification
│   │   ├── session.ts
│   │   └── actions.ts
│   │
│   ├── actions/                            # Server actions
│   │   ├── budget.ts
│   │   ├── profile.ts
│   │   └── budget-categories.ts
│   │
│   ├── supabase/                           # Clients Supabase
│   │   ├── client.ts                       # Client browser
│   │   ├── server.ts                       # Client server
│   │   ├── admin.ts                        # Client admin
│   │   ├── middleware.ts                   # Middleware auth
│   │   ├── conversations.ts                # Gestion conversations
│   │   ├── messages.ts                     # Gestion messages
│   │   └── queries/
│   │       └── couples.queries.ts          # Requêtes couples
│   │
│   ├── constants/                          # Constantes
│   │   ├── cultures.ts                     # Liste cultures
│   │   └── zones.ts                        # Zones géographiques
│   │
│   ├── validations/                        # Schémas Zod
│   │   ├── auth.schema.ts
│   │   ├── collaborateur.schema.ts
│   │   └── onboarding.schema.ts
│   │
│   ├── types/                              # Types TypeScript custom
│   │   ├── budget.ts
│   │   └── prestataire.ts
│   │
│   ├── stores/                             # Stores Zustand
│   │   └── signup-store.ts
│   │
│   ├── pdf/                                # Génération PDF
│   │   └── marriage-dossier-generator.ts
│   │
│   └── marriage-admin/                     # Admin mariage
│       └── checklist-generator.ts
│
├── types/                                  # Types TypeScript globaux
│   ├── index.ts                            # Types principaux
│   ├── index.d.ts                          # Déclarations globales
│   ├── database.types.ts                   # Types Supabase générés
│   ├── messages.ts                         # Types messagerie
│   ├── matching.ts                         # Types matching
│   ├── couple.ts                           # Types couple
│   ├── couples.types.ts                    # Types couples (alternatif)
│   ├── vapi.d.ts                           # Types VAPI
│   └── marriage-admin/
│       └── index.ts
│
├── hooks/                                  # React hooks custom
│   ├── use-user.ts                         # Hook utilisateur
│   ├── use-profile.ts                      # Hook profil
│   ├── use-toast.ts                        # Hook toast
│   └── use-textarea-resize.ts              # Hook textarea auto-resize
│
├── store/                                  # Stores Zustand
│   └── onboarding-store.ts
│
├── constants/                              # Constantes globales
│   └── index.ts
│
├── scripts/                                # Scripts utilitaires
│   ├── seed-prestataires.ts               # Seed prestataires
│   └── test-compatibility.ts              # Test compatibilité
│
├── supabase/                               # Configuration Supabase
│   └── (migrations, policies, etc.)
│
├── public/                                 # Assets statiques
│   └── (images, fonts, etc.)
│
├── docs/                                   # Documentation
│
├── .git/                                   # Git repository
├── .gitignore                              # Git ignore
├── .idea/                                  # IDE config
│
├── middleware.ts                           # Middleware Next.js (auth)
├── next.config.ts                          # Config Next.js
├── tsconfig.json                           # Config TypeScript
├── components.json                         # Config shadcn/ui
├── postcss.config.mjs                      # Config PostCSS
├── eslint.config.mjs                       # Config ESLint
├── jest.config.js                          # Config Jest
│
├── package.json                            # Dependencies
├── package-lock.json                       # Lock file
│
└── README.md                               # Documentation principale
```

**Résumé Taille des Dossiers:**
- `components/` : **738 KB** (68 composants UI + composants métier)
- `app/` : **491 KB** (pages + API routes)
- `lib/` : **164 KB** (utilities + helpers)

---

## Commandes Disponibles

```json
{
  "dev": "next dev",                        // Serveur de développement (http://localhost:3000)
  "build": "next build",                    // Build production
  "start": "next start",                    // Serveur production
  "lint": "eslint",                         // Linter ESLint
  "test": "jest",                           // Tests Jest
  "test:api": "node scripts/test-api.sh",   // Tests API
  "test:compatibility": "tsx scripts/test-compatibility.ts"  // Tests compatibilité
}
```

### Utilisation Recommandée

```bash
# Développement
npm run dev                  # Lance le serveur de dev (port 3000)

# Production
npm run build               # Build optimisé pour production
npm run start               # Lance le serveur production

# Quality Assurance
npm run lint                # Vérifie le code avec ESLint
npm run test                # Lance les tests Jest
npm run test:api            # Teste les routes API
npm run test:compatibility  # Teste la compatibilité

# Supabase (si installé localement)
npx supabase start          # Lance Supabase local
npx supabase stop           # Arrête Supabase local
npx supabase db reset       # Reset database
```

---

## Conventions de Code

### Conventions TypeScript

1. **Strict Mode Activé** (`tsconfig.json`)
   ```json
   {
     "strict": true,
     "noUncheckedIndexedAccess": true,
     "noImplicitAny": true
   }
   ```

2. **Imports Absolus** avec alias `@/`
   ```typescript
   import { Button } from '@/components/ui/button'
   import { cn } from '@/lib/utils'
   ```

3. **Types Explicites** pour les props
   ```typescript
   interface HeroProps {
     title: string
     subtitle?: string
     className?: string
   }

   export default function Hero({ title, subtitle, className }: HeroProps) {
     // ...
   }
   ```

### Conventions React

1. **'use client'** pour les composants interactifs
   ```typescript
   'use client'  // En haut du fichier si useState, useEffect, onClick, etc.

   import { useState } from 'react'
   ```

2. **Server Components par défaut**
   - Les composants dans `app/` sont Server Components par défaut
   - Ajouter `'use client'` uniquement si nécessaire

3. **Naming Convention**
   - **Composants**: PascalCase (`HeroSection.tsx`)
   - **Utilities**: camelCase (`utils.ts`, `animations.ts`)
   - **Hooks**: `use` prefix (`use-user.ts`, `use-profile.ts`)
   - **Types**: PascalCase avec suffix (`UserProfile`, `ApiResponse`)

4. **Export par défaut** pour les composants principaux
   ```typescript
   export default function Hero() { }  // ✅ Pour les pages/composants principaux
   export function FadeInOnScroll() { } // ✅ Pour les utilities
   ```

### Conventions Tailwind CSS

1. **Utility `cn()`** pour combiner les classes
   ```typescript
   import { cn } from '@/lib/utils'

   <div className={cn(
     "base-classes",
     condition && "conditional-classes",
     className  // Permet l'override externe
   )} />
   ```

2. **Classes Custom** définies dans `globals.css`
   ```css
   .gradient-primary { }
   .shadow-soft { }
   .glass { }
   .hover-lift { }
   ```

3. **Responsive Design**
   ```typescript
   // Mobile-first approach
   className="text-base sm:text-lg md:text-xl lg:text-2xl"
   ```

### Conventions Framer Motion

1. **Variants Pattern** pour les animations complexes
   ```typescript
   const containerVariants = {
     hidden: { opacity: 0 },
     visible: {
       opacity: 1,
       transition: { staggerChildren: 0.1 }
     }
   }

   <motion.div
     variants={containerVariants}
     initial="hidden"
     animate="visible"
   >
   ```

2. **Animations Réutilisables** dans `components/landing/animations.tsx`
   - `FadeInOnScroll` : Apparition au scroll
   - `SlideInOnScroll` : Glissement latéral
   - `StaggeredList` : Liste avec délai échelonné
   - `FadeInScaleOnScroll` : Apparition + scale

### Conventions Supabase

1. **Clients Séparés**
   ```typescript
   // Browser
   import { createClient } from '@/lib/supabase/client'

   // Server Component
   import { createClient } from '@/lib/supabase/server'

   // Server Action / API Route
   import { createClient } from '@/lib/supabase/admin'
   ```

2. **Types Générés**
   ```typescript
   import { Database } from '@/types/database.types'
   ```

### Conventions de Fichiers

1. **Structure des Composants**
   ```
   ComponentName.tsx           // Composant principal
   component-name.module.css   // Styles si nécessaire (rare avec Tailwind)
   ```

2. **Co-location**
   - Les composants spécifiques à une page sont dans le même dossier
   - Les composants réutilisables sont dans `components/`

---

## Composants Réutilisables

### Composants Landing Page

| Composant | Chemin | Description | Lignes |
|-----------|--------|-------------|--------|
| **Hero** | `components/landing/Hero.tsx` | Hero moderne avec animations Framer Motion | 185 |
| **HeroSection** | `components/landing/HeroSection.tsx` | Hero ancien (LEGACY - ne pas utiliser) | 64 |
| **FeaturesGrid** | `components/landing/FeaturesGrid.tsx` | Grille Bento avec skeletons animés | 433 |
| **AnimatedListNuply** | `components/landing/AnimatedListNuply.tsx` | Liste de matches animée | 131 |
| **AnimatedBeamNuply** | `components/landing/AnimatedBeamNuply.tsx` | Animation de faisceau (complexe) | 8899 |
| **HowItWorks** | `components/landing/HowItWorks.tsx` | Section "Comment ça marche" | - |
| **CallToAction** | `components/landing/CallToAction.tsx` | CTA moderne avec RippleButton | - |
| **Pricing** | `components/landing/Pricing.tsx` | Section pricing avec toggles | - |
| **TrustLogos** | `components/landing/TrustLogos.tsx` | Logos partenaires | - |
| **SmoothScrollProvider** | `components/landing/SmoothScrollProvider.tsx` | Provider Lenis pour smooth scroll | - |

### Composants Animation

| Fonction | Fichier | Description |
|----------|---------|-------------|
| `FadeInOnScroll` | `components/landing/animations.tsx` | Apparition fade au scroll (margin: -100px) |
| `SlideInOnScroll` | `components/landing/animations.tsx` | Glissement depuis left/right/up/down |
| `StaggeredList` | `components/landing/animations.tsx` | Liste avec délai échelonné (stagger) |
| `FadeInScaleOnScroll` | `components/landing/animations.tsx` | Apparition + scale + translation Y |

### Composants UI (shadcn/ui) - 68 Fichiers

**Navigation & Layout:**
- `navbar-menu.tsx` - Menu de navigation Aceternity UI
- `resizable-navbar.tsx` - Navbar responsive
- `navigation-menu.tsx` - Menu Radix UI
- `breadcrumb.tsx` - Fil d'Ariane
- `separator.tsx` - Séparateur horizontal/vertical

**Formulaires:**
- `button.tsx` - Bouton avec variants (default, destructive, outline, ghost)
- `input.tsx` - Input texte standard
- `textarea.tsx` - Textarea avec auto-resize
- `select.tsx` / `select-radix.tsx` - Select dropdown
- `checkbox.tsx` - Checkbox Radix
- `switch.tsx` - Toggle switch
- `form.tsx` - React Hook Form wrapper
- `date-picker.tsx` - Date picker avec react-day-picker

**Feedback:**
- `toast.tsx` + `sonner.tsx` - Notifications toast
- `loading-spinner.tsx` - Spinner de chargement
- `skeleton.tsx` - Skeleton loader
- `progress.tsx` - Barre de progression
- `empty-state.tsx` - État vide

**Overlays:**
- `dialog.tsx` - Modal Radix
- `drawer.tsx` - Drawer mobile (Vaul)
- `dropdown-menu.tsx` - Menu déroulant
- `popover.tsx` - Popover Radix
- `hover-card.tsx` - Carte au hover
- `command.tsx` - Command palette (cmdk)

**Data Display:**
- `card.tsx` - Carte avec header/footer
- `modern-card.tsx` - Carte moderne
- `bento-grid.tsx` - Grille Bento (Apple style)
- `badge.tsx` - Badge avec variants
- `avatar.tsx` - Avatar circulaire
- `avatar-circles.tsx` - Cercles d'avatars superposés
- `chart.tsx` - Graphiques Recharts
- `marquee.tsx` - Carrousel automatique
- `animated-list.tsx` - Liste animée avec Framer Motion

**Animations & Effects:**
- `animated-beam.tsx` - Animation de faisceau
- `animated-counter.tsx` - Compteur animé
- `spotlight.tsx` - Effet spotlight Aceternity
- `spotlight-preview.tsx` - Preview spotlight
- `flip-words.tsx` - Mots qui flippent
- `ripple-button.tsx` - Bouton avec effet ripple
- `pulsating-button.tsx` - Bouton pulsant
- `bottom-gradient.tsx` - Gradient en bas

**Calendrier:**
- `calendar.tsx` - Calendrier principal custom (6045 lignes)
- `calendar-shadcn.tsx` - Calendrier shadcn
- `calendar18.tsx` - Calendrier alternatif

**Autres:**
- `tabs.tsx` - Onglets Radix
- `accordion.tsx` - Accordéon Radix
- `collapsible.tsx` - Section repliable
- `toggle.tsx` / `toggle-group.tsx` - Boutons toggle
- `scroll-area.tsx` - Zone de scroll custom
- `resizable.tsx` - Panneau redimensionnable
- `carousel.tsx` - Carrousel Embla
- `chat-input.tsx` - Input de chat avancé
- `hero-video-dialog.tsx` - Dialog vidéo pour hero
- `range-slider.tsx` - Slider de plage

---

## Variables & Styles Custom

### Palette de Couleurs (CSS Variables)

Définies dans `app/globals.css` (lignes 7-39):

```css
:root {
  /* Background & Foreground */
  --background: 220 20% 98%;              /* #F7F9FC (Gris très clair) */
  --foreground: 220 20% 10%;              /* #1A1F2E (Dark Navy) */

  /* Card */
  --card: 0 0% 100%;                      /* #FFFFFF (Blanc pur) */
  --card-foreground: 220 20% 10%;

  /* Popover */
  --popover: 0 0% 100%;
  --popover-foreground: 220 20% 10%;

  /* Primary (Violet Nuply) */
  --primary: 250 65% 55%;                 /* #823F91 */
  --primary-foreground: 0 0% 100%;        /* #FFFFFF */

  /* Secondary */
  --secondary: 220 15% 95%;               /* #F0F2F5 */
  --secondary-foreground: 250 50% 45%;    /* #6D3478 */

  /* Muted */
  --muted: 220 15% 94%;                   /* #EEEFF2 */
  --muted-foreground: 220 10% 50%;        /* #6B7280 */

  /* Accent (Rose) */
  --accent: 320 70% 55%;                  /* #E91E8C */
  --accent-foreground: 0 0% 100%;

  /* Destructive */
  --destructive: 0 75% 55%;               /* #E53E3E */
  --destructive-foreground: 0 0% 100%;

  /* Border & Input */
  --border: 220 15% 90%;                  /* #E5E7EB */
  --input: 220 15% 90%;

  /* Ring (focus outline) */
  --ring: 250 65% 55%;                    /* #823F91 */

  /* Border Radius */
  --radius: 0.875rem;                     /* 14px */

  /* Sidebar */
  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 220 10% 45%;
  --sidebar-primary: 250 65% 55%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 250 50% 97%;
  --sidebar-accent-foreground: 250 50% 35%;
  --sidebar-border: 220 15% 92%;
  --sidebar-ring: 250 65% 55%;

  /* Glass Effect */
  --glass-bg: 0 0% 100% / 0.7;
  --glass-border: 0 0% 100% / 0.2;

  /* Shadow */
  --shadow-color: 220 30% 15%;
}
```

### Classes Utility Custom (Tailwind)

Définies dans `app/globals.css` (lignes 55-139):

```css
/* Gradients */
.gradient-primary     /* Violet dégradé (250° → 280°) */
.gradient-purple      /* Violet-pourpre dégradé */
.gradient-pink        /* Rose dégradé */
.gradient-blue        /* Bleu dégradé */
.gradient-cyan        /* Cyan dégradé */
.gradient-violet      /* Violet intense */
.gradient-rose        /* Rose intense */
.gradient-subtle      /* Dégradé subtil background */

/* Shadows */
.shadow-soft          /* Ombre douce multi-couches */
.shadow-elevated      /* Ombre élevée (cards) */
.shadow-float         /* Ombre flottante (hover) */
.shadow-glow          /* Halo violet lumineux */

/* Glass Effect */
.glass                /* Glassmorphism (blur + saturation) */
.glass-border         /* Bordure glass translucide */

/* Transitions */
.transition-smooth    /* cubic-bezier(0.4, 0, 0.2, 1) 300ms */
.transition-bounce    /* cubic-bezier(0.34, 1.56, 0.64, 1) 400ms */

/* Hover Effects */
.hover-lift           /* Lift -2px au hover + shadow */
.hover-gradient-purple /* Gradient violet au hover */

/* Text Effects */
.text-gradient        /* Texte avec gradient violet-rose */

/* Patterns */
.pattern-dots         /* Motif de points (background) */
```

### Polices

```css
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11"; /* Features OpenType */
}
```

### Breakpoints Tailwind

```
sm:  640px   (mobile)
md:  768px   (tablet)
lg:  1024px  (desktop)
xl:  1280px  (large desktop)
2xl: 1536px  (extra large)
```

### Animations Custom

Définies dans `app/globals.css` (lignes 497-509):

```css
@keyframes rippling {
  0% { opacity: 1; }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

:root {
  --animate-rippling: rippling var(--duration) ease-out;
}
```

---

## Fichiers Critiques

### ⚠️ NE JAMAIS MODIFIER SANS VALIDATION

| Fichier | Raison | Impact |
|---------|--------|--------|
| `app/globals.css` | Design system complet (509 lignes) | **CRITIQUE** - Affecte tout le design |
| `middleware.ts` | Gestion auth + redirections | **CRITIQUE** - Sécurité |
| `lib/supabase/server.ts` | Client Supabase server | **CRITIQUE** - Database access |
| `types/database.types.ts` | Types Supabase auto-générés | **CRITIQUE** - Ne pas éditer manuellement |
| `next.config.ts` | Config Next.js + headers sécurité | **CRITIQUE** - Performance + sécurité |
| `components.json` | Config shadcn/ui | **IMPORTANT** - Affecte tous les composants UI |
| `tsconfig.json` | Config TypeScript strict | **IMPORTANT** - Type checking |

### ⚙️ MODIFIER AVEC PRÉCAUTION

| Fichier | Raison | Impact |
|---------|--------|--------|
| `app/layout.tsx` | Root layout avec Navbar | **IMPORTANT** - Structure globale |
| `components/NuplyNavbarMenu.tsx` | Navbar principale (16204 lignes) | **IMPORTANT** - Navigation |
| `lib/utils.ts` | Utility `cn()` utilisée partout | **IMPORTANT** - Classes Tailwind |
| `components/landing/Hero.tsx` | Hero principal actif | **MODÉRÉ** - Landing page |
| `components/landing/FeaturesGrid.tsx` | Features avec animations | **MODÉRÉ** - Landing page |

### 🗑️ FICHIERS LEGACY (À NE PAS UTILISER)

| Fichier | Raison | Action Recommandée |
|---------|--------|---------------------|
| `components/landing/HeroSection.tsx` | Ancien hero (remplacé par Hero.tsx) | ⚠️ À supprimer ou archiver |

### 📄 FICHIERS DE DOCUMENTATION (À JOUR)

| Fichier | Description |
|---------|-------------|
| `README.md` | Documentation principale du projet |
| `components/landing/README.md` | Documentation des composants landing |
| `AGENTS.MD` | Ce fichier (documentation pour agents IA) |

### 🔐 FICHIERS SENSIBLES (NE PAS COMMITER)

```gitignore
.env.local                  # Variables d'environnement locales
.env                        # Variables d'environnement
.env.production            # Variables production
.idea/                     # Config IDE
node_modules/              # Dependencies
.next/                     # Build Next.js
```

---

## Règles pour les Agents

### 1. AVANT DE MODIFIER DU CODE

✅ **TOUJOURS:**
- Lire le fichier complet avant toute modification
- Vérifier les imports et dépendances
- Respecter les conventions de code existantes
- Utiliser `'use client'` si le composant utilise des hooks React
- Utiliser la utility `cn()` pour combiner les classes Tailwind
- Tester localement avec `npm run dev`

❌ **NE JAMAIS:**
- Modifier `globals.css` sans validation explicite
- Toucher aux types auto-générés (`database.types.ts`)
- Créer de nouveaux composants UI sans vérifier s'ils existent déjà dans `components/ui/`
- Utiliser `HeroSection.tsx` (c'est le fichier LEGACY)
- Casser les conventions de naming
- Désactiver le strict mode TypeScript

### 2. CRÉATION DE NOUVEAUX COMPOSANTS

**Checklist:**
1. Vérifier qu'un composant similaire n'existe pas déjà dans `components/ui/` (68 composants disponibles)
2. Utiliser TypeScript avec types explicites
3. Ajouter `'use client'` si nécessaire (useState, useEffect, onClick, etc.)
4. Utiliser les imports absolus avec `@/`
5. Respecter le naming: PascalCase pour les composants
6. Utiliser `cn()` pour les classes Tailwind conditionnelles
7. Utiliser les animations réutilisables de `components/landing/animations.tsx`
8. Documenter les props avec TypeScript

**Template:**
```typescript
'use client'  // Si nécessaire

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface MyComponentProps {
  title: string
  subtitle?: string
  className?: string
}

export default function MyComponent({
  title,
  subtitle,
  className
}: MyComponentProps) {
  return (
    <div className={cn(
      "base-classes",
      className
    )}>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}
```

### 3. OPTIMISATION DE LA LANDING PAGE

**Priorités:**
1. **Performance**
   - Utiliser `next/image` pour les images
   - Lazy load les composants lourds
   - Minimiser les animations complexes (éviter AnimatedBeamNuply si possible)

2. **SEO**
   - Utiliser les balises sémantiques (section, article, header)
   - Ajouter des attributs alt sur les images
   - Utiliser des titres H1 → H6 hiérarchiques

3. **Accessibilité**
   - Ajouter `aria-label` sur les éléments interactifs
   - Respecter les contrastes de couleurs
   - Tester la navigation au clavier

4. **Responsive**
   - Mobile-first approach
   - Tester sur mobile (< 768px), tablet (768-1024px), desktop (> 1024px)

### 4. GESTION DES ANIMATIONS FRAMER MOTION

**Bonnes Pratiques:**
1. Utiliser les composants réutilisables de `components/landing/animations.tsx`:
   - `FadeInOnScroll` pour les apparitions simples
   - `SlideInOnScroll` pour les glissements
   - `StaggeredList` pour les listes
   - `FadeInScaleOnScroll` pour les effets de scale

2. Pattern Variants pour les animations complexes:
   ```typescript
   const containerVariants = {
     hidden: { opacity: 0 },
     visible: {
       opacity: 1,
       transition: { staggerChildren: 0.1 }
     }
   }
   ```

3. Utiliser `useInView` pour déclencher au scroll:
   ```typescript
   const ref = useRef(null)
   const isInView = useInView(ref, { once: true, margin: '-100px' })
   ```

### 5. GESTION DU STYLE TAILWIND

**Pattern Recommandé:**
```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "px-4 py-2",                      // Base classes
  "bg-white dark:bg-gray-900",      // Theme classes
  "rounded-lg shadow-soft",         // Custom classes
  isActive && "border-primary",     // Conditional
  className                         // Props override (toujours en dernier)
)} />
```

**Classes Custom Disponibles:**
- Gradients: `.gradient-primary`, `.gradient-purple`, `.gradient-pink`
- Shadows: `.shadow-soft`, `.shadow-elevated`, `.shadow-float`
- Effects: `.glass`, `.hover-lift`, `.text-gradient`

### 6. SUPABASE & AUTHENTIFICATION

**Utiliser le Bon Client:**
```typescript
// Client-side (dans 'use client')
import { createClient } from '@/lib/supabase/client'

// Server Component
import { createClient } from '@/lib/supabase/server'

// API Route / Server Action
import { createClient } from '@/lib/supabase/admin'
```

**Protéger les Routes:**
- Le middleware dans `middleware.ts` gère l'auth automatiquement
- Ne pas bypasser le middleware

### 7. VALIDATION & FORMULAIRES

**Stack Recommandée:**
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2)
})

const form = useForm({
  resolver: zodResolver(schema)
})
```

### 8. TESTER AVANT DE COMMIT

**Checklist Pré-Commit:**
- [ ] `npm run dev` fonctionne sans erreur
- [ ] `npm run build` compile sans warning
- [ ] `npm run lint` passe sans erreur
- [ ] Tester sur mobile, tablet, desktop
- [ ] Vérifier que les animations sont fluides
- [ ] Tester la navigation au clavier

### 9. MESSAGES DE COMMIT

**Format Recommandé:**
```
type(scope): description

feat(landing): add new Hero section with animations
fix(auth): correct login redirect issue
refactor(ui): optimize Button component
docs(readme): update installation steps
```

**Types:**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `refactor`: Refactoring sans changement de comportement
- `style`: Changements de style/formatting
- `docs`: Documentation
- `test`: Ajout/modification de tests
- `chore`: Maintenance (deps, config, etc.)

### 10. RESSOURCES UTILES

**Documentation:**
- Next.js 16: https://nextjs.org/docs
- React 19: https://react.dev
- Tailwind CSS 4: https://tailwindcss.com/docs
- Framer Motion: https://www.framer.com/motion/
- shadcn/ui: https://ui.shadcn.com
- Supabase: https://supabase.com/docs

**Composants UI:**
- 68 composants disponibles dans `components/ui/`
- Toujours vérifier avant d'en créer un nouveau
- Utiliser `npx shadcn@latest add [component]` pour en ajouter

**Animations:**
- 4 composants réutilisables dans `components/landing/animations.tsx`
- Préférer ces composants aux animations custom

---

## 🎯 Objectifs du Projet

### Vision
Créer la meilleure plateforme de matching multiculturel pour mariages en France, avec:
- Interface moderne et épurée (inspiration Apple, Linear, Stripe)
- Animations fluides et subtiles (Framer Motion)
- Performance optimale (Next.js 16 + React 19)
- Accessibilité AAA
- Mobile-first responsive design

### Standards de Qualité
1. **Design**: Élégant, professionnel, moderne (violet #823F91)
2. **Performance**: Lighthouse score > 90
3. **Accessibilité**: WCAG AAA
4. **SEO**: Optimisé pour Google
5. **Code**: TypeScript strict, ESLint, tests Jest

### Prochaines Étapes
1. Optimiser la landing page (performance + conversions)
2. Améliorer les animations (fluidité)
3. Ajouter des tests unitaires (Jest + React Testing Library)
4. Optimiser le SEO (meta tags, structured data)
5. Améliorer l'accessibilité (ARIA, keyboard nav)

---

**Version:** 1.0.0
**Dernière mise à jour:** 29 décembre 2025
**Auteur:** Agent IA Claude (Analyse automatique du codebase)

---

## 📞 Support

Pour toute question ou clarification sur ce document:
1. Lire d'abord `README.md` et `components/landing/README.md`
2. Consulter la documentation officielle des technologies utilisées
3. Vérifier les fichiers existants avant de créer de nouveaux composants

**Bon développement sur Nuply ! 🎉**
