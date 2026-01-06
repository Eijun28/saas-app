# 📚 NUPLY - Documentation Architecture pour Claude/Cursor

> **Document de référence pour l'IA**: Ce fichier contient l'architecture complète du projet NUPLY pour permettre à Claude et Cursor de comprendre et suivre le projet efficacement.

---

## 🎯 Vue d'ensemble du projet

**NUPLY** est une plateforme SaaS premium de planification de mariage qui connecte les couples avec des prestataires via un système de matching IA. La plateforme offre une expérience complète de gestion de mariage avec budget, timeline, messagerie et collaborateurs.

### Technologies principales

- **Framework**: Next.js 16 (App Router)
- **Langage**: TypeScript 5.9.3 (strict mode)
- **UI**: React 19.2.0
- **Styling**: TailwindCSS 4 + shadcn/ui
- **Animations**: Framer Motion 12.23.26
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **State Management**: Zustand 5.0.8
- **Forms**: React Hook Form 7.67.0 + Zod 4.1.13
- **IA**: OpenAI SDK + AI SDK
- **Email**: Resend 4.8.0
- **Fonts**: Geist (variable font)

---

## 📁 Architecture des dossiers

```
saas-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout root avec Geist font
│   ├── page.tsx                  # Landing page publique
│   ├── globals.css               # Styles globaux + design system
│   ├── sign-in/                  # Authentification (sign-in)
│   ├── sign-up/                  # Authentification (sign-up)
│   ├── tarifs/                   # Page tarifs publique
│   ├── not-found.tsx             # Page 404 personnalisée
│   ├── messages/                 # Page messages globale
│   │
│   ├── couple/                   # Espace couple (protégé)
│   │   ├── layout.tsx            # Layout avec sidebar couple
│   │   ├── page.tsx              # Dashboard couple
│   │   ├── sidebar-wrapper.tsx   # Wrapper sidebar avec state
│   │   ├── sidebar-inset-wrapper.tsx
│   │   ├── mobile-menu-client.tsx
│   │   ├── dashboard/            # Vue d'ensemble
│   │   ├── matching/             # Matching IA prestataires
│   │   ├── recherche/            # Recherche prestataires
│   │   ├── budget/               # Gestion budget
│   │   ├── timeline/             # Timeline/planning
│   │   ├── collaborateurs/       # Gestion collaborateurs
│   │   ├── demandes/             # Demandes envoyées
│   │   ├── messagerie/           # Messagerie avec prestataires
│   │   ├── profil/               # Profil couple
│   │   └── notifications/        # Notifications
│   │
│   ├── prestataire/              # Espace prestataire (protégé)
│   │   ├── layout.tsx            # Layout avec sidebar prestataire
│   │   ├── page.tsx              # Dashboard prestataire
│   │   ├── sidebar-wrapper.tsx
│   │   ├── sidebar-inset-wrapper.tsx
│   │   ├── mobile-menu-client.tsx
│   │   ├── dashboard/            # Vue d'ensemble
│   │   ├── demandes-recues/      # Demandes reçues
│   │   ├── profil-public/        # Profil public éditable
│   │   ├── agenda/               # Agenda/disponibilités
│   │   └── messagerie/           # Messagerie avec couples
│   │
│   └── api/                      # API Routes
│       ├── auth/                 # Routes authentification
│       ├── chatbot/              # IA chatbot
│       ├── collaborateurs/       # API collaborateurs
│       └── marriage-admin/       # Admin mariage (documents)
│           ├── generate-document/
│           └── upload-document/
│
├── components/                   # Composants React
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── avatar.tsx
│   │   ├── checkbox.tsx
│   │   ├── progress.tsx
│   │   ├── separator.tsx
│   │   ├── switch.tsx
│   │   ├── tooltip.tsx
│   │   └── ... (30+ composants shadcn)
│   │
│   ├── landing/                  # Composants landing page
│   ├── home/                     # Composants homepage
│   ├── auth/                     # Composants authentification
│   ├── pricing/                  # Composants tarifs
│   ├── signup/                   # Composants inscription
│   ├── messages/                 # Composants messagerie
│   ├── budget/                   # Composants budget
│   ├── calendar/                 # Composants calendrier
│   ├── profile/                  # Composants profil
│   ├── dashboard/                # Composants dashboard
│   │
│   ├── couple/                   # Composants spécifiques couple
│   ├── prestataire/              # Composants spécifiques prestataire
│   │   ├── dashboard/
│   │   ├── demandes/
│   │   ├── profil/
│   │   └── shared/
│   │
│   ├── marriage-admin/           # Composants admin mariage
│   ├── magicui/                  # Composants UI magiques
│   ├── logos/                    # Logos et branding
│   ├── providers/                # React providers
│   ├── sections/                 # Sections de page
│   │   ├── cta/
│   │   └── hero/
│   └── app/                      # Composants app layout
│       └── dashboard-sidebar-01/
│
├── lib/                          # Utilitaires et logique métier
│   ├── utils.ts                  # Utilitaires généraux (cn, etc.)
│   ├── auth.ts                   # Logique authentification
│   ├── animations.ts             # Animations Framer Motion
│   ├── scroll.ts                 # Scroll utilities (Lenis)
│   │
│   ├── supabase/                 # Client Supabase
│   │   ├── client.ts             # Client-side Supabase
│   │   ├── server.ts             # Server-side Supabase
│   │   ├── middleware.ts         # Middleware auth Supabase
│   │   ├── admin.ts              # Admin Supabase client
│   │   ├── messages.ts           # API messages
│   │   └── migrations/           # Migrations SQL
│   │
│   ├── types/                    # Types TypeScript
│   │   ├── budget.ts
│   │   └── prestataire.ts
│   │
│   ├── validations/              # Schémas de validation Zod
│   │   ├── auth.schema.ts
│   │   ├── onboarding.schema.ts
│   │   ├── collaborateur.schema.ts
│   │   └── marriage-admin.schema.ts
│   │
│   ├── constants/                # Constantes
│   │   ├── zones.ts
│   │   └── cultures.ts
│   │
│   ├── pdf/                      # Génération PDF
│   │   └── marriage-dossier-generator.ts
│   │
│   └── marriage-admin/           # Admin mariage
│       └── checklist-generator.ts
│
├── types/                        # Types TypeScript globaux
│   ├── index.d.ts                # Types généraux
│   ├── database.types.ts         # Types Supabase auto-générés
│   ├── couple.ts                 # Types couple
│   ├── couples.types.ts
│   ├── matching.ts               # Types matching IA
│   ├── messages.ts               # Types messagerie
│   ├── vapi.d.ts                 # Types VAPI
│   └── marriage-admin/           # Types admin mariage
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.tsx            # Détection mobile
│   ├── use-profile.ts            # Hook profil utilisateur
│   ├── use-user.ts               # Hook user actuel
│   ├── use-toast.ts              # Hook toasts/notifications
│   ├── use-textarea-resize.ts    # Auto-resize textarea
│   └── useScrollPosition.ts      # Position scroll
│
├── store/                        # State management Zustand
│   └── onboarding-store.ts       # Store onboarding
│
├── config/                       # Configuration
├── constants/                    # Constantes globales
├── scripts/                      # Scripts utilitaires
├── public/                       # Assets statiques
├── supabase/                     # Config Supabase
└── docs/                         # Documentation
```

