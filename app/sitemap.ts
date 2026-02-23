import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { createClient } from '@/lib/supabase/server';
import { getAllArticles } from '@/lib/blog/articles';

/**
 * Sitemap dynamique pour le SEO
 * Next.js génère automatiquement ce fichier à l'URL /sitemap.xml
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // Pages statiques principales
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Landing pages SEO mariage (fort trafic organique)
    {
      url: `${baseUrl}/prestataires-mariage`,
      lastModified: new Date('2026-02-23'),
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/photographe-mariage`,
      lastModified: new Date('2026-02-23'),
      changeFrequency: 'weekly',
      priority: 0.92,
    },
    {
      url: `${baseUrl}/organisation-mariage`,
      lastModified: new Date('2026-02-23'),
      changeFrequency: 'weekly',
      priority: 0.92,
    },
    {
      url: `${baseUrl}/tarifs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/notre-vision`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  // Pages dynamiques : profils publics de prestataires
  let providerPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: providers } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('role', 'prestataire')
      .eq('onboarding_completed', true)
      .not('nom_entreprise', 'is', null);

    if (providers && providers.length > 0) {
      providerPages = providers.map((p) => ({
        url: `${baseUrl}/prestataires/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch {
    // En cas d'erreur DB, on continue sans les pages dynamiques
  }

  // Pages dynamiques : articles de blog
  const articles = getAllArticles();
  const blogPages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(article.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  return [...staticPages, ...blogPages, ...providerPages];
}
