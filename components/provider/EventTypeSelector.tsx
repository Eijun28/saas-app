'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CulturalEventType {
  id: string
  slug: string
  label: string
  description: string | null
  culture_category_id: string
  icon: string | null
  display_order: number
}

interface EventTypeSelectorProps {
  userId: string
  onSave?: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  'maghrebin': 'Maghrebin',
  'indien': 'Indien',
  'pakistanais': 'Pakistanais',
  'turc': 'Turc',
  'africain': 'Africain',
  'antillais': 'Antillais',
  'asiatique': 'Asiatique',
  'moyen-orient': 'Moyen-Orient',
  'europeen': 'Europeen',
  'amerique-latine': 'Amerique latine',
  'universel': 'Universel',
}

export function EventTypeSelector({ userId, onSave }: EventTypeSelectorProps) {
  const [allEventTypes, setAllEventTypes] = useState<CulturalEventType[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [userId])

  async function loadData() {
    setIsLoading(true)
    const supabase = createClient()

    const [typesResult, selectedResult] = await Promise.all([
      supabase
        .from('cultural_event_types')
        .select('id, slug, label, description, culture_category_id, icon, display_order')
        .eq('is_active', true)
        .order('culture_category_id')
        .order('display_order'),
      supabase
        .from('provider_event_types')
        .select('event_type_id')
        .eq('profile_id', userId),
    ])

    if (typesResult.data) setAllEventTypes(typesResult.data)
    const ids = new Set((selectedResult.data || []).map(r => r.event_type_id))
    setSelectedIds(ids)
    setInitialIds(new Set(ids))
    setIsLoading(false)
  }

  function toggleEventType(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('provider_event_types')
        .delete()
        .eq('profile_id', userId)

      if (deleteError) throw deleteError

      if (selectedIds.size > 0) {
        const inserts = Array.from(selectedIds).map(id => ({
          profile_id: userId,
          event_type_id: id,
        }))
        const { error } = await supabase
          .from('provider_event_types')
          .insert(inserts)

        if (error) throw error
      }

      setInitialIds(new Set(selectedIds))
      toast.success('Types d\'evenements mis a jour')
      onSave?.()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setSelectedIds(new Set(initialIds))
  }

  const hasChanges = (() => {
    if (selectedIds.size !== initialIds.size) return true
    for (const id of selectedIds) if (!initialIds.has(id)) return true
    return false
  })()

  // Group by culture_category_id
  const grouped = allEventTypes.reduce<Record<string, CulturalEventType[]>>((acc, et) => {
    const key = et.culture_category_id
    if (!acc[key]) acc[key] = []
    acc[key].push(et)
    return acc
  }, {})

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selectionnez les types d'evenements que vous pouvez couvrir. Cela aide les couples a vous trouver pour des evenements specifiques (Henne, Sangeet, Nikah, etc.).
      </p>

      <div className="text-xs text-gray-500">
        {selectedIds.size} type{selectedIds.size > 1 ? 's' : ''} selectionne{selectedIds.size > 1 ? 's' : ''}
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([categoryId, types]) => (
          <div key={categoryId}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              {CATEGORY_LABELS[categoryId] || categoryId}
            </p>
            <div className="flex flex-wrap gap-2">
              {types.map(et => {
                const isSelected = selectedIds.has(et.id)
                return (
                  <button
                    key={et.id}
                    type="button"
                    onClick={() => toggleEventType(et.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150',
                      isSelected
                        ? 'bg-[#823F91]/10 border-[#823F91]/30 text-[#5C2B66]'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                    )}
                    title={et.description || undefined}
                  >
                    {et.label}
                    {isSelected && (
                      <X className="inline-block ml-1.5 h-3 w-3" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  )
}
