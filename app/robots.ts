import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nuply.com' // ⚠️ REMPLACER par votre domaine de production

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/couple/', '/prestataire/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

