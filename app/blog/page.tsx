import Link from 'next/link'
import { getAllArticles } from '@/lib/blog/articles'
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react'

export default function BlogPage() {
  const articles = getAllArticles()

  return (
    <div className="min-h-screen bg-[#FBF8F3]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Hero Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#823F91]/10 text-[#823F91] text-sm font-medium mb-5">
            <BookOpen className="h-4 w-4" />
            Le blog NUPLY
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2C1810] mb-4">
            Conseils &amp; inspirations pour votre <span className="text-[#823F91]">mariage</span>
          </h1>
          <p className="text-base sm:text-lg text-[#8B7866] max-w-2xl mx-auto leading-relaxed">
            Guides pratiques, tendances et astuces pour organiser le mariage de vos r&ecirc;ves, en c&eacute;l&eacute;brant toutes les cultures.
          </p>
        </div>

        {/* Featured article (premier article) */}
        {articles.length > 0 && (
          <Link
            href={`/blog/${articles[0].slug}`}
            className="block group mb-10"
          >
            <article className="bg-white rounded-2xl border border-[#EBE4DA] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-br from-[#823F91]/5 to-[#c081e3]/10 px-6 sm:px-10 py-8 sm:py-10">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {articles[0].tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-[#823F91]/15 text-[#823F91]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-[#2C1810] group-hover:text-[#823F91] transition-colors mb-3 leading-tight">
                  {articles[0].title}
                </h2>

                {/* Description */}
                <p className="text-[#4A3A2E] text-base sm:text-lg mb-6 leading-relaxed max-w-3xl">
                  {articles[0].description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 text-sm text-[#8B7866]">
                    <span className="font-medium text-[#4A3A2E]">{articles[0].author}</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(articles[0].publishedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {articles[0].readingTime}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-[#823F91] group-hover:gap-2.5 transition-all">
                    Lire l&apos;article
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Remaining articles grid */}
        {articles.length > 1 && (
          <div className="grid sm:grid-cols-2 gap-6">
            {articles.slice(1).map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="block group"
              >
                <article className="bg-white rounded-2xl border border-[#EBE4DA] shadow-sm hover:shadow-md transition-all duration-300 p-6 h-full flex flex-col">
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
                  <h2 className="text-lg sm:text-xl font-bold text-[#2C1810] group-hover:text-[#823F91] transition-colors mb-2 leading-snug">
                    {article.title}
                  </h2>

                  {/* Description */}
                  <p className="text-[#4A3A2E] text-sm mb-4 line-clamp-2 flex-1">
                    {article.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#EBE4DA]">
                    <div className="flex items-center gap-3 text-xs text-[#8B7866]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readingTime}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#823F91] group-hover:gap-1.5 transition-all">
                      Lire
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-br from-[#823F91] to-[#6D3478] rounded-2xl p-8 sm:p-12 text-center text-white shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Pr&ecirc;t &agrave; organiser votre mariage ?
          </h2>
          <p className="text-white/80 text-base sm:text-lg mb-6 max-w-xl mx-auto">
            Rejoignez NUPLY et trouvez les prestataires parfaits pour c&eacute;l&eacute;brer votre union, quelles que soient vos traditions.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#823F91] rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors shadow-md"
          >
            Cr&eacute;er mon compte gratuitement
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
