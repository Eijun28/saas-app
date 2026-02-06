import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { getArticleBySlug, getAllArticles } from '@/lib/blog/articles'
import { createMetadata } from '@/lib/seo/config'
import { generateArticleSchema, StructuredData } from '@/lib/seo/structured-data'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const articles = getAllArticles()
  return articles.map(article => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return { title: 'Article non trouvé' }

  return createMetadata({
    title: `${article.title} - Blog NUPLY`,
    description: article.description,
    keywords: article.tags,
    canonical: `/blog/${article.slug}`,
    type: 'article',
  })
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const schema = generateArticleSchema({
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: article.author,
  })

  return (
    <>
      <StructuredData data={schema} />

      <div className="min-h-screen bg-[#FBF8F3]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#823F91] transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au blog
          </Link>

          {/* Article header */}
          <header className="mb-10">
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#823F91]/10 text-[#823F91]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-gray-600 mb-5">
              {article.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-400 border-b border-gray-200 pb-6">
              <span className="font-medium text-gray-600">{article.author}</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {article.readingTime}
              </span>
            </div>
          </header>

          {/* Article content */}
          <article
            className="prose prose-gray prose-lg max-w-none
              prose-headings:text-gray-900 prose-headings:font-bold
              prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-[#823F91]
              prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-li:text-gray-700
              prose-strong:text-gray-900
              prose-a:text-[#823F91] prose-a:no-underline hover:prose-a:underline
            "
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Footer CTA */}
          <div className="mt-12 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Vous préparez votre mariage ?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              NUPLY vous aide à trouver les meilleurs prestataires, gérer votre budget et organiser votre jour J.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#823F91] hover:bg-[#6D3478] text-white rounded-xl font-medium text-sm transition-colors"
            >
              Créer mon compte gratuitement
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
