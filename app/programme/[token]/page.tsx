import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CalendarDays, MapPin, User, Clock } from 'lucide-react'
import type { ProgramItem, ProgramCategory } from '@/types/wedding-day-program'
import { formatTime, getDuration, CATEGORY_LABELS, CATEGORY_COLORS, sortProgramItems } from '@/types/wedding-day-program'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CategoryPill({ category }: { category: ProgramCategory }) {
  const colors = CATEGORY_COLORS[category]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
      {CATEGORY_LABELS[category]}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicProgramPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // Find couple by share token
  const { data: couple } = await supabase
    .from('couples')
    .select('id, partner_1_name, partner_2_name, wedding_date')
    .eq('share_token', token)
    .single()

  if (!couple) notFound()

  // Fetch program items
  const { data: rawItems } = await supabase
    .from('wedding_day_program')
    .select('*')
    .eq('couple_id', couple.id)
    .eq('is_public', true)
    .order('start_time', { ascending: true })
    .order('sort_order', { ascending: true })

  const items: ProgramItem[] = sortProgramItems((rawItems ?? []) as ProgramItem[])

  const weddingDateStr = couple.wedding_date
    ? new Date(couple.wedding_date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const coupleNames = [couple.partner_1_name, couple.partner_2_name].filter(Boolean).join(' & ')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0F7] via-white to-[#E8D4EF]/20 print:bg-white">
      <div className="max-w-2xl mx-auto px-4 py-10 print:py-4">

        {/* Header */}
        <header className="text-center mb-10 print:mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#823F91]/10 mb-4 print:hidden">
            <CalendarDays className="h-7 w-7 text-[#823F91]" />
          </div>
          {coupleNames && (
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {coupleNames}
            </h1>
          )}
          {weddingDateStr && (
            <p className="text-base text-[#823F91] font-semibold mt-1 capitalize">{weddingDateStr}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">Programme du Jour J</p>
          <div className="w-16 h-px bg-[#823F91]/30 mx-auto mt-4" />
        </header>

        {/* Timeline */}
        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aucun créneau public pour le moment.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-[#823F91]/10 hidden sm:block print:block" />

            <div className="space-y-2">
              {items.map((item) => {
                const colors = CATEGORY_COLORS[item.category]
                const duration = getDuration(item.start_time, item.end_time)
                return (
                  <div key={item.id} className="flex gap-4 items-start">
                    {/* Time column */}
                    <div className="hidden sm:flex flex-col items-end w-[80px] flex-shrink-0 pt-3 print:flex">
                      <span className="text-[13px] font-bold text-gray-700 tabular-nums">
                        {formatTime(item.start_time)}
                      </span>
                      {item.end_time && (
                        <span className="text-[11px] text-gray-400 tabular-nums">
                          → {formatTime(item.end_time)}
                        </span>
                      )}
                    </div>

                    {/* Dot */}
                    <div className="hidden sm:flex flex-col items-center flex-shrink-0 pt-3.5 print:flex">
                      <div className={`h-3 w-3 rounded-full ring-2 ring-white shadow-sm ${colors.dot}`} />
                    </div>

                    {/* Card */}
                    <div className={`flex-1 rounded-2xl border p-4 bg-white ${colors.border} print:rounded-lg print:p-3`}>
                      {/* Mobile time */}
                      <div className="flex items-center gap-2 sm:hidden mb-1.5 print:hidden">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-[12px] text-gray-500 tabular-nums font-medium">
                          {formatTime(item.start_time)}
                          {item.end_time && ` → ${formatTime(item.end_time)}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[14px] font-semibold text-gray-900 leading-tight">{item.title}</h3>
                        <CategoryPill category={item.category} />
                        {duration && (
                          <span className="text-[11px] text-gray-400 font-medium">{duration}</span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">{item.description}</p>
                      )}

                      {(item.location || item.responsible) && (
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {item.location && (
                            <div className="flex items-center gap-1 text-[12px] text-gray-400">
                              <MapPin className="h-3 w-3" />
                              <span>{item.location}</span>
                            </div>
                          )}
                          {item.responsible && (
                            <div className="flex items-center gap-1 text-[12px] text-gray-400">
                              <User className="h-3 w-3" />
                              <span>{item.responsible}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-gray-400 print:mt-6">
          Généré avec Nuply · nuply.fr
        </footer>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: couple } = await supabase
    .from('couples')
    .select('partner_1_name, partner_2_name, wedding_date')
    .eq('share_token', token)
    .single()

  if (!couple) return { title: 'Programme introuvable' }

  const names = [couple.partner_1_name, couple.partner_2_name].filter(Boolean).join(' & ')
  return {
    title: `Programme du mariage de ${names || 'nos époux'}`,
    description: 'Programme du Jour J partagé avec vous',
  }
}
