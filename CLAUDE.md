# 🎯 NUPLY - Documentation Complète (Claude AI)

**Généré le** : 29 Décembre 2025
**Version** : 1.0 (Pré-lancement)
**Auteur** : Claude AI (Anthropic) + Abdelkarim

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Fonctionnalités détaillées](#fonctionnalités-détaillées)
4. [Algorithme de matching IA](#algorithme-de-matching-ia)
5. [Sécurité et production](#sécurité-et-production)
6. [Recommandations futures](#recommandations-futures)
7. [Guide de développement](#guide-de-développement)

---

## 🎯 VUE D'ENSEMBLE

### Qu'est-ce que NUPLY ?

**NUPLY** est une plateforme marketplace SaaS next-gen pour l'organisation de mariages en France. Elle connecte les **couples** avec des **prestataires de mariage vérifiés** via un système de matching intelligent basé sur l'IA.

### Vision produit

Remplacer les processus archaïques (recherche Google, emails, devis manuels) par une expérience moderne, fluide et personnalisée :

- **Pour les couples** : Matching IA, budget intelligent, timeline collaborative, messagerie unifiée
- **Pour les prestataires** : Dashboard professionnel, gestion demandes, calendrier, profil public optimisé

### Proposition de valeur

| Avant NUPLY | Avec NUPLY |
|-------------|------------|
| 50+ emails pour trouver un photographe | 3 clics, matching IA personnalisé |
| Budget Excel désorganisé | Budget intelligent avec catégories prédéfinies |
| Timeline manuscrite | Timeline collaborative avec notifications |
| Messagerie dispersée (WhatsApp, email, SMS) | Messagerie centralisée dans l'app |
| Profils prestataires non vérifiés | Vérification KYC + avis certifiés |

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack technologique (2025)

```typescript
// Frontend
- Next.js 16.0.3 (App Router, React Server Components)
- React 19.2.0 (dernière version stable)
- TypeScript 5.x (strict mode)
- Tailwind CSS 3.x + shadcn/ui
- Framer Motion (animations)
- Geist Sans / Inter (polices SaaS modernes)

// Backend & Database
- Supabase (PostgreSQL 15.x)
  ↳ Auth (Magic Links, OAuth Google)
  ↳ Database (Row Level Security)
  ↳ Storage (Documents, Photos, Devis)
  ↳ Realtime (Messagerie live)
  ↳ Edge Functions (Rate limiting, webhooks)

// IA & Matching
- OpenAI GPT-4 Turbo (chat Nora)
- Algorithme de scoring à 6 critères (voir section dédiée)
- Embeddings pour affinité culturelle (à implémenter)

// Infrastructure
- Vercel (Hosting + Edge Runtime)
- GitHub Actions (CI/CD)
- Sentry (Error tracking)
- PostHog (Analytics)
```

### Structure du projet

```
/app                          # Next.js App Router
├── (auth)/                   # Routes authentification (Sign in/up)
├── (landing)/                # Routes publiques (Landing, Tarifs)
├── api/                      # API Routes (Supabase RPC, webhooks)
├── couple/                   # Dashboard couple
│   ├── recherche/            # Recherche prestataires + Matching IA
│   ├── demandes/             # Demandes de devis envoyées
│   ├── budget/               # Gestion budget mariage
│   ├── timeline/             # Timeline événements
│   ├── collaborateurs/       # Invitations témoins/organisateurs
│   └── profil/               # Profil couple
├── prestataire/              # Dashboard prestataire
│   ├── dashboard/            # Vue d'ensemble (stats, notifs)
│   ├── demandes-recues/      # Demandes de couples reçues
│   ├── agenda/               # Calendrier disponibilités
│   ├── messagerie/           # Messagerie avec couples
│   └── profil-public/        # Profil public visible par couples
└── layout.tsx                # Layout racine (SEO, metadata)

/components
├── landing/                  # Composants landing page (Hero, Features, CTA)
├── ui/                       # shadcn/ui primitives (Button, Calendar, Input...)
├── dashboard/                # Composants dashboard réutilisables
├── seo/                      # SEO (StructuredData, OG Image)
└── DashboardSidebar.tsx      # Sidebar principale (couple + prestataire)

/lib
├── supabase/                 # Client Supabase + queries
│   ├── client.ts             # Client browser
│   ├── server.ts             # Client server (cookies)
│   └── queries/              # Requêtes réutilisables
├── logger.ts                 # Logger production-safe (dev vs prod)
├── rate-limit.ts             # Rate limiting (50 req/min)
├── utils.ts                  # Helpers (cn, formatters...)
└── validations.ts            # Zod schemas

/docs
├── setup/                    # Guides setup (Supabase, Auth, RLS...)
└── reports/                  # Rapports audits (obsolète après cleanup)

/public
├── images/                   # Logo, illustrations, OG images
└── robots.txt                # SEO crawlers config
```

---

## 🎨 FONCTIONNALITÉS DÉTAILLÉES

### 1. Landing Page (Public)

**URL** : `https://nuply.com`

**Sections** :
- **Hero** : Titre accrocheur + CTA "Commencer gratuitement"
- **Features** : 4 blocs (Matching IA, Budget, Timeline, Prestataires vérifiés)
- **How It Works** : 3 étapes (Créer profil → Matching → Organiser)
- **Testimonials** : Avis couples (fictifs pour MVP)
- **CTA Final** : Inscription gratuite

**SEO** :
- OpenGraph + Twitter Card (1200x630px image dynamique)
- JSON-LD Structured Data (Organization, WebSite)
- Sitemap.xml automatique
- Robots.txt (allow public, disallow /couple/ /prestataire/)

**Performance** :
- Score Lighthouse > 95 (Performance, Accessibility, Best Practices, SEO)
- Images optimisées (WebP, lazy loading)
- Framer Motion animations optimisées

### 2. Page Tarifs (Public)

**URL** : `https://nuply.com/tarifs`

**Plans** :
| Plan | Prix | Cible | Features |
|------|------|-------|----------|
| **Gratuit** | 0€ | Couples | Matching IA, Budget, Timeline, 3 demandes/mois |
| **Premium** | 29€/mois | Couples | Demandes illimitées, Support prioritaire, Export PDF |
| **Pro** | 79€/mois | Prestataires | Profil vérifié, Demandes illimitées, Analytics avancés |
| **Business** | 199€/mois | Agences | Multi-utilisateurs, API access, White label |

**Composants** :
- `<PricingCard>` : Cartes tarifs avec animations hover
- `<PricingToggle>` : Mensuel / Annuel (-20%)
- `<PricingFAQ>` : FAQ tarification

### 3. Dashboard Couple

**Accès** : Après inscription + onboarding

#### 3.1 Page Recherche (`/couple/recherche`)

**Fonctionnalité clé** : Matching IA + Chat Nora (assistant virtuel)

**Workflow** :
1. Couple remplit critères (budget, date, lieu, style)
2. IA Nora pose questions pour affiner (max 5 questions)
3. Algorithme calcule scores de matching (6 critères pondérés)
4. Affichage liste prestataires triée par score (95% → 60%)
5. Couple envoie demandes de devis (max 3/mois en gratuit)

**Critères de recherche** :
- Catégorie prestataire (Photographe, DJ, Traiteur, Lieu...)
- Budget min/max
- Date mariage
- Lieu (ville, département, région)
- Style (Bohème, Classique, Moderne, Vintage...)

**UI** :
- `<ChatInterface>` : Chat avec Nora (OpenAI GPT-4)
- `<ProviderCard>` : Carte prestataire (photo, nom, score, prix, avis)
- `<MatchingScore>` : Badge score (couleur selon %)
- `<FiltersSidebar>` : Filtres recherche

#### 3.2 Page Demandes (`/couple/demandes`)

Liste des demandes de devis envoyées aux prestataires.

**États** :
- `pending` : En attente réponse prestataire
- `accepted` : Prestataire a répondu (devis envoyé)
- `rejected` : Prestataire a refusé
- `expired` : Pas de réponse sous 7 jours

**Actions** :
- Voir devis (PDF téléchargeable)
- Relancer prestataire
- Annuler demande
- Envoyer message

**Notifications** :
- Email + notification in-app quand devis reçu
- Rappel J-5 si pas de réponse

#### 3.3 Page Budget (`/couple/budget`)

Gestion budget mariage avec catégories prédéfinies.

**Catégories** (20 catégories françaises) :
- Lieu réception
- Traiteur / Restauration
- Photographe
- Vidéaste
- DJ / Musiciens
- Décoration florale
- Robe mariée
- Costume marié
- Alliances
- Faire-part
- Cadeaux invités
- ...

**Features** :
- Budget total estimé
- Répartition par catégorie (%)
- Dépensé vs Restant (graphique)
- Ajout dépenses manuelles
- Export PDF budget complet

**UI** :
- `<BudgetSummary>` : Total + Graphique circulaire
- `<BudgetCategoryCard>` : Ligne catégorie (prévu, dépensé, reste)
- `<AddExpenseModal>` : Modal ajout dépense

#### 3.4 Page Timeline (`/couple/timeline`)

Timeline collaborative des tâches mariage (J-365 → J-0).

**Phases** :
- **J-365 à J-180** : Réservations majeures (lieu, traiteur, photographe)
- **J-180 à J-90** : Détails (DJ, déco, robe, costume)
- **J-90 à J-30** : Finalisations (faire-part, menu, plan de table)
- **J-30 à J-0** : Derniers préparatifs (essayages, répétition)

**Features** :
- Tâches prédéfinies (50+ tâches suggérées)
- Ajout tâches custom
- Assignation collaborateurs (témoins, wedding planner)
- Notifications deadline (J-7, J-3, J-1)
- Vue Kanban / Liste / Calendrier

**UI** :
- `<TimelinePhase>` : Section par phase
- `<TaskCard>` : Carte tâche (titre, deadline, assigné, statut)
- `<TaskCreateModal>` : Modal création tâche

#### 3.5 Page Collaborateurs (`/couple/collaborateurs`)

Inviter témoins, wedding planners, famille à accéder au dashboard couple (lecture seule ou édition).

**Rôles** :
- **Admin** (couple) : Accès total
- **Éditeur** (témoins, planner) : Modifier budget, timeline, envoyer demandes
- **Lecteur** (famille) : Voir uniquement

**Workflow invitation** :
1. Couple envoie email invitation (lien unique tokenisé)
2. Invité clique lien → Création compte NUPLY
3. Accès automatique au dashboard couple (selon rôle)

**UI** :
- `<CollaboratorsList>` : Liste collaborateurs actifs
- `<InviteModal>` : Modal invitation (email + rôle)
- `<PendingInvites>` : Invitations en attente

#### 3.6 Page Profil (`/couple/profil`)

Profil du couple (visible uniquement par prestataires contactés).

**Champs** :
- Noms couple
- Date mariage
- Lieu mariage
- Nombre invités
- Budget total
- Description style souhaité (texte libre)
- Photos couple (optionnel)

### 4. Dashboard Prestataire

**Accès** : Après inscription + onboarding + vérification KYC

#### 4.1 Page Dashboard (`/prestataire/dashboard`)

Vue d'ensemble activité prestataire.

**Widgets** :
- **Stats clés** :
  - Demandes reçues (mois en cours)
  - Taux de réponse (%)
  - Chiffre d'affaires estimé (devis acceptés)
  - Note moyenne avis
- **Demandes récentes** (5 dernières)
- **Messages non lus** (5 derniers)
- **Disponibilités semaine en cours** (calendrier mini)

**UI** :
- `<StatCard>` : Carte stat (icône + chiffre + évolution)
- `<RecentRequests>` : Liste demandes récentes
- `<UnreadMessages>` : Liste messages non lus

#### 4.2 Page Demandes Reçues (`/prestataire/demandes-recues`)

Liste demandes de devis reçues de couples.

**États** :
- `new` : Nouvelle demande (badge rouge)
- `viewed` : Vue par prestataire
- `quoted` : Devis envoyé
- `accepted` : Couple a accepté le devis
- `rejected` : Couple a refusé le devis

**Actions** :
- Voir détails couple (profil, budget, date, style)
- Envoyer devis (upload PDF ou saisie montant)
- Refuser demande (optionnel : raison)
- Envoyer message

**UI** :
- `<RequestCard>` : Carte demande (couple, date, budget, statut)
- `<RequestDetailsModal>` : Modal détails demande
- `<QuoteUploadModal>` : Modal upload devis PDF

#### 4.3 Page Agenda (`/prestataire/agenda`)

Calendrier disponibilités prestataire (dates réservées vs libres).

**Features** :
- Vue mois (calendrier react-day-picker)
- Marquer dates indisponibles (click & drag)
- Bloquer périodes (vacances, congés)
- Sync avec demandes acceptées (auto-block date mariage)
- Export iCal (sync Google Calendar, Outlook)

**UI** :
- `<AvailabilityCalendar>` : Calendrier principal
- `<EventDetailsModal>` : Modal détails événement (mariage réservé)
- `<BlockPeriodModal>` : Modal bloquer période

#### 4.4 Page Messagerie (`/prestataire/messagerie`)

Messagerie centralisée avec tous les couples (Realtime Supabase).

**Features** :
- Liste conversations (couples)
- Notifications temps réel (nouveau message)
- Upload fichiers (devis, photos, contrats)
- Recherche messages
- Archiver conversations

**UI** :
- `<ConversationsList>` : Liste conversations (sidebar)
- `<ChatWindow>` : Fenêtre chat (messages + input)
- `<MessageBubble>` : Bulle message (émetteur vs receveur)
- `<FileUpload>` : Zone upload fichiers

#### 4.5 Page Profil Public (`/prestataire/profil-public`)

Profil public prestataire (visible par couples en recherche).

**Sections** :
- **Header** :
  - Photo profil
  - Nom entreprise
  - Catégorie (Photographe, DJ, Traiteur...)
  - Note moyenne ⭐⭐⭐⭐⭐ (5/5)
  - Prix indicatif (€€€)
  - Badge "Vérifié NUPLY"
- **À propos** :
  - Description entreprise (texte libre, max 500 caractères)
  - Années expérience
  - Nombre mariages réalisés
  - Zones géographiques
- **Portfolio** :
  - Galerie photos (max 20 photos)
  - Vidéos (liens YouTube/Vimeo)
- **Avis clients** :
  - Liste avis couples (note + commentaire + date)
  - Réponses prestataire (optionnel)
- **Tarifs & Packages** :
  - 3 formules (Basic, Standard, Premium)
  - Prix, durée, inclus/exclus
- **Disponibilités** :
  - Calendrier mini (3 mois suivants)
  - "Réserver une date" (CTA)

**SEO Profil** :
- URL canonique : `/prestataire/[slug]` (ex: `/prestataire/photo-mariage-paris-jean-dupont`)
- Metadata dynamique (titre, description, OG image personnalisée)
- JSON-LD LocalBusiness

---

## 🤖 ALGORITHME DE MATCHING IA

### Vue d'ensemble

L'algorithme de matching NUPLY est un système **hybride IA + scoring algorithmique** qui combine :

1. **Chat conversationnel IA** (Nora) : Extrait les préférences du couple via questions naturelles
2. **Scoring à 6 critères pondérés** : Calcule un score de compatibilité (0-100%) entre couple et prestataire
3. **Embeddings sémantiques** (à venir) : Analyse l'affinité culturelle via NLP

### Architecture du système

```typescript
// Tables Supabase
couples_profiles          // Profils couples (budget, date, lieu, style...)
providers                 // Profils prestataires (catégorie, prix, disponibilités...)
match_scores              // Scores précalculés (couple_id, provider_id, score, critères)
chat_conversations        // Conversations Nora <> Couple
chat_messages             // Messages chat (user, assistant, system)
couple_budgets            // Budget détaillé par catégorie
provider_availability     // Disponibilités calendrier prestataire

// Workflow
1. Couple ouvre /couple/recherche
2. Chat Nora pose 3-5 questions pour affiner critères
3. OpenAI GPT-4 extrait critères structurés (JSON)
4. API /api/matching/calculate calcule scores pour tous prestataires catégorie
5. Résultats triés par score (95% → 60%)
6. Couple voit liste + peut filtrer/affiner
```

### Les 6 critères de matching (pondérés)

| Critère | Poids | Description | Calcul |
|---------|-------|-------------|--------|
| **1. Affinité culturelle** | 35% | Style, valeurs, personnalité | Embeddings sémantiques (description couple vs prestataire) → Cosine similarity |
| **2. Budget** | 25% | Adéquation budget couple / prix prestataire | `score = 100% si prix dans budget ± 10%, sinon -5%/100€ écart` |
| **3. Disponibilité** | 15% | Date mariage libre dans calendrier prestataire | `100% si libre, 0% si réservé, 50% si période floue` |
| **4. Localisation** | 10% | Distance géographique couple ↔ prestataire | `100% si même département, -10%/50km ensuite` |
| **5. Style** | 10% | Tags style mariage (Bohème, Classique...) | `score = (tags communs / tags total) × 100` |
| **6. Réputation** | 5% | Note moyenne + nombre avis | `score = (note/5) × 100 × log(nb_avis + 1)` |

**Score final** = Σ (critère_score × poids)

### Exemple de calcul

**Couple** :
- Budget photographe : 2000€
- Date mariage : 15 Juin 2026
- Lieu : Paris (75)
- Style : Bohème, Naturel, Intimiste
- Description : "On cherche un photographe discret qui capte les émotions vraies, pas de poses rigides. On aime le style documentaire et les couleurs douces."

**Prestataire** :
- Prix moyen : 1800€
- Dispo 15 Juin 2026 : ✅ Libre
- Localisation : Paris 11ème (75)
- Tags : Bohème, Documentaire, Émotionnel
- Description : "Photographe mariage spécialisé dans le reportage émotionnel. J'adore capturer les moments spontanés et les rires sincères."
- Avis : 4.9/5 (47 avis)

**Calcul** :

1. **Affinité culturelle** (35%) :
   - Embeddings OpenAI (text-embedding-3-small)
   - Couple : [0.23, -0.45, 0.78, ...] (1536 dimensions)
   - Presta : [0.21, -0.42, 0.81, ...]
   - Cosine similarity = 0.92
   - Score = 92% × 35% = **32.2%**

2. **Budget** (25%) :
   - Prix presta : 1800€, Budget couple : 2000€
   - Écart : 200€ (dans ±10% = 200€)
   - Score = 100% × 25% = **25%**

3. **Disponibilité** (15%) :
   - 15 Juin 2026 libre ✅
   - Score = 100% × 15% = **15%**

4. **Localisation** (10%) :
   - Même département (75)
   - Score = 100% × 10% = **10%**

5. **Style** (10%) :
   - Tags communs : Bohème (2/3)
   - Score = 66% × 10% = **6.6%**

6. **Réputation** (5%) :
   - Note : 4.9/5 = 98%
   - Avis : 47 → log(48) = 1.68
   - Score = 98% × 1.68 × 5% = **8.2%**

**Score final** = 32.2 + 25 + 15 + 10 + 6.6 + 8.2 = **97%** 🎯

→ Prestataire affiché en 1ère position

### Implémentation technique (code)

```typescript
// /app/api/matching/calculate/route.ts

import { openai } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { coupleId, category } = await req.json()

  // 1. Récupérer profil couple
  const supabase = createClient()
  const { data: couple } = await supabase
    .from('couples_profiles')
    .select('*, couple_budgets(*)')
    .eq('id', coupleId)
    .single()

  // 2. Récupérer tous prestataires catégorie
  const { data: providers } = await supabase
    .from('providers')
    .select('*')
    .eq('category', category)
    .eq('verified', true)

  // 3. Générer embeddings couple (1 fois)
  const coupleEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: couple.description,
  })

  // 4. Calculer scores pour chaque prestataire
  const scores = await Promise.all(providers.map(async (provider) => {
    // 4.1 Affinité culturelle (35%)
    const providerEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: provider.description,
    })
    const culturalScore = cosineSimilarity(
      coupleEmbedding.data[0].embedding,
      providerEmbedding.data[0].embedding
    ) * 35

    // 4.2 Budget (25%)
    const budget = couple.couple_budgets.find(b => b.category === category)?.amount || 0
    const budgetScore = calculateBudgetScore(budget, provider.avg_price) * 25

    // 4.3 Disponibilité (15%)
    const availabilityScore = await checkAvailability(
      provider.id,
      couple.wedding_date
    ) * 15

    // 4.4 Localisation (10%)
    const locationScore = calculateLocationScore(
      couple.wedding_location,
      provider.location
    ) * 10

    // 4.5 Style (10%)
    const styleScore = calculateStyleScore(
      couple.style_tags,
      provider.style_tags
    ) * 10

    // 4.6 Réputation (5%)
    const reputationScore = calculateReputationScore(
      provider.rating,
      provider.reviews_count
    ) * 5

    const totalScore = culturalScore + budgetScore + availabilityScore +
                      locationScore + styleScore + reputationScore

    return {
      provider_id: provider.id,
      score: Math.round(totalScore),
      breakdown: {
        cultural: culturalScore,
        budget: budgetScore,
        availability: availabilityScore,
        location: locationScore,
        style: styleScore,
        reputation: reputationScore,
      }
    }
  }))

  // 5. Sauvegarder scores en DB
  await supabase.from('match_scores').upsert(
    scores.map(s => ({ couple_id: coupleId, ...s }))
  )

  // 6. Retourner prestataires triés
  return Response.json({
    providers: scores.sort((a, b) => b.score - a.score)
  })
}

// Helpers
function cosineSimilarity(a: number[], b: number[]) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0))
  return dotProduct / (magA * magB)
}

function calculateBudgetScore(budget: number, price: number) {
  const diff = Math.abs(budget - price)
  const tolerance = budget * 0.1 // ±10%
  if (diff <= tolerance) return 1 // 100%
  return Math.max(0, 1 - (diff - tolerance) / 500) // -5%/100€ écart
}

async function checkAvailability(providerId: string, date: Date) {
  const supabase = createClient()
  const { data } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('date', date)
    .single()

  return data?.is_available ? 1 : 0
}

function calculateLocationScore(coupleLocation: string, providerLocation: string) {
  // Simplification : même département = 100%, sinon distance en km
  const coupleDept = coupleLocation.split('-')[0]
  const providerDept = providerLocation.split('-')[0]
  if (coupleDept === providerDept) return 1

  // TODO: Calculer distance réelle avec API géocodage
  return 0.5 // Par défaut 50% si départements différents
}

function calculateStyleScore(coupleTags: string[], providerTags: string[]) {
  const common = coupleTags.filter(tag => providerTags.includes(tag))
  return common.length / Math.max(coupleTags.length, providerTags.length)
}

function calculateReputationScore(rating: number, reviewsCount: number) {
  const ratingScore = rating / 5 // Normaliser sur 1
  const reviewsBonus = Math.log(reviewsCount + 1) / Math.log(100) // Log scale
  return ratingScore * reviewsBonus
}
```

### Chat Nora (Assistant IA)

Nora est l'assistante virtuelle qui guide le couple dans sa recherche.

**Prompts système** :

```typescript
const NORA_SYSTEM_PROMPT = `
Tu es Nora, l'assistante virtuelle de NUPLY, plateforme de matching pour mariages.

Ton rôle :
- Aider les couples à trouver le prestataire parfait en posant des questions pertinentes
- Extraire leurs critères de recherche (budget, style, valeurs, contraintes)
- Être chaleureuse, empathique, professionnelle
- Poser max 5 questions (ne pas surcharger)
- À la fin, retourner un JSON structuré avec tous les critères

Format de sortie (après questions) :
{
  "category": "Photographe",
  "budget_min": 1500,
  "budget_max": 2500,
  "wedding_date": "2026-06-15",
  "location": "Paris (75)",
  "style_tags": ["Bohème", "Documentaire", "Naturel"],
  "description": "Couple cherchant un photographe discret...",
  "must_have": ["Expérience mariages religieux", "Disponible toute la journée"],
  "nice_to_have": ["Drone", "Album photo inclus"]
}

Exemples de questions :
1. "Quel est votre budget pour [catégorie] ?"
2. "Quelle est la date de votre mariage ?"
3. "Quel style vous correspond le plus ? (Bohème, Classique, Moderne...)"
4. "Y a-t-il des critères indispensables pour vous ?"
5. "Avez-vous des contraintes particulières (lieu éloigné, mariage religieux...) ?"
`

// /app/api/chat/nora/route.ts
export async function POST(req: Request) {
  const { messages, coupleId } = await req.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: NORA_SYSTEM_PROMPT },
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 500,
  })

  const response = completion.choices[0].message.content

  // Sauvegarder conversation
  await supabase.from('chat_messages').insert({
    conversation_id: req.conversationId,
    role: 'assistant',
    content: response,
  })

  return Response.json({ message: response })
}
```

---

## 🔒 SÉCURITÉ ET PRODUCTION

### 1. Row Level Security (RLS)

Toutes les tables Supabase ont des politiques RLS strictes.

**Exemples** :

```sql
-- couples_profiles : Seul le couple propriétaire peut voir/modifier
CREATE POLICY "Couples can view own profile"
ON couples_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Couples can update own profile"
ON couples_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- providers : Tous peuvent voir les profils vérifiés, seul le presta peut modifier
CREATE POLICY "Anyone can view verified providers"
ON providers FOR SELECT
USING (verified = true);

CREATE POLICY "Providers can update own profile"
ON providers FOR UPDATE
USING (auth.uid() = user_id);

-- match_scores : Seul le couple peut voir ses scores
CREATE POLICY "Couples can view own match scores"
ON match_scores FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM couples_profiles
    WHERE id = match_scores.couple_id
    AND user_id = auth.uid()
  )
);

-- chat_messages : Seuls les participants peuvent voir les messages
CREATE POLICY "Participants can view messages"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_conversations
    WHERE id = chat_messages.conversation_id
    AND (couple_id = auth.uid() OR provider_id = auth.uid())
  )
);
```

### 2. Rate Limiting

Protection contre abus et scrapers.

```typescript
// /lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Limites par route
export const ratelimit = {
  // Global : 50 requêtes/minute
  global: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 m'),
  }),

  // API Matching : 10 requêtes/minute (coûteux en OpenAI)
  matching: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
  }),

  // API Auth : 5 requêtes/minute
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
  }),
}

// Middleware Next.js
export async function withRateLimit(
  req: Request,
  limiter: Ratelimit
) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success, limit, remaining, reset } = await limiter.limit(ip)

  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    })
  }

  return null // OK
}
```

### 3. Logger Production-Safe

Remplace tous les `console.log` par `logger.ts`.

```typescript
// /lib/logger.ts
const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  info: (message: string, meta?: any) => {
    if (isDev) {
      console.log(`ℹ️ ${message}`, meta || '')
    } else {
      // Production : Envoyer à Sentry/Datadog
      console.log(JSON.stringify({ level: 'info', message, meta, timestamp: new Date().toISOString() }))
    }
  },

  error: (message: string, error?: any, meta?: any) => {
    if (isDev) {
      console.error(`❌ ${message}`, error, meta || '')
    } else {
      // Production : Envoyer à Sentry
      console.error(JSON.stringify({
        level: 'error',
        message,
        error: error?.message || error,
        stack: error?.stack,
        meta,
        timestamp: new Date().toISOString()
      }))
    }
  },

  warn: (message: string, meta?: any) => {
    if (isDev) {
      console.warn(`⚠️ ${message}`, meta || '')
    } else {
      console.warn(JSON.stringify({ level: 'warn', message, meta, timestamp: new Date().toISOString() }))
    }
  },
}

// Utilisation
import { logger } from '@/lib/logger'

logger.info('User signed in', { userId: user.id })
logger.error('Failed to create marriage admin', error, { userId: user.id })
```

### 4. CORS & Headers Security

```typescript
// /middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request: Request) {
  const response = NextResponse.next()

  // CORS (whitelist domaines autorisés)
  const allowedOrigins = [
    'https://nuply.com',
    'https://www.nuply.com',
    process.env.NODE_ENV === 'development' && 'http://localhost:3000',
  ].filter(Boolean)

  const origin = request.headers.get('origin')
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  )

  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

### 5. Variables d'environnement

```bash
# .env.local (NE JAMAIS COMMIT)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # SECRET (server-side only)

# OpenAI
OPENAI_API_KEY=sk-xxx... # SECRET

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx # SECRET

# Stripe (Paiements)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx # SECRET
STRIPE_WEBHOOK_SECRET=whsec_xxx # SECRET

# Sentry (Error Tracking)
SENTRY_DSN=https://xxx@sentry.io/xxx

# Production URL
NEXT_PUBLIC_APP_URL=https://nuply.com
```

**Règles** :
- ✅ `NEXT_PUBLIC_*` : Exposé au client (URL, clés publiques)
- ❌ Sans `NEXT_PUBLIC_` : Server-side only (secrets API, tokens)
- ❌ **JAMAIS** commit `.env.local` dans Git

---

## 🚀 RECOMMANDATIONS FUTURES

### 1. Features à ajouter (Q1 2026)

#### 1.1 Système de paiement (Stripe)

**Objectif** : Monétiser la plateforme (abonnements couples + prestataires).

**Plan** :
- Intégrer Stripe Checkout pour abonnements (Gratuit → Premium)
- Webhooks Stripe pour gérer états abonnement (actif, expiré, annulé)
- Portail client Stripe (gérer abonnement, factures)

**Tables DB** :
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT, -- 'free', 'premium', 'pro', 'business'
  status TEXT, -- 'active', 'canceled', 'past_due'
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.2 Avis certifiés (Post-mariage)

**Objectif** : Crédibiliser prestataires avec avis vérifiés.

**Workflow** :
1. J+7 après mariage : Email automatique au couple "Notez vos prestataires"
2. Couple accède formulaire notation (note 1-5 + commentaire texte)
3. Avis publié sur profil prestataire après validation modération
4. Prestataire peut répondre à l'avis

**Tables DB** :
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  couple_id UUID REFERENCES couples_profiles,
  provider_id UUID REFERENCES providers,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  verified BOOLEAN DEFAULT false,
  wedding_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE review_responses (
  id UUID PRIMARY KEY,
  review_id UUID REFERENCES reviews,
  provider_id UUID REFERENCES providers,
  response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.3 Vérification KYC prestataires (Stripe Identity)

**Objectif** : Garantir authenticité prestataires (éviter faux profils).

**Process** :
1. Prestataire s'inscrit → Statut `unverified`
2. Admin NUPLY demande documents (SIRET, Kbis, assurance RC Pro)
3. Vérification manuelle ou automatique (Stripe Identity)
4. Statut → `verified` (badge vert sur profil)

#### 1.4 Export PDF complet mariage

**Objectif** : Couples exportent tout (budget, timeline, contacts prestataires) en 1 PDF.

**Contenu PDF** :
- Page 1 : Résumé mariage (date, lieu, invités, budget total)
- Page 2-3 : Budget détaillé par catégorie
- Page 4-5 : Timeline avec deadlines
- Page 6+ : Liste prestataires retenus (contact, prix, documents)

**Tech** : `react-pdf` ou `puppeteer` (HTML → PDF)

#### 1.5 Intégration calendrier (Google Calendar, Outlook)

**Objectif** : Sync timeline NUPLY ↔ Google Calendar.

**Features** :
- Export iCal (.ics) de la timeline
- Import événements Google Calendar → NUPLY
- Sync bidirectionnel (OAuth Google)

### 2. Optimisations techniques

#### 2.1 Cache Redis pour matching

**Problème** : Calcul matching coûteux (OpenAI embeddings + DB queries).

**Solution** : Cache scores 24h dans Redis.

```typescript
// Avant calcul
const cacheKey = `match:${coupleId}:${category}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

// Après calcul
await redis.set(cacheKey, JSON.stringify(scores), { ex: 86400 }) // 24h
```

#### 2.2 CDN pour images (Cloudflare R2)

**Problème** : Photos prestataires (portfolios) lourdes → lent.

**Solution** : Migrer Supabase Storage → Cloudflare R2 + CDN.

**Gains** :
- Temps chargement divisé par 3
- Coûts stockage divisés par 5
- Images optimisées auto (WebP, redimensionnement)

#### 2.3 Lazy loading composants

**Problème** : Bundle JS trop lourd (Framer Motion + shadcn).

**Solution** : Lazy load composants non critiques.

```typescript
// Avant
import { Calendar } from '@/components/ui/calendar'

// Après
const Calendar = dynamic(() => import('@/components/ui/calendar'), {
  loading: () => <Skeleton className="h-80 w-full" />,
})
```

#### 2.4 Monitoring Sentry + PostHog

**Sentry** : Error tracking (catch bugs production).
**PostHog** : Product analytics (funnels, retention, feature flags).

```typescript
// /lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% transactions
  environment: process.env.NODE_ENV,
})

// /lib/posthog.ts
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://app.posthog.com',
  })
}

export { posthog }
```

### 3. SEO & Growth

#### 3.1 Blog prestataires (SEO)

**Objectif** : Traffic organique Google via articles longs.

**Thèmes** :
- "Comment choisir son photographe de mariage ?"
- "Budget mariage 2026 : répartition idéale"
- "Timeline mariage : checklist complète J-365 à J-0"
- "Top 10 prestataires mariage Paris 2026"

**Tech** : MDX (Markdown + React) + App Router Next.js

#### 3.2 Référencement local (Google My Business)

Créer fiches Google Business pour :
- NUPLY siège social
- Pages prestataires (avec adresse → SEO local)

#### 3.3 Partenariats influenceurs mariage

Contacter wedding planners, influenceurs mariage Instagram/TikTok :
- Code promo partenaire (20% réduction 3 mois)
- Commission affiliation (20€/inscription prestataire)

### 4. Product-Market Fit

#### 4.1 Onboarding optimisé

**Problème** : Taux abandon élevé si onboarding trop long.

**Solution** : Onboarding progressif (3 étapes max).

**Couples** :
1. Créer compte (email + mot de passe)
2. Renseigner date + lieu mariage
3. → Dashboard (compléter profil plus tard)

**Prestataires** :
1. Créer compte (email + mot de passe)
2. Renseigner catégorie + ville
3. Upload 3 photos portfolio
4. → Dashboard (compléter profil plus tard)

#### 4.2 A/B Testing (PostHog)

Tester variations pour optimiser conversions :
- CTA landing page : "Commencer gratuitement" vs "Trouver mon prestataire"
- Pricing page : Afficher prix mensuel vs annuel par défaut
- Dashboard : Sidebar gauche vs top bar

---

## 📚 GUIDE DE DÉVELOPPEMENT

### 1. Setup local

```bash
# Clone repo
git clone https://github.com/Eijun28/saas-app.git
cd saas-app

# Install dependencies
npm install

# Setup env
cp .env.example .env.local
# Remplir les clés Supabase, OpenAI, Upstash...

# Run dev server
npm run dev
# → http://localhost:3000

# Run build (vérifier prod)
npm run build
npm run start
```

### 2. Conventions code

**TypeScript** :
- `strict: true` (pas de `any`)
- Interfaces pour props composants
- Types Supabase auto-générés (`npx supabase gen types typescript`)

**Composants** :
- Nomenclature : `PascalCase` (ex: `DashboardSidebar.tsx`)
- Props destructurées : `({ title, onClose }: Props)`
- Utiliser `"use client"` uniquement si nécessaire (interactions, hooks)

**Styling** :
- Tailwind CSS uniquement (pas de CSS modules)
- Utiliser `cn()` pour merger classes conditionnelles
- shadcn/ui variants pour composants réutilisables

**API Routes** :
- Format : `/app/api/[resource]/[action]/route.ts`
- Toujours valider body avec Zod
- Toujours catcher erreurs (try/catch)
- Utiliser `logger.error()` (pas `console.error`)

**Commits Git** :
- Format : `type(scope): message`
- Types : `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- Exemple : `feat(matching): add cultural affinity scoring`

### 3. Testing

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Coverage
npm run test:coverage
```

**Tests prioritaires** :
- [ ] Auth flow (sign up, sign in, sign out)
- [ ] Matching algorithm (scoring précision)
- [ ] RLS policies (sécurité DB)
- [ ] Rate limiting (pas de bypass)
- [ ] Forms (validation, erreurs)

### 4. Déploiement (Vercel)

```bash
# Déployer preview (branche feature)
git push origin feature/my-feature
# → Vercel crée preview URL auto

# Déployer production (merge main)
git checkout main
git merge feature/my-feature
git push origin main
# → Vercel déploie sur nuply.com
```

**Variables d'environnement Vercel** :
- Ajouter toutes les vars `.env.local` dans Vercel dashboard
- Séparer `Production` vs `Preview` (clés API différentes)

### 5. Commandes utiles

```bash
# Générer types Supabase
npx supabase gen types typescript --project-id <project-id> > types/supabase.ts

# Analyser bundle size
npm run build && npx @next/bundle-analyzer

# Formater code
npm run lint
npm run format

# Migrations Supabase
npx supabase db push

# Reset DB local
npx supabase db reset
```

---

## 🎓 RESSOURCES

### Documentation officielle
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Repos inspirants
- [Taxonomy (shadcn)](https://github.com/shadcn/taxonomy) - SaaS boilerplate
- [Cal.com](https://github.com/calcom/cal.com) - Scheduling platform
- [Dub.co](https://github.com/dubinc/dub) - Link shortener SaaS

### Communauté
- Discord Next.js : https://discord.gg/nextjs
- Discord Supabase : https://discord.supabase.com
- Twitter : Suivre @vercel, @supabase, @shadcn

---

## ✅ CHECKLIST PRÉ-LANCEMENT

### Code
- [x] Remplacer tous `console.log` par `logger.*`
- [x] Supprimer code mort (dashboard/sidebar.tsx, header.tsx)
- [x] Standardiser calendriers (1 seul Calendar component)
- [x] SEO complet (metadata, OG image, sitemap, robots.txt)
- [ ] Tests E2E auth flow
- [ ] Tests unitaires matching algorithm
- [ ] Vérifier RLS policies (aucune fuite de données)

### Design
- [x] Police SaaS moderne (Geist Sans / Inter)
- [x] Dashboard prestataire design premium
- [x] Responsive mobile (toutes pages)
- [x] Animations Framer Motion optimisées
- [ ] Accessibilité (WCAG 2.1 AA)

### Infrastructure
- [ ] Variables d'environnement production (Vercel)
- [ ] Rate limiting activé (Upstash)
- [ ] Monitoring Sentry configuré
- [ ] Analytics PostHog configuré
- [ ] Backups DB Supabase automatiques (quotidien)

### Juridique
- [ ] CGU/CGV rédigées
- [ ] Politique confidentialité (RGPD)
- [ ] Mentions légales
- [ ] Cookies consent banner (RGPD)

### Marketing
- [ ] Landing page finalisée
- [ ] Page tarifs finalisée
- [ ] 10 prestataires seedés (profils démo)
- [ ] Email onboarding (3 emails post-inscription)
- [ ] Social media prêts (Twitter, Instagram, LinkedIn)

---

**Dernière mise à jour** : 29 Décembre 2025
**Contact** : [Ton email ou lien support]

**Bon courage pour la suite ! 🚀**
