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
          <p className="mt-3 text-sm text-[#8B7866]">
            <span className="font-semibold text-[#4A3A2E]">{articles.length}</span> articles
          </p>
        </div>

        {/* ── Article à la une ── */}
        {articles.length > 0 && (
          <>
            {/* Section label */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-0.5 w-8 bg-[#823F91] rounded-full" />
              <span className="text-[11px] font-black tracking-[0.18em] text-[#823F91] uppercase">
                &Agrave; la une
              </span>
            </div>

            {/* Featured card */}
            <Link href={`/blog/${articles[0].slug}`} className="block group mb-12">
              <article
                className="relative bg-white overflow-hidden transition-all duration-300 group-hover:translate-y-[-2px]"
                style={{
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(130,63,145,0.08), 0 8px 32px rgba(130,63,145,0.06)',
                }}
              >
                {/* Top accent gradient bar */}
                <div className="h-1.5 bg-gradient-to-r from-[#823F91] via-[#a855c8] to-[#c081e3]" />

                <div className="bg-gradient-to-br from-[#823F91]/5 to-[#c081e3]/10 px-6 sm:px-10 py-8 sm:py-10">
                  {/* "Nouveau" badge + Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="inline-flex items-center text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full bg-[#823F91] text-white uppercase">
                      Nouveau
                    </span>
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
                  <p className="text-[#4A3A2E] text-base sm:text-lg mb-8 leading-relaxed max-w-3xl">
                    {articles[0].description}
                  </p>

                  {/* Meta + CTA */}
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
                    <span
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#823F91] text-white text-sm font-semibold group-hover:bg-[#6D3478] transition-colors"
                      style={{ boxShadow: '0 2px 8px rgba(130,63,145,0.3)' }}
                    >
                      Lire l&apos;article
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          </>
        )}

        {/* ── Autres articles ── */}
        {articles.length > 1 && (
          <>
            {/* Section divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-[#EBE4DA]" />
              <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#8B7866] whitespace-nowrap">
                {articles.length - 1} autre{articles.length - 1 > 1 ? 's' : ''} article{articles.length - 1 > 1 ? 's' : ''}
              </span>
              <div className="flex-1 h-px bg-[#EBE4DA]" />
            </div>

            {/* Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {articles.slice(1).map((article, index) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="block group"
                >
                  <article
                    className="relative bg-white overflow-hidden h-full flex flex-col transition-all duration-200 group-hover:translate-y-[-2px]"
                    style={{
                      borderRadius: '16px',
                      boxShadow: '0 1px 4px rgba(44,24,16,0.04), 0 4px 16px rgba(130,63,145,0.04)',
                    }}
                  >
                    {/* Large decorative article number */}
                    <span
                      className="absolute top-3 right-4 font-black text-[#EBE4DA] leading-none select-none pointer-events-none"
                      style={{ fontSize: '4.5rem', lineHeight: 1 }}
                      aria-hidden="true"
                    >
                      {String(index + 2).padStart(2, '0')}
                    </span>

                    <div className="p-6 flex flex-col h-full">
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
                      <h2 className="text-lg sm:text-xl font-bold text-[#2C1810] group-hover:text-[#823F91] transition-colors mb-2 leading-snug pr-14">
                        {article.title}
                      </h2>

                      {/* Description */}
                      <p className="text-[#4A3A2E] text-sm mb-4 line-clamp-2 flex-1">
                        {article.description}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #EBE4DA' }}>
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
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-br from-[#823F91] to-[#6D3478] p-8 sm:p-12 text-center text-white"
          style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(130,63,145,0.25)' }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Pr&ecirc;t &agrave; organiser votre mariage ?
          </h2>
          <p className="text-white/80 text-base sm:text-lg mb-6 max-w-xl mx-auto">
            Rejoignez NUPLY et trouvez les prestataires parfaits pour c&eacute;l&eacute;brer votre union, quelles que soient vos traditions.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#823F91] rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            Cr&eacute;er mon compte gratuitement
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
