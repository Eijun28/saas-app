# NUPLY — Référence Architecture pour Claude/Cursor

> Document de référence IA pour le projet NUPLY. Maintenir ce fichier à jour à chaque changement structurel important.

---

## Vue d'ensemble

**NUPLY** est une plateforme SaaS premium B2C de planification de mariage qui connecte les couples avec des prestataires (photographes, traiteurs, fleuristes, etc.) via le système **Nuply Matching**.

**Stack technique :**
- Framework: Next.js 16.1.1 (App Router, Server Components par défaut)
- Language: TypeScript 5.9.3 (strict mode)
- UI: React 19.2.1 + TailwindCSS 4 + shadcn/ui (Radix primitives)
- Animations: Framer Motion 12.23.26 + Lenis 1.3.15 (smooth scroll)
- Backend: Supabase (Auth, PostgreSQL, Storage, Realtime)
- State: Zustand 5.0.8 + React Context
- Forms: React Hook Form 7.67.0 + Zod 4.1.13
- IA/Chat: OpenAI SDK 6.10.0 + Vercel AI SDK 5.0.107 (@ai-sdk/openai, @ai-sdk/react)
- Email: Resend 6.9.0
- Paiements: Stripe 17.7.0 + Stripe Connect
- PDF: pdf-lib 1.17.1
- Monitoring: Sentry 10.38.0 + Vercel Analytics + Speed Insights
- Déploiement: Vercel (cron job email sequences 09:00 daily)
- Font: Geist (variable font)

---

## Architecture des dossiers

