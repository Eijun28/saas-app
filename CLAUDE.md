# NUPLY — Référence Architecture pour Claude/Cursor

> Document de référence IA pour le projet NUPLY. Maintenir ce fichier à jour à chaque changement structurel important.
> **v3.0.0 — 2026-02-27 — Généré depuis l'analyse réelle du codebase.**

---

## Vue d'ensemble

**NUPLY** est une plateforme SaaS premium B2C de planification de mariage qui connecte les couples avec des prestataires (photographes, traiteurs, fleuristes, etc.) via le système **Nuply Matching**.

**Stack technique :**
- Framework: Next.js 16.1.1 (App Router, Server Components par défaut)
- Language: TypeScript 5.9.3 (strict mode)
- UI: React 19.2.1 + TailwindCSS 4 (`@import "tailwindcss"`) + shadcn/ui new-york style
- Animations: Framer Motion 12.23.26 + Lenis 1.3.15 (smooth scroll) + tw-animate-css
- Backend: Supabase (Auth, PostgreSQL, Storage, Realtime)
- State: Zustand 5.0.8 + React Context
- Forms: React Hook Form 7.67.0 + Zod 4.1.13
- IA/Chat: OpenAI SDK 6.10.0 + Vercel AI SDK 5.0.107 (@ai-sdk/openai, @ai-sdk/react)
- Email: Resend 6.9.0
- Paiements: Stripe 17.7.0 + Stripe Connect
- PDF: pdf-lib 1.17.1
- Charts: Recharts 3.5.1
- Monitoring: Sentry 10.38.0 + Vercel Analytics + Speed Insights
- Font: Geist Sans (variable, importé via `geist/font/sans`)
- Icons: Lucide React 0.554.0
- Déploiement: Vercel (cron job email sequences 09:00 UTC daily)

---

## Architecture des dossiers

