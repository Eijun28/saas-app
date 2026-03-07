'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CulturalEventType {
  id: string
  slug: string
  label: string
  description: string | null
  culture_category_id: string
  icon: string | null
  display_order: number
}

const CATEGORY_LABELS: Record<string, string> = {
  'maghrebin': 'Maghrébin',
  'indien': 'Indien',
  'pakistanais': 'Pakistanais',
  'turc': 'Turc',
  'africain': 'Africain',
  'antillais': 'Antillais',
  'asiatique': 'Asiatique',
  'moyen-orient': 'Moyen-Orient',
  'europeen': 'Européen',
  'amerique-latine': 'Amérique latine',
  'universel': 'Universel',
}

interface EventTypeSelectorProps {
  userId: string
  onSave?: () => void
}

export function EventTypeSelector({ userId, onSave }: EventTypeSelectorProps) {
  const [allEventTypes, setAllEventTypes] = useState<CulturalEventType[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [typesResult, selectedResult] = await Promise.all([
        supabase
          .from('cultural_event_types')
          .select('id, slug, label, description, culture_category_id, icon, display_order')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('provider_event_types')
          .select('event_type_id')
          .eq('profile_id', userId),
      ])

      if (typesResult.data) {
        setAllEventTypes(typesResult.data)
      }
      if (selectedResult.data) {
        setSelectedIds(new Set(selectedResult.data.map(r => r.event_type_id)))
      }
      setIsLoading(false)
    }
    load()
  }, [userId])

  function toggleEventType(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const supabase = createClient()

      // Delete existing selections
      await supabase.from('provider_event_types').delete().eq('profile_id', userId)

      // Insert new selections
      if (selectedIds.size > 0) {
        const inserts = Array.from(selectedIds).map(event_type_id => ({
          profile_id: userId,
          event_type_id,
        }))
        const { error } = await supabase.from('provider_event_types').insert(inserts)
        if (error) throw error
      }

      toast.success("Types d'événements sauvegardés")
      onSave?.()
    } catch (error) {
      console.error('Save event types error:', error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 rounded-full border-2 border-[#823F91] border-t-transparent animate-spin" />
      </div>
    )
  }

  // Group by category
  const grouped = allEventTypes.reduce<Record<string, CulturalEventType[]>>((acc, et) => {
    const cat = et.culture_category_id
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(et)
    return acc
  }, {})

  // Sort categories by the order they appear in CATEGORY_LABELS
  const orderedCategories = Object.keys(CATEGORY_LABELS).filter(k => grouped[k])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Sélectionnez les types d'événements que vous couvrez pour améliorer votre visibilité auprès des couples.
      </p>

      <div className="space-y-4">
        {orderedCategories.map(catId => (
          <div key={catId}>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {CATEGORY_LABELS[catId] || catId}
            </h3>
            <div className="flex flex-wrap gap-2">
              {grouped[catId].map(et => {
                const isSelected = selectedIds.has(et.id)
                return (
                  <button
                    key={et.id}
                    type="button"
                    onClick={() => toggleEventType(et.id)}
                    title={et.description || undefined}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                      isSelected
                        ? 'bg-[#823F91] text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#823F91]/30 hover:text-[#823F91]'
                    )}
                  >
                    {et.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {selectedIds.size} type{selectedIds.size !== 1 ? 's' : ''} sélectionné{selectedIds.size !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#823F91] hover:bg-[#6D3478] text-white"
        >
          {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  )
}