```
saas-app/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (Geist font, providers)
│   ├── page.tsx                # Landing page publique
│   ├── globals.css             # Styles globaux + design system tokens
│   ├── error.tsx / global-error.tsx / not-found.tsx
│   ├── (auth)/                 # Group auth (layout sans sidebar)
│   │   └── auth/callback/      # OAuth callback Supabase
│   ├── sign-in/ sign-up/       # Authentification
│   ├── forgot-password/ reset-password/
│   ├── onboarding/role/        # Sélection de rôle après signup
│   ├── auth/confirm/           # Confirmation email
│   ├── admin/                  # Admin dashboard (early adopters, ambassadeurs)
│   ├── couple/                 # Espace couple (protégé, role=couple)
│   │   ├── layout.tsx          # Layout avec sidebar couple
│   │   ├── sidebar-wrapper.tsx / sidebar-inset-wrapper.tsx / mobile-menu-client.tsx
│   │   ├── dashboard/          # Vue d'ensemble
│   │   ├── matching/           # Nuply Matching IA
│   │   ├── recherche/          # Recherche manuelle prestataires
│   │   ├── budget/             # Gestion budget (catégories + dépenses)
│   │   ├── timeline/           # Planning mariage (jalons)
│   │   ├── collaborateurs/     # Gestion collaborateurs/invités
│   │   ├── demandes/           # Demandes envoyées
│   │   ├── evenements/         # Événements
│   │   ├── factures/           # Factures
│   │   ├── favoris/            # Prestataires favoris
│   │   ├── invites/            # Liste invités
│   │   ├── jour-j/             # Programme jour J
│   │   ├── messagerie/         # Messagerie temps réel
│   │   ├── notifications/      # Notifications
│   │   ├── paiements/          # Gestion paiements
│   │   └── profil/ parametres/
│   ├── prestataire/            # Espace prestataire (protégé, role=prestataire)
│   │   ├── layout.tsx          # Layout avec sidebar prestataire
│   │   ├── dashboard/          # Vue d'ensemble
│   │   ├── demandes-recues/    # Demandes reçues (new/in-progress/accepted/rejected/completed)
│   │   ├── profil-public/      # Édition profil public
│   │   ├── agenda/             # Agenda / disponibilités
│   │   ├── disponibilites/     # Gestion disponibilités
│   │   ├── messagerie/         # Messages avec couples
│   │   ├── analytics/          # Analytics prestataire
│   │   ├── onboarding/         # Onboarding prestataire
│   │   └── parametres/
│   ├── api/                    # API Routes
│   │   ├── auth/               # create-profile, signout
│   │   ├── chatbot/ chatbot-advisor/   # IA chatbot (OpenAI GPT-4)
│   │   ├── collaborateurs/
│   │   ├── couple-payments/ couple/billing-info/
│   │   ├── contact/
│   │   ├── cron/email-sequences/      # Cron Vercel 09:00 daily
│   │   ├── devis/              # generate, quick-generate, templates, couples
│   │   ├── factures/
│   │   ├── generate-services/
│   │   ├── google-calendar/    # connect, sync
│   │   ├── guests/
│   │   ├── marriage-admin/     # create, generate-document, generate-pdf, upload-document
│   │   ├── matching/ matching/track/
│   │   ├── messages/check-unread/
│   │   ├── payments/ billing-consent/
│   │   ├── prestataire/        # ambassador, analytics, reviews/respond
│   │   ├── provider-availability/
│   │   ├── rsvp/
│   │   ├── stripe/             # webhook, create-checkout-session, cancel-subscription
│   │   ├── stripe-connect/
│   │   ├── subscriptions/
│   │   ├── vendor-invitations/
│   │   ├── wedding-day-program/
│   │   └── admin/
│   ├── blog/ [slug]/           # Blog public
│   ├── tarifs/ contact/ cgu/ confidentialite/ legal/ notre-vision/
│   ├── invitation/[token]/     # Invitation prestataire
│   ├── rejoindre/[token]/      # Rejoindre en tant que collaborateur
│   ├── programme/[token]/      # Programme de mariage public
│   └── rsvp/[guestId]/         # RSVP invité
├── components/
│   ├── ui/                     # shadcn/ui (30+ composants Radix)
│   ├── layout/                 # Sidebar, TopBar, NavItem, RoleSwitcher, MobileMenu, Footer
│   ├── auth/                   # SignInForm, SignUpForm, PasswordReset, OAuthButtons
│   ├── landing/ home/ pricing/ signup/  # Composants pages publiques
│   ├── couple/shared/          # Composants partagés espace couple
│   ├── prestataire/            # dashboard/, demandes/, profil/, shared/
│   ├── matching/ recherche/    # UI matching et recherche
│   ├── budget/ calendar/views/ # Budget et calendrier
│   ├── couple-events/ couple-payments/
│   ├── guests/ messages/ messaging/ dashboard/ profile/
│   ├── provider/ providers/ provider-availability/ reviews/
│   ├── devis/ wedding-day-program/ marriage-admin/
│   ├── payments/ stripe/
│   ├── sections/cta/ sections/hero/
│   ├── animate-ui/ magicui/ shadcn-studio/  # Composants UI avancés
│   ├── logos/ seo/ legal/
│   └── app/dashboard-sidebar-01/
├── lib/
│   ├── utils.ts                # cn(), helpers généraux
│   ├── animations.ts           # Framer Motion presets (FadeInOnScroll, SlideInOnScroll, StaggeredList)
│   ├── scroll.ts               # Lenis smooth scroll init
│   ├── logger.ts               # Logging utility
│   ├── cache.ts                # Caching helpers (lru-cache)
│   ├── rate-limit.ts           # Rate limiting
│   ├── security.ts             # Security helpers
│   ├── design-system.ts        # Design system utilities
│   ├── api-error-handler.ts    # API error handling
│   ├── subscription-guard.ts   # Subscription protection
│   ├── constants.ts            # Constantes globales
│   ├── google-calendar.ts      # Google Calendar utilities
│   ├── auth/                   # middleware, roles, permissions, strategies
│   ├── supabase/               # client.ts, server.ts, admin.ts, middleware.ts, messages.ts, queries/, migrations/
│   ├── actions/                # Server actions (auth, profile, matching, ...)
│   ├── validations/            # Zod schemas (auth, onboarding, collaborateur, marriage-admin, ...)
│   ├── types/                  # database.types.ts (auto-généré), couple, matching, messages, vapi.d.ts, ...
│   ├── constants/              # zones.ts, cultures.ts
│   ├── config/ context/ stores/onboarding-store.ts
│   ├── blog/ chatbot/ email/ profile/ matching/ marriage-admin/ pdf/ stripe/ seo/ utils/ errors/
│   └── __tests__/              # Tests unitaires
├── hooks/
│   ├── use-mobile.tsx          # Détection mobile
│   ├── use-profile.ts          # Hook profil utilisateur
│   ├── use-user.ts             # Hook user actuel
│   ├── use-toast.ts            # Hook toasts
│   ├── use-textarea-resize.ts  # Auto-resize textarea
│   └── useScrollPosition.ts    # Position scroll
├── types/                      # Types globaux (index.d.ts, database.types.ts, couple, matching, messages, vapi.d.ts, marriage-admin/)
├── store/                      # onboarding-store.ts (Zustand)
├── public/                     # Assets statiques (icons/, images/, readme/)
├── scripts/                    # test-api.sh, test-compatibility.ts
├── email-templates/            # Templates email Resend
├── supabase/migrations/        # Migrations SQL
├── config/                     # Config projet
├── constants/                  # Constantes globales
├── docs/                       # Documentation (architecture/, deployment/, guides/, setup/, internal/, archive/)
├── .github/workflows/          # CI/CD GitHub Actions
│   └── auto-merge.yml          # Auto-merge PRs après checks
└── [root config files]         # next.config.ts, tailwind.config.ts, tsconfig.json, vercel.json, jest.config.js, sentry.*.config.ts, eslint.config.mjs, components.json
```

