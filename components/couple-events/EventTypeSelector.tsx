'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Search, Sparkles, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  CULTURAL_EVENTS_BY_CULTURE,
  getSuggestedEvents,
  type CulturalEventDefinition,
  type CultureEventGroup,
} from '@/lib/constants/cultural-events'

interface EventTypeSelectorProps {
  /** Culture category IDs du couple (ex: ['maghrebin', 'indien']) */
  coupleCultureCategories: string[]
  /** Slugs des événements déjà ajoutés par le couple */
  existingEventSlugs: Set<string>
  /** Callback quand un type est sélectionné */
  onSelect: (event: CulturalEventDefinition, group: CultureEventGroup) => void
  /** Callback pour un événement personnalisé */
  onCustom: () => void
}

export function EventTypeSelector({
  coupleCultureCategories,
  existingEventSlugs,
  onSelect,
  onCustom,
}: EventTypeSelectorProps) {
  const [search, setSearch] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Événements suggérés en priorité (basés sur la culture du couple)
  const suggestedEvents = useMemo(
    () => getSuggestedEvents(coupleCultureCategories),
    [coupleCultureCategories]
  )

  // Filtrage par recherche
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return CULTURAL_EVENTS_BY_CULTURE
    const q = search.toLowerCase()
    return CULTURAL_EVENTS_BY_CULTURE.map(group => ({
      ...group,
      events: group.events.filter(
        e => e.label.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      ),
    })).filter(group => group.events.length > 0)
  }, [search])

  const hasSuggestions = coupleCultureCategories.length > 0 && suggestedEvents.length > 0

  return (
    <div className="space-y-4">
      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un type d'événement..."
          className="pl-9"
        />
      </div>

      {/* Suggestions basées sur la culture (si pas de recherche active) */}
      {!search.trim() && hasSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-[#823F91]/20 bg-[#823F91]/5 p-3"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="h-4 w-4 text-[#823F91]" />
            <span className="text-sm font-semibold text-[#823F91]">
              Suggérés pour vous
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {suggestedEvents.map(event => {
              const alreadyAdded = existingEventSlugs.has(event.slug)
              const group = CULTURAL_EVENTS_BY_CULTURE.find(g =>
                g.events.some(e => e.slug === event.slug)
              )!
              return (
                <button
                  key={event.slug}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => onSelect(event, group)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
                    alreadyAdded
                      ? 'opacity-50 cursor-not-allowed bg-gray-50'
                      : 'hover:bg-[#823F91]/10 cursor-pointer'
                  )}
                >
                  <span className="flex-1 font-medium text-gray-800">
                    {event.label}
                  </span>
                  {alreadyAdded && (
                    <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Toutes les catégories */}
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {filteredGroups.map(group => (
          <div key={group.cultureCategoryId} className="rounded-lg border border-gray-100">
            <button
              type="button"
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === group.cultureCategoryId ? null : group.cultureCategoryId
                )
              }
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span>{group.cultureLabel}</span>
              <span className="text-xs text-gray-400">
                {group.events.length} événement{group.events.length > 1 ? 's' : ''}
              </span>
            </button>

            <AnimatePresence>
              {(expandedCategory === group.cultureCategoryId || search.trim()) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-2 pb-2 space-y-0.5">
                    {group.events.map(event => {
                      const alreadyAdded = existingEventSlugs.has(event.slug)
                      return (
                        <button
                          key={event.slug}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => onSelect(event, group)}
                          className={cn(
                            'w-full flex items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors',
                            alreadyAdded
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-[#823F91]/5 cursor-pointer'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{event.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {event.description}
                            </p>
                          </div>
                          {alreadyAdded && (
                            <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Événement personnalisé */}
      <button
        type="button"
        onClick={onCustom}
        className="w-full flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm text-gray-600 hover:border-[#823F91]/40 hover:text-[#823F91] transition-colors"
      >
        <Plus className="h-4 w-4" />
        Créer un événement personnalisé
      </button>
    </div>
  )
}
