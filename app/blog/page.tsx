import Link from 'next/link'
import { getAllArticles } from '@/lib/blog/articles'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

export default function BlogPage() {
  const articles = getAllArticles()

  return (
    <div className="min-h-screen bg-[#FBF8F3]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#823F91] mb-3">
            Blog NUPLY
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto">
            Conseils, tendances et guides pour organiser votre mariage sereinement
          </p>
        </div>

        {/* Articles list */}
        <div className="space-y-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="block group"
            >
              <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 sm:p-8">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {article.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#823F91]/10 text-[#823F91]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[#823F91] transition-colors mb-2">
                  {article.title}
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-2">
                  {article.description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
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
                  <span className="flex items-center gap-1 text-sm font-medium text-[#823F91] group-hover:gap-2 transition-all">
                    Lire
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