---

## Base de données Supabase

**17 tables avec RLS activé sur toutes.**

### Authentification & Profils
| Table | Champs clés |
|-------|-------------|
| `profiles` | `id`, `role` (couple\|prestataire), `prenom`, `nom`, `onboarding_completed` |
| `couple_profiles` | `user_id`, `ville_marriage`, `date_marriage`, `budget_min`, `budget_max`, `culture`, `prestataires_recherches` |
| `prestataire_profiles` | `user_id`, `nom_entreprise`, `type_prestation`, `ville_exercice`, `tarif_min`, `tarif_max`, `cultures_gerees` |
| `prestataire_public_profiles` | `prestataire_id`, `description`, `rating`, `total_reviews`, `is_verified` |

### Services & Portfolio
| Table | Champs clés |
|-------|-------------|
| `services` | `id`, `prestataire_id`, `name`, `description`, `price`, `duration_hours` |
| `portfolio_images` | `id`, `prestataire_id`, `image_url`, `caption`, `display_order` |

### Interactions
| Table | Champs clés |
|-------|-------------|
| `demandes` | `id`, `couple_id`, `prestataire_id`, `status` (new\|in-progress\|accepted\|rejected\|completed), `date_mariage`, `budget_min`, `budget_max`, `location`, `message` |
| `favoris` | `id`, `couple_id`, `prestataire_id` |
| `reviews` | `id`, `couple_id`, `prestataire_id`, `demande_id`, `rating` (1-5), `comment` |

### Budget & Planning
| Table | Champs clés |
|-------|-------------|
| `budget_categories` | `id`, `couple_id`, `name`, `budget_allocated`, `spent` |
| `budget_expenses` | `id`, `couple_id`, `category_id`, `description`, `amount`, `date`, `prestataire_id` |
| `timeline_milestones` | `id`, `couple_id`, `title`, `description`, `due_date`, `status` (todo\|in-progress\|done), `prestataire_id` |
| `events` | `id`, `prestataire_id`, `demande_id`, `title`, `date`, `time`, `status` (confirmed\|pending\|cancelled), `notes` |

### Messagerie
| Table | Champs clés |
|-------|-------------|
| `conversations` | `id`, `couple_id`, `prestataire_id`, `demande_id`, `last_message_at` |
| `messages` | `id`, `conversation_id`, `sender_id`, `content`, `is_read` |
| `message_attachments` | `id`, `message_id`, `file_url`, `file_name`, `file_size`, `file_type` |

### Collaborateurs
| Table | Champs clés |
|-------|-------------|
| `collaborateurs` | `id`, `couple_id`, `name`, `email`, `role`, `invited_at`, `accepted_at`, `user_id` |

### RLS (Row Level Security)
- Couples : accès uniquement à leurs propres données
- Prestataires : accès à leurs données + demandes reçues
- Profils publics : lecture publique
- Messages : uniquement les participants à la conversation

### Storage Buckets
- `portfolio-images` — images portfolio prestataires (public read)
- `message-attachments` — fichiers messages (private, participants seulement)

---

## Authentification & Rôles

### Flow
1. `/sign-up` → Supabase Auth → trigger création `profiles` vide
2. `/sign-in` → Supabase Auth → redirect selon rôle
3. Première connexion → `/onboarding/role` → compléter profil → `onboarding_completed = true`
4. Middleware (`lib/supabase/middleware.ts`) vérifie auth + rôle → protège `/couple/*` et `/prestataire/*` → redirect `/sign-in` si non authentifié

### Helpers Supabase
```typescript
import { createClient } from '@/lib/supabase/client'   // Client components
import { createClient } from '@/lib/supabase/server'   // Server Components / API Routes
import { createAdminClient } from '@/lib/supabase/admin' // Opérations admin (bypass RLS)
```