```
saas-app/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (GeistSans, Toaster, Analytics, JSON-LD)
│   ├── page.tsx                # Landing page publique (lazy-loaded sections)
│   ├── globals.css             # ~1155 lignes (tokens CSS + composants + utilities)
│   ├── error.tsx / global-error.tsx / not-found.tsx
│   ├── opengraph-image.tsx / twitter-image.tsx  # OG images (file-based Next.js)
│   ├── robots.ts / sitemap.ts  # SEO
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
│   │   ├── devis-factures/     # Devis et factures prestataire
│   │   └── parametres/
│   ├── api/                    # API Routes (27+ endpoints)
│   │   ├── auth/               # create-profile, signout
│   │   ├── chatbot/ chatbot-advisor/   # IA chatbot (OpenAI GPT-4)
│   │   ├── collaborateurs/
│   │   ├── couple-payments/ couple/billing-info/
│   │   ├── contact/
│   │   ├── cron/email-sequences/      # Cron Vercel 09:00 UTC daily
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
│   ├── ui/                     # shadcn/ui (70+ composants)
│   ├── layout/                 # Sidebar, TopBar, AnimatedHeader, CoupleHeader,
│   │                           # PrestataireHeader, MobileBottomNav, MobileMenu,
│   │                           # NavItem, RoleSwitcher, Footer, FooterWrapper, MainWrapper
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
│   ├── Chatbot.tsx             # Chatbot principal (désactivé temporairement)
│   ├── CityAutocomplete.tsx    # Autocomplete villes
│   ├── HeroFlipWords.tsx       # Animation hero
│   ├── NuplyNavbarMenu.tsx     # Navbar principale
│   ├── Particles.jsx / LightRays.jsx  # Effets de fond
│   └── app/dashboard-sidebar-01/
├── lib/
│   ├── utils.ts                # cn(), getErrorMessage(), extractSupabaseError()
│   ├── animations.ts           # Framer Motion variants (fadeInUp, cardHover, ...)
│   ├── scroll.ts               # Lenis smooth scroll init
│   ├── logger.ts               # Logging utility
│   ├── cache.ts                # LRU cache helpers
│   ├── rate-limit.ts           # Rate limiting
│   ├── security.ts             # Security helpers
│   ├── design-system.ts        # Tokens TS exportés (colors, typography, spacing, ...)
│   ├── api-error-handler.ts    # API error handling
│   ├── subscription-guard.ts   # Subscription protection
│   ├── constants.ts            # Constantes globales
│   ├── google-calendar.ts      # Google Calendar utilities
│   ├── auth/                   # middleware, roles, permissions, strategies
│   ├── supabase/               # client.ts, server.ts, admin.ts, middleware.ts,
│   │                           # messages.ts, conversations.ts, messaging.ts,
│   │                           # chatbot-conversations.ts, queries/, migrations/
│   ├── actions/                # Server actions (auth, profile, matching, ...)
│   ├── validations/            # Zod schemas (auth, onboarding, collaborateur, ...)
│   ├── types/                  # Types par domaine
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
│   ├── use-notifications.ts    # Notifications
│   ├── use-provider-pricing.ts # Tarifs prestataire
│   ├── use-is-in-view.tsx      # Intersection observer
│   ├── useChatbot.ts           # State chatbot
│   └── useScrollPosition.ts    # Position scroll
├── types/                      # Types globaux (18 fichiers dont database.types.ts auto-généré)
├── store/                      # onboarding-store.ts (Zustand)
├── config/
│   └── site.ts                 # siteConfig (url, nom, liens sociaux)
├── constants/                  # zones.ts, cultures.ts
├── public/                     # Assets statiques (icons/, images/, readme/)
├── scripts/                    # test-api.sh, test-compatibility.ts
├── email-templates/            # Templates email Resend
├── supabase/migrations/        # Migrations SQL
├── skills/                     # Guides de référence IA par domaine
├── docs/                       # Documentation (architecture/, deployment/, guides/, setup/, archive/)
├── .github/workflows/
│   └── auto-merge.yml          # Auto-merge PRs après checks
└── [root config files]         # next.config.ts, tailwind.config.ts, tsconfig.json,
                                # vercel.json, jest.config.js, sentry.*.config.ts,
                                # eslint.config.mjs, components.json
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
4. Middleware (`lib/supabase/middleware.ts`) vérifie auth + rôle → protège `/couple/*` et `/prestataire/*`

### Helpers Supabase
```typescript
import { createClient } from '@/lib/supabase/client'   // Client components
import { createClient } from '@/lib/supabase/server'   // Server Components / API Routes
import { createAdminClient } from '@/lib/supabase/admin' // Opérations admin (bypass RLS)
```

### Rôle Couple — pages accessibles
`/couple/dashboard`, `/couple/matching`, `/couple/recherche`, `/couple/budget`, `/couple/timeline`, `/couple/collaborateurs`, `/couple/demandes`, `/couple/evenements`, `/couple/factures`, `/couple/favoris`, `/couple/invites`, `/couple/jour-j`, `/couple/messagerie`, `/couple/notifications`, `/couple/paiements`, `/couple/profil`, `/couple/parametres`

### Rôle Prestataire — pages accessibles
`/prestataire/dashboard`, `/prestataire/demandes-recues`, `/prestataire/profil-public`, `/prestataire/agenda`, `/prestataire/disponibilites`, `/prestataire/messagerie`, `/prestataire/analytics`, `/prestataire/onboarding`, `/prestataire/devis-factures`, `/prestataire/parametres`

---

## Design System

> Source canonique : `app/globals.css` (tokens CSS) + `lib/design-system.ts` (tokens TypeScript)
> **IMPORTANT** : Le fond de l'app est BEIGE (#FBF8F3), pas blanc. Ne jamais supposer un fond blanc.

### Palette CSS réelle (dans globals.css)

```css
/* Beige — fond et textes principaux */
--beige-100: #FBF8F3   /* fond principal (--background) */
--beige-200: #F5F0E8   /* sections alternées (--muted) */
--beige-300: #EBE4DA   /* bordures (--border) */
--beige-700: #6F5A48   /* texte muted (--muted-foreground) */
--beige-800: #3E2F24   /* texte body */
--beige-900: #221510   /* texte titres (--foreground) */

/* Violet — brand */
--violet-500: #823F91  /* brand (--primary) */
--violet-600: #6D3478  /* hover */
--violet-700: #5C2B66  /* active */
--violet-100: #E8D4EF  /* bg doux */
--violet-50:  #F5F0F7  /* bg très doux */

/* Variables système shadcn */
--background:       var(--beige-100)   → #FBF8F3
--foreground:       var(--beige-900)   → #221510
--primary:          var(--violet-500)  → #823F91
--muted:            var(--beige-200)
--muted-foreground: var(--beige-700)
--border:           var(--beige-300)
--ring:             var(--violet-500)
--radius:           0.875rem

/* Semantic */
--color-success: #059669  (light: #ECFDF5, text: #065F46)
--color-warning: #D97706  (light: #FFFBEB, text: #92400E)
--color-danger:  #DC2626  (light: #FEF2F2, text: #991B1B)
--color-info:    #2563EB  (light: #EFF6FF, text: #1E40AF)
```

### Tokens TypeScript (lib/design-system.ts)
```typescript
import { colors, typography, spacing, radius, shadows, motionTokens, designTokens } from '@/lib/design-system'

// Couleurs hex directes
colors.primary500        // '#823F91'  brand
colors.primaryHover      // '#5C2B66'  active
colors.textPrimary       // '#111827'
colors.textMuted         // '#6B7280'
colors.border            // '#E5E7EB'

