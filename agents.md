# 💍 NUPLY - FIL CONDUCTEUR

**Le guide complet de la plateforme marketplace de mariage nouvelle génération**

Version : 2.0
Dernière mise à jour : 29 Décembre 2025
Statut : ✅ Document de référence officiel

---

## 📑 TABLE DES MATIÈRES

1. [Vision & Mission](#vision--mission)
2. [Architecture Technique](#architecture-technique)
3. [Personas & Flux Utilisateurs](#personas--flux-utilisateurs)
4. [Fonctionnalités Détaillées](#fonctionnalités-détaillées)
5. [Architecture de Données](#architecture-de-données)
6. [Stack Technologique](#stack-technologique)
7. [Standards de Développement](#standards-de-développement)
8. [Roadmap](#roadmap)
9. [Sécurité & Performance](#sécurité--performance)
10. [Guide pour Développeurs](#guide-pour-développeurs)

---

## 🎯 VISION & MISSION

### Vision

**Devenir la plateforme de référence en France pour la planification de mariage, en combinant technologie IA et service premium.**

Nuply révolutionne l'industrie du mariage en :
- Simplifiant la recherche et sélection de prestataires via matching IA
- Centralisant toute la gestion (budget, timeline, documents, communication)
- Créant une expérience utilisateur premium et intuitive
- Facilitant la collaboration entre couples et prestataires

### Mission

**Rendre l'organisation de mariage simple, agréable et sans stress.**

#### Pour les couples :
- ✨ **Gain de temps** : Matching IA intelligent pour trouver les bons prestataires
- 💰 **Contrôle budget** : Suivi en temps réel des dépenses par catégorie
- 📅 **Organisation** : Timeline visuelle avec jalons et échéances
- 🤝 **Collaboration** : Gestion des permissions pour famille/amis
- 💬 **Communication** : Messagerie centralisée avec tous les prestataires

#### Pour les prestataires :
- 📊 **Visibilité** : Profil professionnel visible par milliers de couples
- 🎯 **Matching qualifié** : Recommandations IA basées sur expertise et disponibilité
- 📆 **Gestion simplifiée** : Agenda centralisé, demandes organisées
- 💬 **Communication** : Messagerie directe avec les couples
- 📈 **Analytics** : Statistiques sur performances et conversions

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                    Next.js 16 App Router                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   /couple    │         │ /prestataire │                 │
│  │              │         │              │                 │
│  │ • Dashboard  │         │ • Dashboard  │                 │
│  │ • Matching   │         │ • Demandes   │                 │
│  │ • Budget     │         │ • Profil     │                 │
│  │ • Timeline   │         │ • Agenda     │                 │
│  │ • Messages   │         │ • Messages   │                 │
│  └──────────────┘         └──────────────┘                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                      MIDDLEWARE                              │
│         Authentication & Authorization (Supabase)            │
│           Rate Limiting | CORS | Security                   │
├─────────────────────────────────────────────────────────────┤
│                       API ROUTES                             │
│                                                              │
│  /api/chatbot               • Chatbot IA (N8N)              │
│  /api/marriage-admin        • Documents administratifs      │
│  /api/collaborateurs        • Gestion invitations           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                               │
│                   Supabase (BaaS)                           │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │ PostgreSQL  │  │ Auth & RLS   │  │  Storage    │       │
│  │   Database  │  │ (Row Level   │  │  (Avatars,  │       │
│  │             │  │  Security)   │  │   Docs)     │       │
│  └─────────────┘  └──────────────┘  └─────────────┘       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                   SERVICES EXTERNES                          │
│                                                              │
│  • N8N (Automation & AI Agent)                              │
│  • OpenAI (Matching IA & Chatbot)                           │
│  • Email Service (Invitations & Notifications)              │
│  • PDF Generation (Documents administratifs)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Architecture de Routing (Next.js App Router)

```
/app
├── page.tsx                      # Landing page publique
│
├── (auth)/                       # Route group authentification
│   ├── layout.tsx               # Layout auth (centré, clean)
│   ├── callback/                # OAuth callback handler
│   └── confirm/                 # Email confirmation
│
├── sign-in/                     # Page connexion
├── sign-up/                     # Page inscription
│
├── couple/                      # Dashboard couple (protégé)
│   ├── layout.tsx              # Layout avec sidebar couple
│   ├── dashboard/              # Vue d'ensemble
│   ├── matching/               # Recherche & matching IA
│   ├── recherche/              # Recherche manuelle
│   ├── demandes/               # Demandes envoyées aux prestataires
│   ├── budget/                 # Gestion budget par catégories
│   ├── timeline/               # Planning avec jalons
│   ├── collaborateurs/         # Gestion collaborateurs (famille/amis)
│   ├── profil/                 # Profil du couple
│   ├── messagerie/             # Messagerie centralisée
│   └── notifications/          # Centre de notifications
│
├── prestataire/                # Dashboard prestataire (protégé)
│   ├── layout.tsx             # Layout avec sidebar prestataire
│   ├── dashboard/             # Vue d'ensemble
│   ├── demandes-recues/       # Demandes reçues (nouvelles/en cours)
│   ├── profil-public/         # Édition profil public
│   ├── agenda/                # Gestion disponibilités
│   └── messagerie/            # Messagerie avec couples
│
├── invitation/[token]/        # Acceptation invitation collaborateur
├── tarifs/                    # Page pricing (publique)
│
└── api/
    ├── auth/signout/          # Déconnexion
    ├── chatbot/               # Chatbot IA (N8N webhook)
    ├── collaborateurs/
    │   ├── invite/           # Créer invitation
    │   └── invitation/[token]/
    │       ├── route.ts      # GET invitation info
    │       └── accept/       # POST accepter invitation
    └── marriage-admin/
        ├── create/           # Créer dossier mairie
        ├── generate-document/# Générer document prérempli
        ├── generate-pdf/    # Générer PDF complet
        └── upload-document/ # Upload document scanné
```

---

## 👥 PERSONAS & FLUX UTILISATEURS

### Persona 1 : Le Couple

**Profil type** : Marie & Thomas, 28-32 ans, Paris
- Récemment fiancés
- Aucune expérience d'organisation de mariage
- Budget moyen : 15-25K€
- Date de mariage : dans 12-18 mois
- Besoin : simplicité, transparence, gain de temps

#### Flux utilisateur principal - Couple

```
1. DÉCOUVERTE & INSCRIPTION
   Landing → Inscription → Onboarding
   ↓
   Questions : Date mariage, Budget, Lieu, Style

2. DASHBOARD - VUE D'ENSEMBLE
   ┌─────────────────────────────────────┐
   │ 📊 Statistiques                     │
   │   • Budget utilisé : 8,500€ / 20K€  │
   │   • Prestataires : 3/8 confirmés    │
   │   • Jours restants : 287            │
   │                                      │
   │ 📅 Prochaines échéances              │
   │ 💬 Messages non lus                  │
   │ ⚡ Recommandations IA                │
   └─────────────────────────────────────┘

3. RECHERCHE PRESTATAIRES
   a) MATCHING IA (recommandé)
      • Questionnaire détaillé
      • IA analyse : style, budget, localisation
      • Top 5 recommandations personnalisées
      • Envoi demande en 1 clic

   b) RECHERCHE MANUELLE
      • Filtres : catégorie, prix, zone, avis
      • Carte interactive
      • Comparaison côte à côte

4. GESTION BUDGET
   ┌─────────────────────────────────────┐
   │ Budget par catégories               │
   │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
   │ 🎵 DJ/Musique      1,200€ / 2,000€  │
   │ 📸 Photographe     2,500€ / 3,000€  │
   │ 🍰 Traiteur        8,000€ / 10,000€ │
   │ 💐 Fleurs            800€ / 1,500€  │
   │                                      │
   │ [Ajouter dépense] [Export Excel]    │
   └─────────────────────────────────────┘

5. TIMELINE
   Timeline visuelle avec jalons :
   • J-365 : Réserver salle
   • J-180 : Envoyer save-the-date
   • J-90  : Confirmer menu traiteur
   • J-30  : Plan de table
   [Chaque jalon peut être complété, avec notes]

6. COLLABORATEURS
   • Inviter famille/amis par email
   • Permissions granulaires :
     - Vue seule
     - Modification budget
     - Communication prestataires
   • Token d'invitation sécurisé

7. MESSAGERIE
   • Conversations centralisées
   • Pièces jointes
   • Devis intégrés
   • Notifications temps réel
```

### Persona 2 : Le Prestataire

**Profil type** : Sophie, photographe mariage, 35 ans, Lyon
- 8 ans d'expérience
- 25-30 mariages/an
- Tarif moyen : 2,500€
- Besoin : visibilité qualifiée, gestion simplifiée

#### Flux utilisateur principal - Prestataire

```
1. INSCRIPTION & PROFIL
   • Création compte professionnel
   • Vérification (SIRET, portfolio)
   • Onboarding : catégorie, zone, tarifs

2. PROFIL PUBLIC
   ┌─────────────────────────────────────┐
   │ 📸 Sophie Dupont - Photographe      │
   │                                      │
   │ ⭐ 4.8/5 (47 avis)                  │
   │ 📍 Lyon et alentours (50km)         │
   │ 💰 2,000€ - 3,500€                  │
   │                                      │
   │ 📝 Description                       │
   │ 🖼️ Portfolio (15 photos)            │
   │ ✨ Prestations                       │
   │ 📅 Disponibilités                    │
   │ 💬 Avis clients                      │
   │                                      │
   │ [Modifier profil]                    │
   └─────────────────────────────────────┘

3. DASHBOARD
   ┌─────────────────────────────────────┐
   │ 📊 Cette semaine                     │
   │   • 5 nouvelles demandes             │
   │   • 3 devis envoyés                  │
   │   • 2 confirmations                  │
   │                                      │
   │ 📈 Statistiques                      │
   │   • Taux de réponse : 92%            │
   │   • Taux conversion : 35%            │
   │   • Profil vu 143 fois/mois          │
   │                                      │
   │ ⚡ Actions requises                  │
   │   • Répondre à 2 demandes            │
   │   • Finaliser devis (Marie & Thomas) │
   └─────────────────────────────────────┘

4. DEMANDES REÇUES
   Onglets : Nouvelles | En cours | Archivées

   [Nouvelle demande]
   ┌─────────────────────────────────────┐
   │ Marie & Thomas                       │
   │ 📅 Mariage : 15 juin 2026            │
   │ 📍 Château de Versailles             │
   │ 💰 Budget photo : 2,500€             │
   │ 💬 "Nous cherchons un style naturel  │
   │     et spontané..."                  │
   │                                      │
   │ 🤖 Matching IA : 92% compatible      │
   │                                      │
   │ [Accepter] [Décliner] [Voir profil]  │
   └─────────────────────────────────────┘

5. AGENDA
   • Calendrier des mariages confirmés
   • Blocage de dates indisponibles
   • Sync Google Calendar (futur)

6. MESSAGERIE
   • Conversations avec couples
   • Envoi devis PDF
   • Validation dates
```

---

## 🎨 FONCTIONNALITÉS DÉTAILLÉES

### 1. MATCHING IA (Fonctionnalité phare)

**Objectif** : Recommander les 5 meilleurs prestataires pour chaque couple

#### Algorithme de matching

```typescript
// Facteurs de scoring (0-100)
interface MatchingScore {
  budget: number        // 30% - Compatible avec budget couple
  style: number         // 25% - Style visuel/ambiance
  localisation: number  // 20% - Proximité géographique
  disponibilite: number // 15% - Dispo à la date souhaitée
  avis: number          // 10% - Note moyenne et nombre d'avis
}

// Exemple de calcul
Couple recherche photographe :
  - Budget : 2,500€
  - Style : Naturel, champêtre
  - Date : 15/06/2026
  - Lieu : Lyon (69)

Prestataire Sophie :
  - Tarif : 2,000-3,500€  → budget_score = 95
  - Tags : [naturel, reportage, lifestyle] → style_score = 88
  - Zone : Lyon 50km → localisation_score = 100
  - Dispo 15/06/2026 : OUI → disponibilite_score = 100
  - Note : 4.8/5 (47 avis) → avis_score = 92

Score final : (95*0.3 + 88*0.25 + 100*0.2 + 100*0.15 + 92*0.1) = 94.2/100
→ Recommandation FORTE
```

#### Flow technique

```
1. Couple remplit questionnaire matching
   POST /api/matching/analyze
   {
     category: "photographe",
     budget: 2500,
     style_tags: ["naturel", "champêtre"],
     date: "2026-06-15",
     location: { lat: 45.75, lng: 4.85, radius: 50 }
   }

2. Backend calcule scores
   • Query Supabase : prestataires actifs dans catégorie
   • Pour chaque prestataire : calcul scoring
   • Tri par score décroissant
   • Retourne top 5

3. Frontend affiche recommandations
   • Cards avec score de match (94% compatible)
   • Photos portfolio
   • Tarifs, avis, disponibilité
   • CTA "Envoyer une demande"

4. Couple envoie demande
   • Message personnalisé pré-rempli par IA
   • Notification temps réel au prestataire
   • Email d'alerte
```

### 2. BUDGET TRACKING

**Objectif** : Contrôle total des dépenses en temps réel

#### Fonctionnalités

```typescript
interface Budget {
  id: string
  couple_id: string
  total_budget: number           // Budget total défini
  categories: BudgetCategory[]   // Répartition par catégorie
}

interface BudgetCategory {
  id: string
  name: string                   // "Traiteur", "Photographe", etc.
  allocated_amount: number       // Budget alloué
  spent_amount: number           // Dépensé réellement
  status: 'ok' | 'warning' | 'exceeded'
  transactions: Transaction[]
}

interface Transaction {
  id: string
  category_id: string
  prestataire_name: string
  amount: number
  type: 'devis' | 'acompte' | 'solde'
  date: Date
  status: 'pending' | 'paid'
  notes?: string
}
```

#### Visualisations

1. **Vue d'ensemble** : Donut chart avec répartition
2. **Par catégorie** : Progress bars avec alertes
3. **Timeline** : Évolution des dépenses dans le temps
4. **Exports** : Excel, PDF pour partage

### 3. TIMELINE / PLANNING

**Objectif** : Visualiser et suivre toutes les échéances

#### Structure

```typescript
interface Timeline {
  id: string
  couple_id: string
  wedding_date: Date
  milestones: Milestone[]
}

interface Milestone {
  id: string
  title: string
  description: string
  due_date: Date                 // Date limite
  category: string               // Lié à quelle catégorie budget
  status: 'pending' | 'completed'
  assigned_to?: string[]         // IDs collaborateurs
  reminders: Reminder[]
}

// Milestones pré-configurés selon date de mariage
const DEFAULT_MILESTONES = [
  { title: "Réserver la salle", offset_days: -365 },
  { title: "Choisir traiteur", offset_days: -270 },
  { title: "Envoyer save-the-date", offset_days: -180 },
  { title: "Réserver photographe", offset_days: -180 },
  { title: "Essayage robe/costume", offset_days: -90 },
  { title: "Finaliser plan de table", offset_days: -30 },
  { title: "Confirmer menu traiteur", offset_days: -21 },
  { title: "Répétition cérémonie", offset_days: -2 },
]
```

#### Interface

- Vue Kanban : À faire | En cours | Terminé
- Vue Timeline : Ligne temporelle visuelle
- Notifications : Rappels automatiques J-7, J-3, J-1

### 4. COLLABORATEURS

**Objectif** : Impliquer famille/amis dans l'organisation

#### Système de permissions

```typescript
interface Collaborateur {
  id: string
  couple_id: string
  email: string
  name: string
  role: 'viewer' | 'editor' | 'admin'
  permissions: {
    view_budget: boolean
    edit_budget: boolean
    view_timeline: boolean
    edit_timeline: boolean
    view_messages: boolean
    send_messages: boolean
    view_documents: boolean
  }
  invitation_token: string
  invitation_expires_at: Date
  accepted_at?: Date
}

// Rôles pré-configurés
const ROLES = {
  viewer: {
    // Peut uniquement consulter
    view_budget: true,
    edit_budget: false,
    view_timeline: true,
    edit_timeline: false,
    view_messages: true,
    send_messages: false,
  },
  editor: {
    // Peut consulter et modifier (sauf messages)
    view_budget: true,
    edit_budget: true,
    view_timeline: true,
    edit_timeline: true,
    view_messages: true,
    send_messages: false,
  },
  admin: {
    // Tous les droits (ex: témoin, wedding planner)
    view_budget: true,
    edit_budget: true,
    view_timeline: true,
    edit_timeline: true,
    view_messages: true,
    send_messages: true,
  }
}
```

#### Flow d'invitation

```
1. Couple crée invitation
   POST /api/collaborateurs/invite
   { email, name, role, message }

2. Backend génère token sécurisé
   • Token : randomBytes(32).toString('hex')
   • Expiration : +7 jours
   • Stockage en DB

3. Email envoyé
   "Marie & Thomas vous invitent à collaborer sur leur mariage"
   [Accepter l'invitation] → /invitation/{token}

4. Collaborateur clique
   • Vérification token valide et non expiré
   • Création compte si nécessaire
   • Lien collaborateur ↔ couple
   • Redirect vers dashboard couple (avec permissions)
```

### 5. MESSAGERIE

**Objectif** : Centraliser toutes les conversations

#### Architecture

```typescript
interface Conversation {
  id: string
  couple_id: string
  prestataire_id: string
  status: 'active' | 'archived'
  unread_count_couple: number
  unread_count_prestataire: number
  last_message_at: Date
  messages: Message[]
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'couple' | 'prestataire'
  content: string
  type: 'text' | 'file' | 'devis'
  attachments?: Attachment[]
  read_at?: Date
  created_at: Date
}

interface Attachment {
  id: string
  file_name: string
  file_url: string         // Supabase Storage
  file_type: string
  file_size: number
}
```

#### Fonctionnalités temps réel

- **Supabase Realtime** : Messages instantanés
- **Notifications** : Badge rouge sur icône messagerie
- **Typing indicators** : "Sophie est en train d'écrire..."
- **Read receipts** : "Lu à 14:32"

### 6. DOCUMENTS ADMINISTRATIFS (Mariage civil)

**Objectif** : Simplifier les démarches administratives de mairie

#### Flow complet

```
1. CRÉATION DOSSIER
   Couple remplit formulaire :
   • Informations époux 1 & 2
   • Mairie choisie
   • Date souhaitée
   • Témoins
   • Documents à fournir

2. GÉNÉRATION DOCUMENTS
   • Cerfa 11531*05 (demande de publication des bans)
   • Cerfa 15278*03 (attestation de l'officier d'état civil)
   • Attestation sur l'honneur domicile
   • Liste documents à fournir (personnalisée)

   → Pré-remplis avec données couple
   → Export PDF

3. UPLOAD DOCUMENTS
   Checklist interactive :
   ☑ Acte de naissance (- de 3 mois)
   ☑ Justificatif domicile
   ☑ Pièce d'identité
   □ Contrat de mariage (si applicable)

   → Upload vers Supabase Storage
   → Génération PDF récapitulatif

4. SUIVI
   Dashboard :
   • ✅ Dossier déposé à la mairie
   • ⏳ En attente publication des bans
   • ✅ Bans publiés
   • 📅 Rendez-vous mairie : 15/06/2026 à 15h
```

---

## 🗄️ ARCHITECTURE DE DONNÉES

### Schema Supabase (PostgreSQL)

```sql
-- ============================================
-- TABLES PRINCIPALES
-- ============================================

-- Profils couples
CREATE TABLE couples (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  partner1_name TEXT NOT NULL,
  partner2_name TEXT,
  wedding_date DATE,
  wedding_location TEXT,
  budget_total DECIMAL(10,2),
  style_tags TEXT[],
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profils prestataires
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT DEFAULT 'prestataire',
  business_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'photographe', 'traiteur', etc.
  description TEXT,
  zone_intervention TEXT[],
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  style_tags TEXT[],
  portfolio_images TEXT[],
  siret TEXT,
  verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disponibilités prestataires
CREATE TABLE availabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestataire_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'available', -- 'available', 'booked', 'blocked'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prestataire_id, date)
);

-- Demandes couple → prestataire
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  prestataire_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  wedding_date DATE,
  message TEXT,
  budget DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  matching_score DECIMAL(5,2), -- Score IA (0-100)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUDGET
-- ============================================

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  total_budget DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  allocated_amount DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES budget_categories(id) ON DELETE CASCADE,
  prestataire_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT, -- 'devis', 'acompte', 'solde'
  date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TIMELINE
-- ============================================

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COLLABORATEURS
-- ============================================

CREATE TABLE collaborateurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'viewer', -- 'viewer', 'editor', 'admin'
  invitation_token TEXT UNIQUE,
  invitation_expires_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGERIE
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  prestataire_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active', 'archived'
  unread_count_couple INTEGER DEFAULT 0,
  unread_count_prestataire INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, prestataire_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL, -- 'couple', 'prestataire'
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text', -- 'text', 'file', 'devis'
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS ADMINISTRATIFS
-- ============================================

CREATE TABLE marriage_administrative_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  municipality TEXT NOT NULL,
  wedding_date DATE NOT NULL,
  partner1_data JSONB NOT NULL,
  partner2_data JSONB NOT NULL,
  witnesses JSONB,
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'validated'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE uploaded_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marriage_file_id UUID REFERENCES marriage_administrative_files(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'birth_certificate', 'id_card', etc.
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Couples : accès uniquement à leurs propres données
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Couples can view own data" ON couples
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Couples can update own data" ON couples
  FOR UPDATE USING (auth.uid() = id);

-- Prestataires : accès à leur profil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prestataires can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Prestataires can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Everyone can view public profiles" ON profiles
  FOR SELECT USING (TRUE);

-- Requests : couples voient leurs demandes, prestataires voient demandes reçues
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Couples can view own requests" ON requests
  FOR SELECT USING (auth.uid() = couple_id);
CREATE POLICY "Prestataires can view received requests" ON requests
  FOR SELECT USING (auth.uid() = prestataire_id);

-- Budget : accès uniquement au couple propriétaire
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Couples can manage own budget" ON budgets
  FOR ALL USING (auth.uid() = couple_id);

-- Messages : accès uniquement aux participants de la conversation
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.couple_id = auth.uid() OR c.prestataire_id = auth.uid())
    )
  );
```

---

## 🛠️ STACK TECHNOLOGIQUE

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| **Next.js** | 16.0.3 | Framework React, App Router, SSR |
| **React** | 19.2.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **TailwindCSS** | 4.x | Styling utility-first |
| **shadcn/ui** | Latest | Component library |
| **Framer Motion** | 12.x | Animations |
| **Zustand** | 5.x | State management (stores locaux) |
| **React Hook Form** | 7.x | Forms management |
| **Zod** | 4.x | Schema validation |
| **date-fns** | 4.x | Date manipulation |
| **Recharts** | 3.x | Charts & graphs |

### Backend

| Technologie | Usage |
|-------------|-------|
| **Supabase** | BaaS (Backend as a Service) |
| • PostgreSQL | Database principale |
| • Auth | Authentication & JWT |
| • Storage | Stockage fichiers (avatars, documents) |
| • Realtime | WebSockets pour messagerie |
| • Row Level Security | Sécurité au niveau base de données |

### Services Externes

| Service | Usage |
|---------|-------|
| **N8N** | Automation workflows & AI Agent chatbot |
| **OpenAI API** | Matching IA, génération texte, chatbot |
| **pdf-lib** | Génération PDF (documents administratifs) |
| **Vercel** | Hébergement & déploiement |
| **Resend / SendGrid** | Service email (invitations, notifications) |

### DevOps & Tools

| Tool | Usage |
|------|-------|
| **Git / GitHub** | Version control |
| **ESLint** | Linting JavaScript/TypeScript |
| **Prettier** | Code formatting |
| **Jest** | Testing (unitaire) |
| **Sentry** | Error monitoring (à implémenter) |

---

## 📐 STANDARDS DE DÉVELOPPEMENT

### Conventions de Code

#### Naming Conventions

```typescript
// ✅ BON
const FRENCH_CONVENTIONS = {
  // Français pour domain logic (tables DB, types métier)
  tables: ['couples', 'prestataires', 'budgets', 'collaborateurs'],
  types: ['Couple', 'Prestataire', 'Budget'],

  // Anglais pour code technique
  components: ['Button', 'Card', 'Modal'],
  functions: ['handleSubmit', 'fetchData', 'createUser'],
  variables: ['isLoading', 'userData', 'totalAmount']
}

// ❌ MAUVAIS : Mélanger French/English dans même contexte
const badExample = {
  table: 'prestataireProfiles', // Inconsistent
  type: 'CoupleData'            // Inconsistent
}
```

#### File Structure

```
components/
  ├── couple/          # Composants spécifiques couples
  ├── prestataire/     # Composants spécifiques prestataires
  ├── shared/          # Composants partagés (NEW - à créer)
  │   ├── AvatarUploader.tsx    # Composant unique avec prop 'role'
  │   └── StatCard.tsx          # Composant unique avec options
  ├── layout/          # Layout components (Sidebar, TopBar)
  ├── ui/              # shadcn/ui primitives
  └── landing/         # Landing page publique

lib/
  ├── actions/         # Server actions
  ├── auth/            # Auth utilities
  ├── constants/       # Constants (design system, enums)
  ├── stores/          # Zustand stores (global state)
  ├── supabase/        # Supabase clients & queries
  ├── validations/     # Zod schemas
  └── utils.ts         # Utility functions

types/
  ├── couple.ts
  ├── prestataire.ts
  ├── budget.ts
  ├── database.types.ts  # Auto-generated from Supabase
  └── index.ts
```

### Git Workflow

```bash
# Branches principales
main              # Production
develop           # Development

# Feature branches
feature/matching-ia
feature/budget-tracking
feature/messaging-realtime

# Bugfix branches
bugfix/auth-redirect
bugfix/budget-calculation

# Hotfix branches (production urgent)
hotfix/security-patch

# Commits conventionnels
feat: add matching IA algorithm
fix: correct budget calculation overflow
docs: update README with deployment steps
style: format code with prettier
refactor: consolidate AvatarUploader components
test: add unit tests for matching score
chore: update dependencies
```

### Code Review Checklist

```markdown
## Avant de créer une Pull Request

☑ Code compilé sans erreur (`npm run build`)
☑ Pas de console.log en production
☑ Types TypeScript corrects (pas de `any`)
☑ Validation Zod sur tous les inputs utilisateur
☑ Gestion d'erreurs appropriée (try/catch, error boundaries)
☑ RLS Supabase vérifié pour sécurité
☑ Responsive design testé (mobile, tablet, desktop)
☑ Accessibilité (ARIA labels, keyboard navigation)
☑ Performance (lazy loading, optimistic updates)
☑ Documentation (JSDoc pour fonctions complexes)
```

### Performance Best Practices

```typescript
// ✅ Server Components par défaut (Next.js 16)
// app/couple/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchDashboardData()
  return <Dashboard data={data} />
}

// ✅ Client Components uniquement si nécessaire (interactivité)
// components/couple/BudgetChart.tsx
'use client'
import { useState } from 'react'

// ✅ Lazy loading pour composants lourds
const HeavyChart = lazy(() => import('./HeavyChart'))

// ✅ Optimistic updates pour meilleure UX
const updateBudget = async (data) => {
  // Mise à jour optimiste locale
  setLocalBudget(data)

  // Requête serveur
  await supabase.from('budgets').update(data)

  // Revalidation si nécessaire
  revalidatePath('/couple/budget')
}

// ✅ Image optimization
import Image from 'next/image'
<Image
  src="/portfolio/photo1.jpg"
  width={800}
  height={600}
  alt="Portfolio"
  loading="lazy"
/>
```

---

## 🚀 ROADMAP

### Phase 1 : MVP (COMPLÉTÉ ✅)

**Délai** : 3 mois | **Statut** : ✅ TERMINÉ

- [x] Architecture Next.js 16 App Router
- [x] Authentification Supabase (Email + OAuth)
- [x] Dashboard couple & prestataire
- [x] Profil prestataire public
- [x] Recherche manuelle prestataires
- [x] Système de demandes
- [x] Messagerie basique
- [x] Budget tracking
- [x] Timeline / Milestones
- [x] Design system & UI components

### Phase 2 : IA & Automation (EN COURS 🔄)

**Délai** : 2 mois | **Statut** : 🔄 40% complété

- [x] Chatbot IA (N8N + OpenAI) ✅
- [ ] Matching IA algorithme v1
- [ ] Recommandations personnalisées
- [ ] Auto-génération messages
- [ ] Analyse sentiments avis clients

### Phase 3 : Documents & Admin (EN COURS 🔄)

**Délai** : 1.5 mois | **Statut** : 🔄 60% complété

- [x] Génération documents mairie ✅
- [x] Upload documents ✅
- [x] Génération PDF récapitulatif ✅
- [ ] Signature électronique contrats
- [ ] Stockage sécurisé documents (vault)
- [ ] Templates personnalisables

### Phase 4 : Collaboration & Social (Q1 2026)

**Délai** : 2 mois | **Statut** : 🔜 À VENIR

- [ ] Système collaborateurs avec permissions ✅ (Backend prêt)
- [ ] Invitations par email
- [ ] Commentaires sur timeline
- [ ] Partage sélectif (famille peut voir budget)
- [ ] Mode "Témoin" avec checklist dédiée

### Phase 5 : Marketplace & Paiements (Q2 2026)

**Délai** : 3 mois | **Statut** : 🔜 À VENIR

- [ ] Système de devis intégré
- [ ] Paiements sécurisés (Stripe)
- [ ] Acomptes & échéanciers
- [ ] Factures automatiques
- [ ] Commission plateforme (business model)

### Phase 6 : Mobile App (Q3 2026)

**Délai** : 4 mois | **Statut** : 🔜 À VENIR

- [ ] React Native app
- [ ] Notifications push
- [ ] Mode hors ligne
- [ ] Scanner documents (OCR)

### Améliorations Continues

#### Performance
- [ ] Implement Redis caching
- [ ] CDN pour images (Cloudflare)
- [ ] Optimisation bundle size
- [ ] Service Worker (PWA)

#### Sécurité
- [ ] 2FA authentification
- [ ] Rate limiting généralisé ⚠️ PRIORITÉ
- [ ] CORS strict ⚠️ PRIORITÉ
- [ ] Audit sécurité Pentest
- [ ] GDPR compliance full

#### Analytics & Marketing
- [ ] Google Analytics 4
- [ ] Hotjar heatmaps
- [ ] A/B testing (Matching IA variants)
- [ ] SEO optimization
- [ ] Blog & content marketing

---

## 🔒 SÉCURITÉ & PERFORMANCE

### Sécurité (Score actuel : 7.2/10)

#### ✅ Implémenté

1. **Authentication robuste**
   - Supabase Auth (OAuth + Email)
   - JWT avec refresh tokens
   - Row Level Security (RLS)

2. **Validation inputs**
   - Zod schemas sur toutes les API routes
   - Sanitisation XSS (`lib/security.ts`)
   - Validation format (emails, dates, IDs)

3. **Secrets management**
   - `.env.local` non commité
   - Variables serveur vs client séparées
   - Service role key protégé

#### ⚠️ À AMÉLIORER (Priorité HAUTE)

1. **CORS Configuration**
   ```typescript
   // middleware.ts - À AJOUTER
   const allowedOrigins = [
     process.env.NEXT_PUBLIC_SITE_URL,
     'https://nuply.com',
     'https://www.nuply.com'
   ]

   if (origin && !allowedOrigins.includes(origin)) {
     return new Response('Forbidden', { status: 403 })
   }
   ```

2. **Rate Limiting Généralisé**
   ```typescript
   // lib/rate-limit.ts - ÉTENDRE
   export const apiLimiter = new RateLimiter({ max: 50, windowMs: 60000 })
   export const uploadLimiter = new RateLimiter({ max: 5, windowMs: 60000 })
   export const inviteLimiter = new RateLimiter({ max: 10, windowMs: 3600000 })

   // Appliquer à TOUTES les API routes
   ```

3. **Error Handling Standardisé**
   ```typescript
   // lib/errors.ts - À CRÉER
   export class ApiError extends Error {
     constructor(
       public statusCode: number,
       public userMessage: string,
       public internalMessage?: string
     ) {
       super(internalMessage || userMessage)
     }
   }

   // Ne JAMAIS exposer error.message au client
   // Logger les détails côté serveur uniquement
   ```

### Performance

#### Métriques cibles

| Métrique | Cible | Actuel | Statut |
|----------|-------|--------|--------|
| First Contentful Paint | < 1.5s | ~1.2s | ✅ |
| Largest Contentful Paint | < 2.5s | ~2.1s | ✅ |
| Time to Interactive | < 3.5s | ~2.8s | ✅ |
| Cumulative Layout Shift | < 0.1 | ~0.05 | ✅ |
| Bundle size (JS) | < 200KB | ~180KB | ✅ |

#### Optimisations implémentées

1. **Next.js App Router**
   - Server Components par défaut
   - Streaming SSR
   - Automatic code splitting

2. **Images**
   - Next.js Image component (lazy load, WebP)
   - Responsive images
   - Placeholder blur

3. **Database**
   - Supabase connection pooling
   - Indexes sur colonnes fréquentes
   - RLS policies optimisées

#### À implémenter

- [ ] Redis cache pour requêtes fréquentes
- [ ] CDN pour assets statiques
- [ ] Service Worker (offline mode)
- [ ] Prefetching liens critiques

---

## 👨‍💻 GUIDE POUR DÉVELOPPEURS

### Setup Local

```bash
# 1. Clone repository
git clone https://github.com/votre-org/nuply.git
cd nuply

# 2. Installer dépendances
npm install

# 3. Configurer environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# 4. Lancer dev server
npm run dev
# → http://localhost:3000

# 5. (Optionnel) Seed database
npm run db:seed
```

### Variables d'environnement requises

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ SECRET - Jamais commit

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# N8N Webhooks
N8N_WEBHOOK_CHATBOT_URL=https://n8n.example.com/webhook/chatbot

# OpenAI (pour matching IA)
OPENAI_API_KEY=sk-...  # ⚠️ SECRET

# Email (Resend ou SendGrid)
EMAIL_API_KEY=re_...  # ⚠️ SECRET
EMAIL_FROM=noreply@nuply.com
```

### Commandes utiles

```bash
# Développement
npm run dev              # Lancer dev server
npm run build            # Build production
npm run start            # Lancer build production
npm run lint             # Linter

# Tests
npm run test             # Jest tests
npm run test:api         # Test API endpoints
npm run test:e2e         # Tests end-to-end (Playwright)

# Database
npm run db:migrate       # Run Supabase migrations
npm run db:seed          # Seed database avec données test
npm run db:reset         # Reset database (⚠️ destructif)

# Types
npm run types:generate   # Générer types TypeScript depuis Supabase
```

### Structure d'une feature

Exemple : Ajouter feature "Wishlist prestataires"

```bash
# 1. Créer migration Supabase
supabase/migrations/20260101_create_wishlists.sql

# 2. Créer types
types/wishlist.ts

# 3. Créer Zod schema
lib/validations/wishlist.schema.ts

# 4. Créer API route
app/api/wishlist/
  ├── route.ts              # GET, POST
  └── [id]/route.ts         # DELETE

# 5. Créer server action (alternative)
lib/actions/wishlist.ts

# 6. Créer composant UI
components/couple/WishlistCard.tsx
components/couple/WishlistModal.tsx

# 7. Créer page
app/couple/wishlist/
  └── page.tsx

# 8. Ajouter dans navigation
components/layout/Sidebar.tsx  # Ajouter lien

# 9. Tests
__tests__/wishlist.test.ts

# 10. Documentation
docs/features/wishlist.md
```

### Debugging

```typescript
// ✅ Utiliser le logger
import { logger } from '@/lib/logger'

logger.info('User logged in', { userId: user.id })
logger.error('Database error', error)

// ❌ NE PAS utiliser console.log en production
console.log('Debug info')  // À éviter

// ✅ Conditional logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data)
}
```

### Ressources

- **Documentation Next.js** : https://nextjs.org/docs
- **Documentation Supabase** : https://supabase.com/docs
- **shadcn/ui** : https://ui.shadcn.com
- **TailwindCSS** : https://tailwindcss.com/docs

---

## 📞 CONTACTS & SUPPORT

### Équipe

- **Tech Lead** : [Nom]
- **Backend** : [Nom]
- **Frontend** : [Nom]
- **Design** : [Nom]

### Liens utiles

- **Repository** : https://github.com/votre-org/nuply
- **Staging** : https://staging.nuply.com
- **Production** : https://nuply.com
- **Supabase Dashboard** : https://app.supabase.com/project/xxxxx

### Support

- **Issues** : GitHub Issues
- **Questions** : Discussions GitHub
- **Urgences** : Slack #nuply-dev

---

## 📄 CHANGELOG

### v2.0.0 - 29 Décembre 2025
- 📝 Création du fil conducteur complet (agents.md)
- 🧹 Audit complet et plan de nettoyage
- 🔒 Audit de sécurité détaillé
- 📊 Documentation architecture complète

### v1.5.0 - Décembre 2025
- ✨ Ajout génération documents administratifs
- ✨ Chatbot IA avec N8N
- 🐛 Corrections middleware authentification
- 🎨 Amélioration design system

### v1.0.0 - Novembre 2025
- 🚀 Lancement MVP
- ✨ Dashboard couple & prestataire
- ✨ Budget tracking
- ✨ Timeline
- ✨ Messagerie basique

---

**Ce document est le fil conducteur officiel de NUPLY.**
Tous les développeurs doivent le consulter avant de commencer une nouvelle feature.

**Dernière révision** : 29 Décembre 2025
**Prochaine révision** : 29 Mars 2026

---

💍 **NUPLY** - Votre mariage, simplifié.