### Rôle Couple — pages accessibles
`/couple/dashboard`, `/couple/matching`, `/couple/recherche`, `/couple/budget`, `/couple/timeline`, `/couple/collaborateurs`, `/couple/demandes`, `/couple/evenements`, `/couple/factures`, `/couple/favoris`, `/couple/invites`, `/couple/jour-j`, `/couple/messagerie`, `/couple/notifications`, `/couple/paiements`, `/couple/profil`, `/couple/parametres`

### Rôle Prestataire — pages accessibles
`/prestataire/dashboard`, `/prestataire/demandes-recues`, `/prestataire/profil-public`, `/prestataire/agenda`, `/prestataire/disponibilites`, `/prestataire/messagerie`, `/prestataire/analytics`, `/prestataire/onboarding`, `/prestataire/parametres`

---

## Design System

### Couleurs
```css
--primary:        #823F91   /* Violet premium */
--primary-hover:  #6D3478   /* Violet foncé */
--primary-light:  #E8D4EF   /* Violet clair */
--background:     #FFFFFF   /* Blanc pur */
--foreground:     #0B0E12   /* Dark Navy */
--text-primary:   #0B0E12
--text-secondary: #374151
--text-muted:     #6B7280
--border:         #E5E7EB   /* Gray-200 */
--muted-bg:       #F7F7F7   /* Light gray */
```

### Typographie (Geist)
```
h1: text-4xl font-bold tracking-tight      (700)
h2: text-2xl font-semibold tracking-tight  (600)
h3: text-xl font-medium                    (500)
p:  text-base font-normal                  (400)
button: text-base font-medium              (500)
```

### Composants shadcn/ui disponibles
Navigation: `navigation-menu`, `tabs`, `breadcrumb`
Inputs: `button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`
Feedback: `toast`, `alert`, `badge`, `progress`
Overlays: `dialog`, `popover`, `dropdown-menu`, `hover-card`, `tooltip`, `drawer`
Layout: `card`, `separator`, `scroll-area`, `accordion`, `collapsible`, `resizable`
Data: `avatar`, `label`, `toggle`, `toggle-group`, `calendar`, `date-picker`

### Responsive
```
< 768px   : Mobile — menu hamburger, sidebar masquée, 1 colonne
768-1024px: Tablet — sidebar icônes seulement
> 1024px  : Desktop — sidebar complète, multi-colonnes
```

---

## Patterns de code

### Server Component (défaut)
```typescript
// app/couple/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = createClient()
  const { data } = await supabase.from('demandes').select()
  return <div>...</div>
}
```

### Client Component
```typescript
'use client'
// Uniquement si nécessaire: state local, event handlers, hooks React
export function InteractiveComponent() {
  const [open, setOpen] = useState(false)
  return <button onClick={() => setOpen(true)}>...</button>
}
```

### Form avec Zod
```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({ email: z.string().email(), message: z.string().min(1) })
type FormData = z.infer<typeof schema>

export function MyForm() {
  const form = useForm<FormData>({ resolver: zodResolver(schema) })
  // ...
}
```

### Structure fichier standard
```typescript
// 1. Imports externes (react, next, libraries)
// 2. Imports internes libs (@/lib/...)
// 3. Imports composants (@/components/...)
// 4. Imports types (@/types/...)
// 5. Types / interfaces locaux
// 6. Composant ou fonction principale (export)
```

### Conventions de nommage
- Components: `PascalCase` (ex: `UserProfile.tsx`)
- Hooks: `camelCase` avec prefix `use` (ex: `useProfile.ts`)
- Utilities: `camelCase` (ex: `formatDate`)
- Types/Interfaces: `PascalCase` (ex: `DemandeStatus`)
- Constants: `UPPER_SNAKE_CASE` (ex: `MAX_FILE_SIZE`)

### TypeScript
- Strict mode activé — pas de `any`, utiliser `unknown` si nécessaire
- Préférer `interface` pour les objets, `type` pour les unions/intersections
- Toujours typer les props et return des fonctions publiques
- `types/database.types.ts` est **auto-généré** depuis Supabase — ne pas modifier à la main

---

## Animations & Scroll

### Framer Motion (`lib/animations.ts`)
```typescript
<FadeInOnScroll>...</FadeInOnScroll>
<SlideInOnScroll direction="up|down|left|right">...</SlideInOnScroll>
<StaggeredList>...</StaggeredList>
<FadeInScaleOnScroll>...</FadeInScaleOnScroll>
```

### Lenis Smooth Scroll
- Init dans `lib/scroll.ts` — scroll fluide global automatique

---

## Flux de données

### Création de demande
```
Couple (matching ou recherche) → INSERT demandes (status: 'new')
→ Notification prestataire
→ Prestataire accepte/rejette → UPDATE demandes.status
→ Notification couple
```

