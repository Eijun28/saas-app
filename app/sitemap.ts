import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Sitemap dynamique pour le SEO
 *
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
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
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
      priority: 0.5,
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Pages dynamiques
  let blogPages: MetadataRoute.Sitemap = [];
  let prestatairePages: MetadataRoute.Sitemap = [];

  try {
    const adminClient = createAdminClient();

    // Articles de blog
    const { data: posts } = await adminClient
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true);

    if (posts) {
      blogPages = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }

    // Profils prestataires publics
    const { data: prestataires } = await adminClient
      .from('profiles')
      .select('id, updated_at')
      .eq('role', 'prestataire')
      .not('nom_entreprise', 'is', null);

    if (prestataires) {
      prestatairePages = prestataires.map((p) => ({
        url: `${baseUrl}/prestataire/${p.id}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Si les tables n'existent pas encore ou que l'admin client n'est pas dispo,
    // on retourne uniquement les pages statiques
  }

  return [...staticPages, ...blogPages, ...prestatairePages];
}