// Tokens Tailwind prêts à l'emploi
designTokens.buttonPrimary    // bg-[#823F91] hover:bg-[#5C2B66] rounded-xl font-semibold
designTokens.buttonOutline    // border violet + hover léger
designTokens.buttonGhost      // texte gray + hover gray
designTokens.card             // bg-white rounded-2xl shadow + hover shadow
designTokens.cardFlat         // bg-white rounded-2xl border
designTokens.input            // rounded-xl shadow focus-ring violet
designTokens.dashboardSection // card + overflow-hidden
designTokens.dashboardSectionHeader // px-5 py-4 bg-gray-50/60

// Motion
motionTokens.fast    // '120ms ease-out'
motionTokens.normal  // '180ms ease-out'
motionTokens.slow    // '300ms ease-out'
motionTokens.easeOut // [0.16, 1, 0.3, 1]
```

### Typographie réelle (globals.css)
```
h1:    font-weight: 800 (extrabold)   letter-spacing: -0.025em   line-height: 1.15
h2:    font-weight: 700 (bold)        letter-spacing: -0.02em    line-height: 1.2
h3:    font-weight: 600 (semibold)    letter-spacing: -0.01em    line-height: 1.3
h4-h6: font-weight: 500 (medium)      letter-spacing: -0.005em
p:     font-weight: 400 (normal)      color: beige-800            line-height: 1.65
button: font-weight: 600 (semibold)   letter-spacing: -0.005em
```

### Classes utilitaires (globals.css)
```css
.card-section        /* glass card avec blur + border + shadow violet */
.shadow-soft         /* ombre subtile 3 couches */
.shadow-elevated     /* ombre 4 couches */
.shadow-float        /* ombre flottante */
.glass               /* backdrop-filter blur(20px) saturate(180%) */
.glass-border        /* border 1px semi-transparent */
.transition-smooth   /* cubic-bezier(0.4, 0, 0.2, 1) 0.3s */
.transition-bounce   /* cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s */
.hover-lift          /* translateY(-2px) au hover */
.pattern-dots        /* fond pointillé radial-gradient */
.tab-pill            /* onglet pill avec état actif violet gradient */
.delta-positive / .delta-negative / .delta-neutral   /* badges KPI */
.sparkline-*         /* micro-graphiques */
.period-pill         /* filtre de période */
.empty-state-card    /* états vides */
```

### Note textures
Le body porte un grain subtil via pseudo-élément `::before` (SVG noise filter, opacity 0.4). Désactivé sur mobile via media query.

### Responsive (breakpoints Tailwind)
```
xs:  475px   sm: 640px   md: 768px (mobile→tablet)
lg:  1024px (sidebar complète)   xl: 1280px   2xl: 1536px   3xl: 1920px
```

---

## Composants UI disponibles

### shadcn/ui (new-york style, `components/ui/`)
**Navigation**: `navigation-menu`, `tabs`, `breadcrumb`, `dropdown-menu`
**Inputs**: `button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `toggle`, `toggle-group`, `calendar`, `date-picker`, `command`
**Feedback**: `toast` (sonner), `alert`, `badge`, `progress`, `loading-spinner`, `empty-state`, `skeleton`
**Overlays**: `dialog` (Framer Motion animé), `popover`, `hover-card`, `tooltip`, `drawer`, `sheet`
**Layout**: `card`, `separator`, `scroll-area`, `accordion`, `collapsible`, `resizable`, `sidebar`
**Data**: `avatar`, `user-avatar`, `table`, `chart` (Recharts), `carousel`

### Composants UI avancés (`components/ui/`)
`animated-beam`, `animated-counter`, `animated-list`, `avatar-circles`, `bento-grid`, `flip-card`, `flip-words`, `hero-video-dialog`, `marquee`, `modern-card`, `navbar-menu`, `pricing-column`, `pulsating-button`, `shine-border`, `shooting-stars`, `sparkles`, `spotlight`, `stars-background`

### Button — variants réels
```typescript
variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
size:    'default' (h-11) | 'xs' (h-8) | 'sm' (h-10) | 'lg' (h-12) | 'icon' (size-11)
// Base: rounded-xl font-semibold active:scale-[0.98]
// default: gradient primary/60→primary/100 + shadow-md + hover:-translate-y-[1px]
// outline: shadow violet subtil + hover:-translate-y-[1px]
// ghost:   hover:bg-[#823F91]/10
```

---

## Patterns de code

### Server Component (défaut)
```typescript
// app/couple/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('demandes').select()
  return <div>...</div>
}
```

### Client Component
```typescript
'use client'
// Uniquement si nécessaire: state local, event handlers, hooks React, browser APIs
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
}
```

