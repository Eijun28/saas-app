import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { createClient } from '@/lib/supabase/server';

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

  return [...staticPages, ...providerPages];
}
