import { Metadata } from 'next';
import { siteConfig } from '@/config/site';

/**
 * Configuration SEO centralisée pour NUPLY
 * 
 * Ce fichier contient toutes les configurations SEO de base
 * qui peuvent être réutilisées et étendues pour chaque page.
 */

export const seoConfig = {
  // Informations de base du site
  siteName: siteConfig.name,
  siteUrl: siteConfig.url,
  defaultTitle: "NUPLY – Prestataires mariage vérifiés & organisation tout-en-un",
  defaultDescription: "NUPLY : trouvez vos prestataires mariage (photographe, traiteur, DJ, wedding planner) et organisez votre mariage avec budget, timeline et messagerie en un seul endroit.",
  
  // Informations de l'entreprise
  company: {
    name: "NUPLY",
    legalName: "NUPLY",
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/logo.png`, // À adapter selon votre logo
    contactEmail: "contact@nuply.fr", // À adapter
    social: {
      twitter: "@nuply", // À adapter
      facebook: "nuply", // À adapter
      instagram: "nuply", // À adapter
    },
  },

  // Métadonnées par défaut
  defaultMetadata: {
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: `${siteConfig.url}/images/og-image.jpg`, // À créer
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@nuply', // À adapter
      creator: '@nuply', // À adapter
      images: [`${siteConfig.url}/images/twitter-image.jpg`], // À créer
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  },

  // Pages principales avec leurs métadonnées spécifiques
  pages: {
    home: {
      title: "NUPLY – Trouvez vos prestataires mariage & organisez votre jour J",
      description: "NUPLY connecte les couples avec les meilleurs prestataires mariage vérifiés : photographe, traiteur, DJ, salle de réception, wedding planner. Gérez budget, timeline et messagerie en un seul endroit.",
      keywords: [
        "prestataires mariage",
        "organisation mariage",
        "photographe mariage",
        "traiteur mariage",
        "DJ mariage",
        "salle mariage",
        "wedding planner",
        "mariage multiculturel",
        "organiser son mariage",
        "budget mariage",
        "liste prestataires mariage",
        "plateforme mariage",
      ],
    },
    tarifs: {
      title: "Tarifs – NUPLY | Plateforme organisation mariage",
      description: "Tarifs simples et transparents pour les couples et prestataires mariage. Accédez au matching, budget, timeline et messagerie. Pas de frais cachés.",
      keywords: ["tarifs mariage", "prix organisation mariage", "abonnement wedding planner", "coût prestataires mariage"],
    },
    blog: {
      title: "Blog mariage – Conseils, tendances & inspiration | NUPLY",
      description: "Conseils pratiques pour organiser votre mariage : choisir un photographe, un traiteur, une salle, gérer le budget, tendances 2026 et mariages multiculturels.",
      keywords: ["blog mariage", "conseils mariage", "organisation mariage", "tendances mariage 2026", "mariage multiculturel", "préparer mariage"],
    },
    notreVision: {
      title: "Notre vision – NUPLY | Réinventer l'organisation du mariage",
      description: "Découvrez la mission de NUPLY : simplifier l'organisation du mariage en France grâce au matching IA, des prestataires vérifiés et une plateforme tout-en-un.",
      keywords: ["plateforme mariage france", "mariage multiculturel", "prestataires mariage vérifiés", "organisation mariage IA"],
    },
    contact: {
      title: "Contact – NUPLY | Plateforme mariage",
      description: "Contactez l'équipe NUPLY pour toute question sur nos services pour couples et prestataires mariage.",
      keywords: ["contact nuply", "support mariage", "aide organisation mariage"],
    },
    signUp: {
      title: "Inscription gratuite – NUPLY | Commencer à organiser votre mariage",
      description: "Créez votre compte gratuit sur NUPLY. Trouvez des prestataires mariage vérifiés, gérez votre budget et planifiez votre jour J.",
      keywords: ["inscription mariage", "créer compte mariage", "organiser mariage en ligne"],
    },
    signIn: {
      title: "Connexion – NUPLY | Votre espace mariage",
      description: "Connectez-vous à votre compte NUPLY pour accéder à vos prestataires, votre budget et votre planning mariage.",
      keywords: ["connexion nuply", "espace couple mariage", "login prestataire mariage"],
    },
    legal: {
      title: "Mentions légales – NUPLY",
      description: "Mentions légales et conditions d'utilisation de la plateforme NUPLY.",
      keywords: ["mentions légales", "CGU", "conditions d'utilisation nuply"],
    },
    prestatairesMarriage: {
      title: "Prestataires mariage – Trouvez photographes, traiteurs, DJ & plus | NUPLY",
      description: "Trouvez les meilleurs prestataires mariage en France : photographes, traiteurs, DJ, fleuristes, salles de réception, wedding planners. Tous vérifiés et disponibles sur NUPLY.",
      keywords: [
        "prestataires mariage",
        "trouver prestataire mariage",
        "photographe mariage",
        "traiteur mariage",
        "DJ mariage",
        "fleuriste mariage",
        "salle mariage",
        "wedding planner france",
        "prestataires mariage vérifiés",
      ],
    },
    photographeMariage: {
      title: "Photographe mariage – Trouvez le meilleur photographe pour votre jour J | NUPLY",
      description: "Trouvez votre photographe mariage idéal parmi nos professionnels vérifiés. Comparez les styles, les tarifs et obtenez des devis personnalisés.",
      keywords: [
        "photographe mariage",
        "photographe mariage france",
        "trouver photographe mariage",
        "photographe mariage prix",
        "meilleur photographe mariage",
        "photographe mariage reportage",
        "photographe mariage multiculturel",
      ],
    },
    organisationMariage: {
      title: "Organiser son mariage – Guide complet & prestataires | NUPLY",
      description: "Tout pour organiser votre mariage sereinement : checklist, budget, prestataires, planning. NUPLY vous accompagne de la demande en mariage jusqu'au jour J.",
      keywords: [
        "organiser son mariage",
        "organisation mariage",
        "comment organiser un mariage",
        "planning mariage",
        "checklist mariage",
        "préparer mariage",
        "wedding planner",
        "etapes organisation mariage",
      ],
    },
  },
} as const;

/**
 * Génère les métadonnées pour une page
 */
export function generateMetadata(
  page: keyof typeof seoConfig.pages,
  overrides?: Partial<Metadata>
): Metadata {
  const pageConfig = seoConfig.pages[page];
  
  return {
    ...seoConfig.defaultMetadata,
    title: pageConfig.title,
    description: pageConfig.description,
    keywords: [...pageConfig.keywords],
    openGraph: {
      ...seoConfig.defaultMetadata.openGraph,
      images: seoConfig.defaultMetadata.openGraph?.images ? [...seoConfig.defaultMetadata.openGraph.images] : undefined,
      title: pageConfig.title,
      description: pageConfig.description,
    },
    twitter: {
      ...seoConfig.defaultMetadata.twitter,
      images: seoConfig.defaultMetadata.twitter?.images ? [...seoConfig.defaultMetadata.twitter.images] : undefined,
      title: pageConfig.title,
      description: pageConfig.description,
    },
    ...overrides,
  };
}

/**
 * Génère les métadonnées personnalisées
 */
export function createMetadata(metadata: {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  noindex?: boolean;
  image?: string;
  type?: 'website' | 'article';
}): Metadata {
  return {
    ...seoConfig.defaultMetadata,
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: metadata.canonical || '/',
    },
    robots: metadata.noindex
      ? {
          index: false,
          follow: false,
        }
      : seoConfig.defaultMetadata.robots,
    openGraph: {
      ...seoConfig.defaultMetadata.openGraph,
      title: metadata.title,
      description: metadata.description,
      type: metadata.type || 'website',
      images: metadata.image
        ? [
            {
              url: metadata.image,
              width: 1200,
              height: 630,
              alt: metadata.title,
            },
          ]
        : seoConfig.defaultMetadata.openGraph?.images ? [...seoConfig.defaultMetadata.openGraph.images] : undefined,
    },
    twitter: {
      ...seoConfig.defaultMetadata.twitter,
      title: metadata.title,
      description: metadata.description,
      images: metadata.image ? [metadata.image] : (seoConfig.defaultMetadata.twitter?.images ? [...seoConfig.defaultMetadata.twitter.images] : undefined),
    },
  };
}