### Gestion d'erreur
```typescript
import { getErrorMessage, extractSupabaseError } from '@/lib/utils'

catch (error) {
  const msg = getErrorMessage(error)                  // message simple
  const details = extractSupabaseError(error)         // code, hint, statusCode
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
- Routes API: kebab-case (ex: `/api/vendor-invitations/`)
- Pages: kebab-case en français (ex: `/couple/jour-j/`)

### TypeScript
- Strict mode activé — pas de `any`, utiliser `unknown` si nécessaire
- Préférer `interface` pour les objets, `type` pour les unions/intersections
- `types/database.types.ts` est **auto-généré** depuis Supabase — ne pas modifier à la main

---

## Animations & Scroll

### lib/animations.ts — exports réels
```typescript
import {
  fadeInUp,          // {hidden: {opacity:0,y:20}, visible: {opacity:1,y:0}} + stagger par index
  cardHover,         // {rest: {scale:1,y:0}, hover: {scale:1.02,y:-4}}
  buttonHover,       // scale: 1.05
  iconHover,         // scale: 1.1, rotate: 5
  counterAnimation,  // initial {opacity:0,scale:0.5} → animate {opacity:1,scale:1}
  typingIndicator,   // opacity[0.4,1,0.4] repeat Infinity
  slideInRight,      // x:300→0 (notifications)
  pulseBadge,        // scale[1,1.1,1] repeat Infinity
} from '@/lib/animations'

// Easing custom dans fadeInUp
ease: [0.16, 1, 0.3, 1]  // Inspiré Linear/Stripe
```

### Lenis Smooth Scroll
Init automatique dans `lib/scroll.ts`. Pas de configuration nécessaire.

### CSS keyframes (globals.css)
`rippling`, `dialog-in/out`, `infinite-scroll` (marquee), `slideInUp`, `slideInFromBottom`, `fadeIn`

---

## Flux de données

### Création de demande
```
Couple (matching ou recherche) → INSERT demandes (status: 'new')
→ Notification prestataire → Prestataire accepte/rejette → UPDATE demandes.status
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
`auto-merge.yml` — merge automatique après CI. Requiert label `auto-merge` OU PR dependabot. Merge via squash.

---

## Configuration & Scripts

### Scripts npm
```bash
npm run dev              # Dev server (port 3000)
npm run dev:turbo        # Dev avec Turbopack
npm run build            # Build production
npm run start            # Start production
npm run lint             # ESLint
npm run test             # Jest
npm run test:api         # scripts/test-api.sh
npm run test:compatibility # scripts/test-compatibility.ts
```

### Variables d'environnement (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
N8N_WEBHOOK_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Next.js Config (`next.config.ts`)
- Remote images: `images.unsplash.com`, `*.supabase.co`
- Security headers: CSP strict, HSTS, X-Frame-Options: DENY, X-Content-Type-Options
- `removeConsole` en production (sauf error/warn)
- Sentry via `withSentryConfig` (sourcemaps supprimés après upload)

### Vercel (`vercel.json`)
- Cron: `/api/cron/email-sequences` — `"0 9 * * *"` (09:00 UTC daily)

---

## Commandes utiles

```bash
npx tsc --noEmit   # Type check

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
- `components.json` — config shadcn/ui (style: new-york, aliases, registries)
- `tailwind.config.ts` — sauf ajout couleurs/plugins
- `next.config.ts` — sauf ajout headers/images/env
- `types/database.types.ts` — auto-généré depuis Supabase
- `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`

---

## Guides détaillés (`/skills/`)

Des guides détaillés sont disponibles dans le dossier `/skills/` :

- `skills/ui-components.md` — Design system complet, composants UI, patterns visuels
- `skills/code-patterns.md` — Patterns TypeScript, Supabase, API routes, forms

**Lire les skills avant de créer un nouveau composant ou une nouvelle route.**

---

## Résumé pour l'IA

**NUPLY** = SaaS mariage, deux rôles (couple/prestataire), matching IA, messagerie temps réel, budget, timeline, agenda, paiements Stripe.

Règles fondamentales :
1. **Lire avant de modifier** — toujours lire le fichier existant avant de proposer des changements
2. **Server Components par défaut** — `'use client'` uniquement si nécessaire
3. **shadcn/ui en priorité** — utiliser les composants existants avant d'en créer
4. **Zod pour toute validation** — pas de validation manuelle
5. **RLS est la sécurité** — ne jamais bypasser sans `createAdminClient()` justifié
6. **Pas de `any`** — TypeScript strict, utiliser `unknown` ou types génériques
7. **Animations via `lib/animations.ts`** — réutiliser les variants Framer Motion existants
8. **Fond BEIGE** — `--background` = `#FBF8F3`. Ne jamais supposer un fond blanc.
9. **Skills en priorité** — lire `/skills/*.md` avant de créer un composant ou une route

---

*Dernière mise à jour: 2026-02-27 — Version 3.0.0*