### Messagerie temps réel
```
User A envoie message → INSERT messages → UPDATE conversations.last_message_at
→ Supabase Realtime notifie User B → User B marque lu → UPDATE messages.is_read
```

### Nuply Matching
```
Couple sélectionne critères (type, ville, budget, culture)
→ API /api/matching calcule matching score
→ Query SQL avec JOINs (prestataire_profiles + prestataire_public_profiles + reviews)
→ Tri par score + rating → Affichage avec filtres dynamiques
```

---

## CI/CD & GitHub Actions

### Auto-merge des PRs
Le workflow `.github/workflows/auto-merge.yml` merge automatiquement les PRs après passage des checks CI.

**Déclenchement**: Dès qu'une PR est ouverte ou synchronisée, et quand les checks status passent.

**Condition de merge**: La PR doit avoir le label `auto-merge` OU être de type dependabot. Tous les checks requis doivent passer. Merge via `squash` pour garder l'historique propre.

### Workflow disponibles
- `auto-merge.yml` — Merge automatique des PRs après CI réussi

---

## Configuration & Scripts

### Scripts npm
```bash
npm run dev              # Dev server (port 3000)
npm run build            # Build production
npm run start            # Start production
npm run lint             # ESLint
npm run test             # Jest (tests unitaires)
npm run test:api         # Test API (scripts/test-api.sh)
npm run test:compatibility # Test compatibilité (scripts/test-compatibility.ts)
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

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Sentry
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# N8N (Automation)
N8N_WEBHOOK_URL=

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Next.js Config (`next.config.ts`)
- Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `CSP` strict, `HSTS`
- Remote images: `images.unsplash.com`, domaine Supabase Storage
- `removeConsole` en production (sauf error/warn)
- Sentry intégré via withSentryConfig

### Vercel (`vercel.json`)
- Cron: `/api/cron/email-sequences` tous les jours à 09:00 (`9 * * *`)

---

## Commandes utiles

```bash
# Type check
npx tsc --noEmit

# Générer types Supabase
npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.types.ts

# Migrations Supabase
npx supabase migration new <migration_name>
npx supabase db push

# Ajouter composant shadcn/ui
npx shadcn@latest add <component-name>
```

---

## Fichiers à ne PAS modifier sans raison explicite
- `components.json` — config shadcn/ui (chemins, style)
- `tailwind.config.ts` — config Tailwind (sauf ajout couleurs/plugins)
- `next.config.ts` — sauf ajout de headers/images/env
- `types/database.types.ts` — auto-généré depuis Supabase
- `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`

---

## Documentation interne (`/docs/`)

```
docs/
├── architecture/       # Schéma DB, audit sécurité, architecture messaging, RLS
├── deployment/         # ENV example, Vercel deployment, quick start
├── guides/             # Budget, matching, messagerie, profil, icônes, ...
├── setup/              # Supabase, Stripe, Resend, Google Calendar, admin setup
├── internal/           # Fichiers internes Claude/Cursor (ce fichier)
└── archive/            # Rapports d'analyse et diagnostics historiques
```

---

## Roadmap

### À implémenter
- [ ] Tests E2E (Playwright/Cypress)
- [ ] PWA (service worker, manifest.json)
- [ ] i18n (support FR/EN)
- [ ] Storybook (documentation composants)
- [ ] Webhooks N8N automation avancée

### Optimisations
- [ ] SWR/React Query pour caching requêtes client
- [ ] Code splitting avancé (bundle analysis)
- [ ] Lighthouse score > 90 (images, LCP)
- [ ] WCAG AA compliance (accessibility)

---

## Résumé pour l'IA

**NUPLY** = SaaS mariage, deux rôles (couple/prestataire), matching IA, messagerie temps réel, budget, timeline, agenda, paiements Stripe.

Règles fondamentales :
1. **Lire avant de modifier** — toujours lire le fichier existant avant de proposer des changements
2. **Server Components par défaut** — `'use client'` uniquement si nécessaire (state, events, browser APIs)
3. **shadcn/ui en priorité** — utiliser les composants existants avant d'en créer de nouveaux
4. **Zod pour toute validation** — pas de validation manuelle
5. **RLS est la sécurité** — ne jamais bypasser sans `createAdminClient()` justifié
6. **Pas de `any`** — TypeScript strict, utiliser `unknown` ou types génériques
7. **Animations via `lib/animations.ts`** — réutiliser les presets Framer Motion existants

---

*Dernière mise à jour: 2026-02-23 — Version 2.0.0*