---

## 🎨 Design System

### Palette de couleurs

```css
/* Couleurs principales */
--primary: #823F91           /* Violet premium */
--primary-hover: #6D3478     /* Violet foncé */
--primary-light: #E8D4EF     /* Violet clair */

/* Couleurs de base */
--background: #FFFFFF        /* Blanc pur */
--foreground: #0B0E12        /* Dark Navy */

/* Textes */
--text-primary: #0B0E12      /* Texte principal */
--text-secondary: #374151    /* Texte secondaire */
--text-muted: #6B7280        /* Texte atténué */

/* Bordures et backgrounds */
--border: #E5E7EB            /* Gray-200 */
--muted-bg: #F7F7F7          /* Light gray */
```

### Typographie (Geist)

```css
/* Hiérarchie typographique */
h1: text-4xl font-bold tracking-tight        /* Weight: 700 */
h2: text-2xl font-semibold tracking-tight    /* Weight: 600 */
h3: text-xl font-medium                       /* Weight: 500 */
p:  text-base font-normal                     /* Weight: 400 */
button: text-base font-medium                 /* Weight: 500 */
```

### Composants UI disponibles (shadcn/ui)

**Navigation**: `navigation-menu`, `tabs`, `breadcrumb`
**Inputs**: `button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`
**Feedback**: `toast`, `alert`, `badge`, `progress`, `spinner`
**Overlays**: `dialog`, `popover`, `dropdown-menu`, `hover-card`, `tooltip`, `drawer (vaul)`
**Layout**: `card`, `separator`, `scroll-area`, `resizable`, `accordion`, `collapsible`
**Data**: `avatar`, `label`, `toggle`, `toggle-group`

