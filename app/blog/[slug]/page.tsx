import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { getArticleBySlug, getAllArticles } from '@/lib/blog/articles'
import { createMetadata } from '@/lib/seo/config'
import { generateArticleSchema, StructuredData } from '@/lib/seo/structured-data'
import { ArrowLeft, ArrowRight, Calendar, Clock, User, BookOpen } from 'lucide-react'

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
  if (!article) return { title: 'Article non trouv\u00e9' }

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

  const allArticles = getAllArticles()
  const relatedArticles = allArticles
    .filter(a => a.slug !== article.slug)
    .slice(0, 2)

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
            className="inline-flex items-center gap-1.5 text-sm text-[#8B7866] hover:text-[#823F91] transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au blog
          </Link>

          {/* Article header */}
          <header className="mb-10">
            <div className="flex flex-wrap gap-2 mb-5">
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#823F91]/10 text-[#823F91]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2C1810] leading-tight mb-4">
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-[#4A3A2E] mb-6 leading-relaxed">
              {article.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-[#8B7866] border-b border-[#EBE4DA] pb-6">
              <span className="flex items-center gap-1.5 font-medium text-[#4A3A2E]">
                <User className="h-3.5 w-3.5" />
                {article.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {article.readingTime}
              </span>
            </div>
          </header>

          {/* Article content */}
          <article
            className="
              prose prose-lg max-w-none

              prose-headings:font-bold prose-headings:text-[#2C1810]

              prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-12 prose-h2:mb-4
              prose-h2:text-[#823F91] prose-h2:pb-2 prose-h2:border-b prose-h2:border-[#EBE4DA]

              prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-[#4A3A2E]

              prose-p:text-[#4A3A2E] prose-p:leading-relaxed prose-p:text-base

              prose-li:text-[#4A3A2E] prose-li:text-base prose-li:leading-relaxed

              prose-ul:my-4

              prose-strong:text-[#2C1810] prose-strong:font-semibold

              prose-a:text-[#823F91] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
            "
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Related articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-16 pt-10 border-t border-[#EBE4DA]">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="h-5 w-5 text-[#823F91]" />
                <h3 className="text-lg font-bold text-[#2C1810]">
                  Continuez votre lecture
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {relatedArticles.map(related => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group bg-white rounded-xl border border-[#EBE4DA] p-5 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {related.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#823F91]/10 text-[#823F91]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h4 className="text-sm font-bold text-[#2C1810] group-hover:text-[#823F91] transition-colors line-clamp-2 mb-2">
                      {related.title}
                    </h4>
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#823F91]">
                      Lire
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-12 bg-gradient-to-br from-[#823F91] to-[#6D3478] rounded-2xl p-6 sm:p-8 text-center text-white shadow-lg">
            <h3 className="text-xl font-bold mb-2">
              Vous pr&eacute;parez votre mariage ?
            </h3>
            <p className="text-white/80 text-sm sm:text-base mb-5 max-w-md mx-auto">
              NUPLY vous aide &agrave; trouver les meilleurs prestataires, g&eacute;rer votre budget et organiser votre jour J.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#823F91] rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors shadow-md"
            >
              Cr&eacute;er mon compte gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
