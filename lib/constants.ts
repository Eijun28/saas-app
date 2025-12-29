// Design System Constants
export const COLORS = {
  primaryViolet: '#823F91',
  softViolet: '#E8D4EF',
  pureWhite: '#FFFFFF',
  darkNavy: '#0B0E12',
  neutralGray: '#6B7280',
} as const

// Typography
export const TYPOGRAPHY = {
  h1: {
    desktop: 'text-6xl md:text-7xl lg:text-8xl',
    mobile: 'text-4xl md:text-5xl',
  },
  h2: {
    desktop: 'text-4xl md:text-5xl lg:text-6xl',
    mobile: 'text-3xl md:text-4xl',
  },
  body: 'text-lg md:text-xl',
} as const

// Copy
export const COPY = {
  hero: {
    headline: 'La plateforme IA du mariage moderne',
    subheadline: 'Un matching intelligent entre couples et prestataires, pensé pour votre culture.',
    cta1: 'Commencer',
    cta2: 'Découvrir Nuply',
  },
  howItWorks: {
    title: 'Comment Nuply fonctionne',
    steps: [
      {
        title: 'Onboarding intelligent',
        description: 'Répondez à quelques questions sur votre mariage',
        icon: 'clipboard',
      },
      {
        title: 'Matching culturel + IA',
        description: 'Notre IA trouve les prestataires parfaits pour votre vision',
        icon: 'sparkles',
      },
      {
        title: 'Mise en relation + suivi complet',
        description: 'Gérez tout en un seul endroit, de la première demande au jour J',
        icon: 'calendar',
      },
    ],
  },
  featureBlock: {
    headline: 'Un mariage qui vous ressemble vraiment',
    features: [
      'Trouvez LE photographe qui comprend la symbolique de votre henné',
      "Économisez jusqu'à 3 000€ grâce aux comparaisons automatiques",
      'Zéro malentendu culturel - Tous nos prestataires sont formés à vos traditions',
      'De "Je ne sais pas par où commencer" à "Tout est réservé" en 1 semaine',
    ],
  },
  alternatingSections: [
    {
      title: 'Pour les couples',
      description: 'Trouvez vos prestataires en moins de 5 minutes',
      position: 'left',
    },
    {
      title: 'Pour les prestataires',
      description: 'Accédez aux couples qui partagent vos valeurs',
      position: 'right',
    },
  ],
  pricing: {
    couple: [
      {
        name: 'Gratuit',
        price: '0',
        period: 'mois',
        features: [
          'Accès au matching de base',
          '3 demandes de contact/mois',
          'Support communautaire',
        ],
        popular: false,
      },
      {
        name: 'Premium',
        price: '19',
        period: 'mois',
        features: [
          'Matching illimité',
          'Outils de planification',
          'Support prioritaire',
          'Accès anticipé aux nouvelles fonctionnalités',
        ],
        popular: true,
      },
    ],
    prestataire: [
      {
        name: 'Starter',
        price: '29',
        period: 'mois',
        features: [
          'Profil public',
          '5 demandes/mois',
          'Statistiques de base',
        ],
        popular: false,
      },
      {
        name: 'Pro',
        price: '79',
        period: 'mois',
        features: [
          'Profil premium',
          'Demandes illimitées',
          'Statistiques avancées',
          'Support prioritaire',
        ],
        popular: true,
      },
    ],
  },
  finalCTA: {
    headline: 'Prêt à commencer ? Nuply s\'occupe du reste.',
    cta: 'Créer mon compte',
  },
} as const