---

## 🗄️ Base de données Supabase

### Tables principales

#### Authentification & Profils
- **`profiles`**: Profil de base (tous utilisateurs)
  - `id`, `role` (couple|prestataire), `prenom`, `nom`, `onboarding_completed`

- **`couple_profiles`**: Profils couples
  - `user_id`, `ville_marriage`, `date_marriage`, `budget_min`, `budget_max`, `culture`, `prestataires_recherches`

- **`prestataire_profiles`**: Profils prestataires
  - `user_id`, `nom_entreprise`, `type_prestation`, `ville_exercice`, `tarif_min`, `tarif_max`, `cultures_gerees`

#### Prestataires
- **`prestataire_public_profiles`**: Profils publics
  - `prestataire_id`, `description`, `rating`, `total_reviews`, `is_verified`

- **`services`**: Services proposés
  - `id`, `prestataire_id`, `name`, `description`, `price`, `duration_hours`

- **`portfolio_images`**: Portfolio prestataire
  - `id`, `prestataire_id`, `image_url`, `caption`, `display_order`

#### Interactions
- **`demandes`**: Demandes de prestation
  - `id`, `couple_id`, `prestataire_id`, `status` (new|in-progress|accepted|rejected|completed), `date_mariage`, `budget_min`, `budget_max`, `location`, `message`

- **`favoris`**: Prestataires favoris
  - `id`, `couple_id`, `prestataire_id`

- **`reviews`**: Avis
  - `id`, `couple_id`, `prestataire_id`, `demande_id`, `rating` (1-5), `comment`

#### Budget
- **`budget_categories`**: Catégories de budget
  - `id`, `couple_id`, `name`, `budget_allocated`, `spent`

- **`budget_expenses`**: Dépenses
  - `id`, `couple_id`, `category_id`, `description`, `amount`, `date`, `prestataire_id`

#### Planning
- **`timeline_milestones`**: Jalons timeline
  - `id`, `couple_id`, `title`, `description`, `due_date`, `status` (todo|in-progress|done), `prestataire_id`

- **`events`**: Agenda prestataire
  - `id`, `prestataire_id`, `demande_id`, `title`, `date`, `time`, `status` (confirmed|pending|cancelled), `notes`

#### Messagerie
- **`conversations`**: Conversations
  - `id`, `couple_id`, `prestataire_id`, `demande_id`, `last_message_at`

- **`messages`**: Messages
  - `id`, `conversation_id`, `sender_id`, `content`, `is_read`

- **`message_attachments`**: Pièces jointes
  - `id`, `message_id`, `file_url`, `file_name`, `file_size`, `file_type`

#### Collaborateurs
- **`collaborateurs`**: Invités/collaborateurs
  - `id`, `couple_id`, `name`, `email`, `role`, `invited_at`, `accepted_at`, `user_id`

### Sécurité (RLS)

Toutes les tables utilisent **Row Level Security (RLS)** activé avec des politiques spécifiques :
- Les couples accèdent uniquement à leurs données
- Les prestataires accèdent uniquement à leurs données et demandes
- Les profils publics sont visibles par tous
- Les messages ne sont visibles que par les participants

### Storage Buckets

1. **`portfolio-images`**: Images portfolio prestataires (public read)
2. **`message-attachments`**: Fichiers messages (private, participants only)

---

## 🔐 Authentification & Autorisation

### Flow d'authentification

1. **Sign-up**: `/sign-up` → Supabase Auth → Création profil vide
2. **Sign-in**: `/sign-in` → Supabase Auth → Redirection selon rôle
3. **Onboarding**: Après première connexion → Compléter profil → `onboarding_completed = true`
4. **Protection routes**: Middleware Supabase vérifie auth + rôle

### Middleware

- Fichier: `lib/supabase/middleware.ts`
- Vérifie token Supabase
- Protège routes `/couple/*` et `/prestataire/*`
- Redirige vers `/sign-in` si non authentifié

### Helpers Supabase

