import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nuply.com' // ⚠️ REMPLACER par votre domaine

  // Pages statiques
  const staticPages = [
    '',           // Homepage
    '/tarifs',    // Pricing
    '/sign-in',   // Sign in
    '/sign-up',   // Sign up
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Pages de blog (si vous en avez)
  // const blogPosts = await getBlogPosts() // Fetch depuis votre CMS
  // const blogPages = blogPosts.map((post) => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.6,
  // }))

  return [
    ...staticPages,
    // ...blogPages,
  ]
}

