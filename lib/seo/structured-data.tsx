/**
 * Composants et utilitaires pour les données structurées (JSON-LD)
 * 
 * Les données structurées aident les moteurs de recherche à mieux comprendre
 * le contenu de votre site et peuvent améliorer l'affichage dans les résultats.
 */

import { siteConfig } from '@/config/site';

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  contactPoint?: {
    '@type': 'ContactPoint';
    telephone?: string;
    contactType: string;
    email?: string;
  };
  sameAs?: string[];
}

export interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }>;
}

export interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: {
    '@type': 'Person' | 'Organization';
    name: string;
  };
  publisher?: {
    '@type': 'Organization';
    name: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
}

export interface ServiceSchema {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  description: string;
  provider: {
    '@type': 'Organization';
    name: string;
  };
  areaServed?: string;
  serviceType?: string;
}

/**
 * Génère le schéma Organization pour NUPLY
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NUPLY',
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/logo.png`, // À adapter
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@nuply.fr', // À adapter
    },
    sameAs: [
      // À adapter avec vos réseaux sociaux
      // 'https://twitter.com/nuply',
      // 'https://www.facebook.com/nuply',
      // 'https://www.instagram.com/nuply',
    ],
  };
}

/**
 * Génère le schéma WebSite pour NUPLY
 */
export function generateWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NUPLY',
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/recherche?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Génère le schéma BreadcrumbList
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${siteConfig.url}${item.url}` : undefined,
    })),
  };
}

/**
 * Génère le schéma Article pour les articles de blog
 */
export function generateArticleSchema(
  article: {
    headline: string;
    description: string;
    image?: string;
    datePublished?: string;
    dateModified?: string;
    author?: string;
  }
): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: article.author
      ? {
          '@type': 'Organization',
          name: article.author,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'NUPLY',
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/images/logo.png`, // À adapter
      },
    },
  };
}

/**
 * Génère le schéma Service pour les services NUPLY
 */
export function generateServiceSchema(
  service: {
    name: string;
    description: string;
    serviceType?: string;
  }
): ServiceSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: 'NUPLY',
    },
    serviceType: service.serviceType,
    areaServed: 'FR', // À adapter selon votre zone de service
  };
}

/**
 * Composant React pour injecter les données structurées
 */
export function StructuredData({ data }: { data: object | object[] }) {
  const jsonLd = Array.isArray(data) ? data : [data];
  
  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
