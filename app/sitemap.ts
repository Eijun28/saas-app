import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

/**
 * Sitemap dynamique pour le SEO
 * 
 * Next.js génère automatiquement ce fichier à l'URL /sitemap.xml
 * 
 * Pour ajouter des pages dynamiques (ex: articles de blog, profils prestataires),
 * vous pouvez faire des appels API ou lire depuis votre base de données.
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  
  // Pages statiques principales
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tarifs`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ];

  // TODO: Ajouter les pages dynamiques ici
  // Exemple pour des articles de blog :
  // const blogPosts = await getBlogPosts();
  // const blogPages = blogPosts.map((post) => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }));

  // Exemple pour des profils prestataires publics :
  // const prestataires = await getPublicPrestataires();
  // const prestatairePages = prestataires.map((prestataire) => ({
  //   url: `${baseUrl}/prestataire/${prestataire.slug}`,
  //   lastModified: prestataire.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }));

  return [...staticPages];
}
