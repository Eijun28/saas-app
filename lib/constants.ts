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
    headline: 'Nuply : Le mariage moderne',
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
        title: 'Nuply Matching',
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
    headline: 'Un mariage qui vous ressemble',
    features: [
      'Matching culturel basé sur vos traditions',
      'Respect de votre budget et vision',
      'Prestataires vérifiés et engagés',
      'Une approche moderne du mariage',
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
          'Matching AI par culture et tradition',
          'Messages illimités avec les prestataires',
          'Accès à tous les portfolios',
          'Support par email',
        ],
        popular: false,
      },
    ],
    prestataire: [
      {
        name: 'Découverte',
        price: '0',
        period: 'mois',
        features: [
          'Profil basique (10 photos)',
          '3 conversations actives simultanées',
          'Délai 24h sur nouvelles demandes',
          '1 template de devis (sans PDF)',
          '2 cultures sélectionnables',
        ],
        popular: false,
      },
      {
        name: 'Pro',
        price: '59',
        period: 'mois',
        features: [
          'Profil complet (40 photos + galerie)',
          'Demandes illimitées, messagerie instantanée',
          'Templates devis illimités + PDF',
          'Factures (devis→facture, TVA)',
          'Calendrier/Agenda',
          'Analytics (impressions, clics, CTR)',
          'Toutes cultures, tous événements',
          'Badge "Pro"',
        ],
        popular: true,
      },
      {
        name: 'Expert',
        price: '109',
        period: 'mois',
        features: [
          'Tout du Pro',
          'Multi-comptes (jusqu\'à 3 collaborateurs)',
          'Portfolio illimité',
          'Factures personnalisées (logo, IBAN, préfixes)',
          'Devis avec rappels auto',
          'Analytics avancés + export data',
          'Support prioritaire',
          'Badge "Expert"',
        ],
        popular: false,
      },
    ],
  },
  finalCTA: {
    headline: 'Prêt à commencer ? Nuply s\'occupe du reste.',
    cta: 'Créer mon compte',
  },
} as const

