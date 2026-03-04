'use client'

import { X, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PRESET_TAGS } from './RequestTags'

export interface DemandeFilters {
  search:    string
  tag:       string     // tag name ou ''
  budgetMin: string
  budgetMax: string
  dateFrom:  string
  dateTo:    string
}

export const DEFAULT_FILTERS: DemandeFilters = {
  search:    '',
  tag:       '',
  budgetMin: '',
  budgetMax: '',
  dateFrom:  '',
  dateTo:    '',
}

interface RequestFiltersProps {
  filters:    DemandeFilters
  onChange:   (f: DemandeFilters) => void
  open:       boolean
  onToggle:   () => void
  allTags:    string[]    // tags utilisés dans les demandes courantes
}

export function RequestFilters({ filters, onChange, open, onToggle, allTags }: RequestFiltersProps) {
  const hasActive = (
    filters.tag       !== '' ||
    filters.budgetMin !== '' ||
    filters.budgetMax !== '' ||
    filters.dateFrom  !== '' ||
    filters.dateTo    !== ''
  )

  const set = (key: keyof DemandeFilters) => (
    (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...filters, [key]: e.target.value })
  )

  const reset = () => onChange({ ...filters, tag: '', budgetMin: '', budgetMax: '', dateFrom: '', dateTo: '' })

  const usedTags = Array.from(new Set([...allTags, ...PRESET_TAGS.map(p => p.tag)]))

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className={cn(
            'h-9 rounded-xl gap-1.5 text-xs font-medium',
            (open || hasActive) && 'border-[#823F91]/40 text-[#823F91] bg-[#823F91]/5'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtres
          {hasActive && (
            <span className="ml-0.5 w-4 h-4 rounded-full bg-[#823F91] text-white text-[10px] font-bold flex items-center justify-center">
              !
            </span>
          )}
        </Button>
        {hasActive && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-4">

              {/* Tags */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Label</Label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => onChange({ ...filters, tag: '' })}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                      filters.tag === ''
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'text-gray-500 border-gray-200 hover:border-gray-400'
                    )}
                  >
                    Tous
                  </button>
                  {usedTags.map(t => {
                    const preset = PRESET_TAGS.find(p => p.tag === t)
                    const color  = preset?.color ?? '#823F91'
                    const active = filters.tag === t
                    return (
                      <button
                        key={t}
                        onClick={() => onChange({ ...filters, tag: active ? '' : t })}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold text-white transition-all hover:scale-105"
                        style={{ backgroundColor: active ? color : color + '80' }}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Budget + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget min (€)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.budgetMin}
                    onChange={set('budgetMin')}
                    className="h-8 text-sm rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget max (€)</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={filters.budgetMax}
                    onChange={set('budgetMax')}
                    className="h-8 text-sm rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date mariage — de</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={set('dateFrom')}
                    className="h-8 text-sm rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date mariage — à</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={set('dateTo')}
                    className="h-8 text-sm rounded-lg"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
