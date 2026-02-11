'use client'

import { motion } from 'framer-motion'
import { Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CulturalEventDefinition } from '@/lib/constants/cultural-events'

interface EventSuggestionsProps {
  suggestions: CulturalEventDefinition[]
  existingEventSlugs: Set<string>
  cultureLabel: string
  onAddSuggestion: (event: CulturalEventDefinition) => void
}

export function EventSuggestions({
  suggestions,
  existingEventSlugs,
  cultureLabel,
  onAddSuggestion,
}: EventSuggestionsProps) {
  const availableSuggestions = suggestions.filter(s => !existingEventSlugs.has(s.slug))

  if (availableSuggestions.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl border border-[#823F91]/20 bg-[#823F91]/5 p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[#823F91]" />
        <h3 className="text-sm font-semibold text-[#823F91]">
          Événements suggérés — {cultureLabel}
        </h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Basé sur vos traditions culturelles, voici les événements que vous pourriez organiser :
      </p>
      <div className="flex flex-wrap gap-2">
        {availableSuggestions.map((event) => (
          <Button
            key={event.slug}
            variant="outline"
            size="sm"
            className="h-8 text-xs border-[#823F91]/30 text-[#823F91] hover:bg-[#823F91]/10 hover:border-[#823F91]/50"
            onClick={() => onAddSuggestion(event)}
          >
            <Plus className="h-3 w-3 mr-1" />
            {event.label}
          </Button>
        ))}
      </div>
    </motion.div>
  )
}
