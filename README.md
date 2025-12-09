# 🎉 NUPLY - Plateforme de Mariage Next-Gen

Plateforme premium de planification de mariage avec matching IA, gestion de budget, timeline et messagerie intégrée.

## 🚀 Technologies

- **Next.js 16** avec App Router
- **TypeScript** (strict mode)
- **TailwindCSS 4** avec configuration personnalisée
- **shadcn/ui** components
- **Framer Motion** pour les animations
- **Poppins** (Google Fonts)

## 🎨 Design System

### Palette de couleurs

- **Primary**: `#7C3AED` (Violet)
- **Secondary**: `#A78BFA` (Light violet)
- **Accent**: `#F5F3FF` (Violet-50)
- **Background**: `#FFFFFF` (Blanc pur)
- **Text**: `#1F2937` (Neutral dark) / `#374151` (Neutral medium)
- **Border**: `#E5E7EB` (Gray-200)

### Typographie

- **Police**: Poppins (weights: 300, 400, 500, 600, 700)
- **Hiérarchie**:
  - h1: `text-4xl font-bold text-[#7C3AED]`
  - h2: `text-3xl font-semibold text-[#1F2937]`
  - h3: `text-2xl font-semibold text-[#1F2937]`
  - body: `text-base font-normal text-[#374151]`

## 📁 Architecture

```
app/
├── layout.tsx              # Root layout avec Poppins
├── page.tsx                # Landing page
├── globals.css             # Styles globaux + design system
├── couple/
│   ├── layout.tsx          # Layout avec sidebar couple
│   ├── page.tsx            # Dashboard couple
│   ├── matching/           # Matching IA
│   ├── budget/             # Gestion budget
│   ├── timeline/           # Timeline planning
│   ├── collaborateurs/     # Gestion collaborateurs
│   └── messagerie/         # Messagerie
└── prestataire/
    ├── layout.tsx          # Layout avec sidebar prestataire
    ├── page.tsx            # Dashboard prestataire
    ├── demandes/           # Demandes reçues
    ├── profil-public/      # Profil public
    ├── agenda/             # Agenda
    └── messagerie/         # Messagerie

components/
├── layout/
│   ├── Sidebar.tsx         # Sidebar navigation
│   ├── NavItem.tsx         # Item de navigation
│   ├── TopBar.tsx          # Barre supérieure
│   ├── RoleSwitcher.tsx    # Switch couple/prestataire
│   └── MobileMenu.tsx      # Menu mobile
├── landing/
│   └── animations.tsx      # Composants d'animation
└── ui/                     # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── badge.tsx
    ├── tabs.tsx
    ├── empty-state.tsx
    └── loading-spinner.tsx
```

## 🎯 Fonctionnalités

### Pour les couples

- **Dashboard**: Vue d'ensemble avec statistiques
- **Matching IA**: Recherche et matching de prestataires
- **Budget**: Suivi des dépenses par catégorie
- **Timeline**: Planning avec jalons et échéances
- **Collaborateurs**: Gestion des invités et permissions
- **Messagerie**: Communication avec prestataires

### Pour les prestataires

- **Dashboard**: Vue d'ensemble des demandes
- **Demandes reçues**: Gestion des demandes (nouvelles/en cours/terminées)
- **Profil public**: Édition du profil visible par les couples
- **Agenda**: Gestion de la disponibilité
- **Messagerie**: Communication avec les couples

## 🎨 Animations

Toutes les pages utilisent des animations Framer Motion:

- **FadeInOnScroll**: Apparition au scroll
- **SlideInOnScroll**: Glissement au scroll
- **StaggeredList**: Liste avec délai échelonné
- **FadeInScaleOnScroll**: Apparition avec scale

## 📱 Responsive

- **Mobile** (< 768px): Menu hamburger, sidebar masquée
- **Tablet** (768px - 1024px): Sidebar avec icônes uniquement
- **Desktop** (> 1024px): Sidebar complète toujours visible

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour production
npm run build
```

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env.local`:

```env
# TODO: Ajouter les variables Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### shadcn/ui Components

Les composants suivants sont déjà installés:
- button
- card
- badge
- tabs

Pour installer d'autres composants:

```bash
npx shadcn@latest add [component-name]
```

## 📝 TODO

- [ ] Intégration Supabase pour l'authentification
- [ ] Route guards avec middleware
- [ ] API routes pour les données
- [ ] Upload d'images pour le portfolio
- [ ] Système de notifications en temps réel
- [ ] Intégration calendrier externe (Google Calendar, etc.)

## 🎯 Prochaines étapes

1. **Backend**: Intégrer Supabase pour l'authentification et la base de données
2. **API**: Créer les routes API pour les données
3. **Realtime**: Ajouter les notifications en temps réel
4. **Tests**: Ajouter les tests unitaires et d'intégration
5. **Deployment**: Déployer sur Vercel

## 📄 Licence

Propriétaire - NUPLY © 2024
