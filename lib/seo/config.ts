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
  defaultTitle: "NUPLY : Le mariage moderne",
  defaultDescription: "Matching IA, prestataires vérifiés, budget, timeline, messagerie. Tout le mariage au même endroit.",
  
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
      title: "NUPLY : Le mariage moderne",
      description: "Matching IA, prestataires vérifiés, budget, timeline, messagerie. Tout le mariage au même endroit.",
      keywords: ["mariage", "mariage multiculturel", "prestataires mariage", "matching mariage", "organisation mariage"],
    },
    tarifs: {
      title: "Tarifs - NUPLY",
      description: "Tarifs simples et transparents pour les couples et prestataires. Pas de frais cachés. Changez ou annulez quand vous voulez.",
      keywords: ["tarifs mariage", "prix mariage", "abonnement mariage", "prestataires tarifs"],
    },
    blog: {
      title: "Blog - NUPLY",
      description: "Découvrez nos articles sur les mariages multiculturels, les tendances et nos conseils pour organiser votre mariage de rêve.",
      keywords: ["blog mariage", "conseils mariage", "tendances mariage", "mariage multiculturel"],
    },
    contact: {
      title: "Contact - NUPLY",
      description: "Contactez l'équipe NUPLY pour toute question sur nos services de gestion de mariage.",
      keywords: ["contact", "support", "aide mariage"],
    },
    signUp: {
      title: "Inscription - NUPLY",
      description: "Créez votre compte gratuit sur NUPLY et commencez à organiser votre mariage de rêve.",
      keywords: ["inscription", "créer compte", "s'inscrire"],
    },
    signIn: {
      title: "Connexion - NUPLY",
      description: "Connectez-vous à votre compte NUPLY pour accéder à votre espace de gestion de mariage.",
      keywords: ["connexion", "se connecter", "login"],
    },
    legal: {
      title: "Mentions légales - NUPLY",
      description: "Mentions légales et conditions d'utilisation de la plateforme NUPLY.",
      keywords: ["mentions légales", "CGU", "conditions d'utilisation"],
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
