import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

/**
 * Fichier robots.txt dynamique
 * 
 * Next.js génère automatiquement ce fichier à l'URL /robots.txt
 * 
 * Ce fichier indique aux robots des moteurs de recherche
 * quelles pages ils peuvent ou ne peuvent pas indexer.
 */

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Pages privées à ne pas indexer
          '/couple/',
          '/prestataire/',
          '/admin/',
          '/api/',
          '/auth/',
          '/messages/',
          '/invitation/',
          // Fichiers et dossiers à exclure
          '/_next/',
          '/static/',
        ],
      },
      // Règles spécifiques pour Googlebot
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/couple/',
          '/prestataire/',
          '/admin/',
          '/api/',
          '/auth/',
          '/messages/',
          '/invitation/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