- **Client-side**: `lib/supabase/client.ts` (pour composants client)
- **Server-side**: `lib/supabase/server.ts` (pour Server Components/API)
- **Admin**: `lib/supabase/admin.ts` (pour opérations admin)

---

## 🎭 Rôles et Permissions

### Rôle: Couple

**Pages accessibles**:
- `/couple/dashboard` - Vue d'ensemble
- `/couple/matching` - Matching IA prestataires
- `/couple/recherche` - Recherche manuelle
- `/couple/budget` - Gestion budget
- `/couple/timeline` - Planning mariage
- `/couple/collaborateurs` - Gestion invités
- `/couple/demandes` - Demandes envoyées
- `/couple/messagerie` - Messages
- `/couple/profil` - Profil personnel
- `/couple/notifications` - Notifications

**Permissions**:
- Rechercher et contacter prestataires
- Gérer budget et timeline
- Inviter collaborateurs
- Envoyer/recevoir messages
- Laisser avis

### Rôle: Prestataire

**Pages accessibles**:
- `/prestataire/dashboard` - Vue d'ensemble
- `/prestataire/demandes-recues` - Demandes (new/in-progress/completed)
- `/prestataire/profil-public` - Édition profil public
- `/prestataire/agenda` - Gestion agenda
- `/prestataire/messagerie` - Messages

**Permissions**:
- Voir/répondre demandes
- Éditer profil public et services
- Gérer portfolio
- Gérer agenda/disponibilités
- Envoyer/recevoir messages

---

## 🤖 Fonctionnalités IA

### Matching IA (`/couple/matching`)

- **Algorithme**: Matching basé sur critères (ville, budget, culture, type prestation)
- **Score**: Calcul de compatibilité
- **Filtres**: Type prestation, budget, localisation, disponibilité
- **Résultats**: Liste triée par score + ratings

### Chatbot IA (`/api/chatbot`)

- **Provider**: OpenAI (GPT-4)
- **SDK**: Vercel AI SDK
- **Context**: Informations mariage du couple
- **Fonctions**: Conseils planning, budget, suggestions prestataires

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile */
< 768px: Menu hamburger, sidebar masquée, layout 1 colonne

/* Tablet */
768px - 1024px: Sidebar icônes uniquement, layout adaptatif

/* Desktop */
> 1024px: Sidebar complète, layout multi-colonnes
```

### Composants responsifs

- **Sidebar**: `SidebarWrapper` avec état collapsed
- **Mobile menu**: `MobileMenuClient` avec drawer
- **TopBar**: Adaptatif selon breakpoint

---

## 🎬 Animations (Framer Motion)

### Animations disponibles (`lib/animations.ts`)

```typescript
// Fade in au scroll
<FadeInOnScroll>...</FadeInOnScroll>

// Slide in au scroll
<SlideInOnScroll direction="up|down|left|right">...</SlideInOnScroll>

// Liste échelonnée
<StaggeredList>...</StaggeredList>

// Fade + Scale au scroll
<FadeInScaleOnScroll>...</FadeInScaleOnScroll>
```

### Smooth Scroll (Lenis)

- Library: `@studio-freight/lenis`
- Init: `lib/scroll.ts`
- Usage: Scroll fluide global automatique

---

## 🛠️ Configuration & Scripts

### Scripts disponibles

```json
"dev": "next dev"              // Dev server (port 3000)
"build": "next build"           // Build production
"start": "next start"           // Start production
"lint": "eslint"                // Lint code
"test": "jest"                  // Tests unitaires
"test:api": "node scripts/test-api.sh"  // Test API
"test:compatibility": "tsx scripts/test-compatibility.ts"  // Test compat
```

### Variables d'environnement (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Resend (Email)
RESEND_API_KEY=

# N8N (Automation)
N8N_WEBHOOK_URL=
```

### Next.js Config (`next.config.ts`)

**Sécurité Headers**:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` (strict)
- `Strict-Transport-Security` (HSTS)

**Images**: Remote patterns pour `images.unsplash.com`

**Compiler**: `removeConsole` en production (sauf error/warn)

---

## 📦 Dépendances clés

### UI & Styling
- `tailwindcss` 4.0
- `@radix-ui/*` (30+ primitives)
- `framer-motion` 12.23.26
- `lucide-react` 0.554.0 (icônes)
- `geist` 1.5.1 (font)

### Forms & Validation
- `react-hook-form` 7.67.0
- `@hookform/resolvers` 3.10.0
- `zod` 4.1.13

### State & Data
- `zustand` 5.0.8
- `@supabase/supabase-js` 2.86.2
- `@supabase/ssr` 0.5.2

### IA & Chat
- `openai` 6.10.0
- `ai` 5.0.107 (Vercel AI SDK)
- `@ai-sdk/openai` 2.0.77
- `@ai-sdk/react` 2.0.107

### Utilities
- `date-fns` 4.1.0
- `clsx` + `tailwind-merge` (cn utility)
- `lru-cache` 11.2.4
- `pdf-lib` 1.17.1
- `resend` 4.8.0

---

## 🔄 Flux de données typiques

### 1. Création de demande (Couple → Prestataire)

```
Couple recherche prestataire
  ↓
Couple envoie demande (/couple/matching ou /couple/recherche)
  ↓
INSERT dans table `demandes` (status: 'new')
  ↓
Notification au prestataire
  ↓
Prestataire voit dans /prestataire/demandes-recues
  ↓
Prestataire accepte/rejette
  ↓
UPDATE `demandes` (status: 'accepted' ou 'rejected')
  ↓
Notification au couple
```

### 2. Messagerie (Couple ↔ Prestataire)

```
User A ouvre conversation avec User B
  ↓
SELECT ou INSERT conversation dans `conversations`
  ↓
User A envoie message
  ↓
INSERT dans `messages`
  ↓
UPDATE `conversations.last_message_at`
  ↓
Supabase Realtime notifie User B
  ↓
User B voit message en temps réel
  ↓
User B marque comme lu
  ↓
UPDATE `messages.is_read`
```

### 3. Matching IA

```
Couple va sur /couple/matching
  ↓
Sélectionne critères (type, ville, budget, culture)
  ↓
API route calcule matching score
  ↓
Requête SQL avec JOINs:
  - prestataire_profiles
  - prestataire_public_profiles
  - reviews (pour rating)
  ↓
Tri par score + rating
  ↓
Affichage résultats avec filtres dynamiques
```

---

## 🚀 Déploiement

### Plateforme: Vercel

**Configuration**:
- Build command: `npm run build`
- Output directory: `.next`
- Install command: `npm install`
- Node version: 20.x

**Variables d'environnement**:
- Configurer toutes les variables `.env.local` dans Vercel
- Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`

### Supabase

**Setup**:
1. Créer projet Supabase
2. Exécuter migrations SQL (voir `SUPABASE_SCHEMA.md`)
3. Configurer RLS policies
4. Créer Storage buckets
5. Récupérer URL + Keys → `.env.local`

---

## 🧪 Tests

### Jest Configuration

- Config: `jest.config.js`
- Test files: `**/*.test.ts`, `**/*.test.tsx`
- Coverage: Non configuré
- Runner: `ts-jest`

### Scripts de test

```bash
npm run test                    # Tests unitaires Jest
npm run test:api               # Tests API
npm run test:compatibility     # Tests compatibilité
```

---

## 📋 Conventions de code

### Naming

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase avec `use` prefix (`useProfile.ts`)
- **Utilities**: camelCase (`formatDate`)
- **Types**: PascalCase (`UserProfile`, `DemandeStatus`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### Structure fichiers

```typescript
// 1. Imports externes
import { useState } from 'react'

// 2. Imports internes (libs)
import { cn } from '@/lib/utils'

// 3. Imports composants
import { Button } from '@/components/ui/button'

// 4. Imports types
import type { User } from '@/types'

// 5. Types locaux
interface Props { ... }

// 6. Composant
export function Component() { ... }
```

### TypeScript

- **Mode strict**: Activé
- **Typage**: Explicite sur props et returns
- **Éviter `any`**: Utiliser `unknown` si nécessaire
- **Interfaces vs Types**: Préférer `interface` pour objets, `type` pour unions

---

## 🔧 Commandes utiles

### Développement

```bash
# Dev server
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Format (si Prettier configuré)
npx prettier --write .
```

### Supabase

```bash
# Générer types TypeScript depuis DB
npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.types.ts

# Migrations locales
npx supabase migration new <migration_name>
npx supabase db push
```

### shadcn/ui

```bash
# Ajouter composant
npx shadcn@latest add <component-name>

# Liste des composants disponibles
npx shadcn@latest add
```

---

## 📝 Points importants pour l'IA

### Lors de modifications de code

1. **Lire avant d'écrire**: Toujours lire le fichier existant avant de proposer des changements
2. **Respecter le style**: Suivre les conventions de code établies
3. **Types stricts**: Toujours typer correctement (pas de `any`)
4. **Components**: Privilégier les composants shadcn/ui existants
5. **Animations**: Utiliser les animations Framer Motion de `lib/animations.ts`
6. **Sécurité**: Vérifier les permissions RLS et les validations Zod

### Patterns à suivre

**Server Components (par défaut)**:
```typescript
// app/couple/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = createClient()
  const { data } = await supabase.from('...').select()
  return <div>...</div>
}
```

**Client Components (avec 'use client')**:
```typescript
'use client'
// Uniquement si nécessaire (state, events, hooks)
export function InteractiveComponent() {
  const [state, setState] = useState()
  return <div onClick={...}>...</div>
}
```

**Forms avec Zod**:
```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({ ... })
const form = useForm({ resolver: zodResolver(schema) })
```

**Supabase queries**:
```typescript
// Client
import { createClient } from '@/lib/supabase/client'

// Server
import { createClient } from '@/lib/supabase/server'

// Admin
import { createAdminClient } from '@/lib/supabase/admin'
```

### Fichiers à ne PAS modifier sans raison

- `components.json` (config shadcn)
- `tailwind.config.ts` (sauf ajout couleurs/utils)
- `next.config.ts` (sauf headers/images)
- `types/database.types.ts` (auto-généré depuis Supabase)

---

## 🎯 Roadmap & TODOs

### À implémenter

- [ ] **Notifications temps réel**: Table + Supabase Realtime
- [ ] **Paiements**: Intégration Stripe
- [ ] **Abonnements**: Plans premium pour prestataires
- [ ] **Analytics**: Dashboard analytics pour prestataires
- [ ] **SEO**: Metadata dynamique, sitemap, robots.txt
- [ ] **PWA**: Service worker, manifest.json
- [ ] **Tests E2E**: Playwright/Cypress
- [ ] **Storybook**: Documentation composants
- [ ] **i18n**: Support multilingue (FR/EN)
- [ ] **Webhooks**: N8N automation avancée

### Optimisations

- [ ] **Images**: Optimisation lazy loading
- [ ] **Bundle size**: Code splitting avancé
- [ ] **Caching**: SWR/React Query pour requêtes
- [ ] **Performance**: Lighthouse score > 90
- [ ] **Accessibility**: WCAG AA compliance

---

## 📞 Support & Documentation

### Documentation externe

- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind**: https://tailwindcss.com/docs
- **Framer Motion**: https://www.framer.com/motion

### Documentation interne

- `README.md` - Vue d'ensemble et installation
- `SUPABASE_SCHEMA.md` - Schéma complet base de données
- `BUDGET_IMPLEMENTATION.md` - Implémentation système budget
- `PROFILE_IMPLEMENTATION.md` - Implémentation profils
- `MESSAGERIE_IMPLEMENTATION.md` - Implémentation messagerie
- `AUDIT_SECURITE_NUPLY.md` - Audit sécurité
- `SETUP_RESEND.md` - Configuration emails
- `VERCEL_DEPLOYMENT.md` - Déploiement Vercel

---

## 🎓 Résumé pour Claude/Cursor

**NUPLY** est un SaaS B2C de planification de mariage avec :

1. **Architecture**: Next.js 16 App Router + Supabase + TypeScript strict
2. **Deux rôles**: Couples (clients) et Prestataires (fournisseurs)
3. **Fonctionnalités clés**: Matching IA, Budget, Timeline, Messagerie, Agenda
4. **Design**: TailwindCSS 4 + shadcn/ui + Geist font + Violet (#823F91)
5. **State**: Server Components par défaut, Client Components si nécessaire
6. **Data**: Supabase (17 tables) avec RLS strict
7. **Sécurité**: Headers CSP, RLS, Validation Zod, Middleware auth
8. **UX**: Animations Framer Motion, Smooth scroll Lenis, Responsive

**Toujours** vérifier les types, respecter les conventions, et prioriser la sécurité et la performance.

---

*Dernière mise à jour: 2026-01-06*
*Version: 1.0.0*
