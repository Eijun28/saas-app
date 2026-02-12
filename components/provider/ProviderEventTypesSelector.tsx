'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Check, Calendar, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  CULTURAL_EVENTS_BY_CULTURE,
  type CulturalEventDefinition,
} from '@/lib/constants/cultural-events'

interface ProviderEventTypesSelectorProps {
  userId: string
  onSave?: () => void
}

export function ProviderEventTypesSelector({ userId, onSave }: ProviderEventTypesSelectorProps) {
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set())
  const [initialSlugs, setInitialSlugs] = useState<Set<string>>(new Set())
  const [providerCultureCategories, setProviderCultureCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Charger les cultures du prestataire pour prioriser les groupes pertinents
      const { data: cultures } = await supabase
        .from('provider_cultures')
        .select('culture_id')
        .eq('profile_id', userId)

      if (cultures) {
        const categories = [...new Set(cultures.map(c => c.culture_id))]
        setProviderCultureCategories(categories)
      }

      // Charger les event types déjà sélectionnés
      // On utilise le slug depuis cultural_event_types via jointure
      const { data: eventTypes } = await supabase
        .from('provider_event_types')
        .select('event_type_id, cultural_event_types(slug)')
        .eq('profile_id', userId)

      if (eventTypes) {
        const slugs = new Set(
          eventTypes
            .map((et: Record<string, unknown>) => {
              const joined = et.cultural_event_types as { slug: string } | null
              return joined?.slug
            })
            .filter(Boolean) as string[]
        )
        setSelectedSlugs(slugs)
        setInitialSlugs(new Set(slugs))
      }
    } catch (err) {
      console.error('Erreur chargement event types:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSlug = (slug: string) => {
    setSelectedSlugs(prev => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  const hasChanges = useMemo(() => {
    if (selectedSlugs.size !== initialSlugs.size) return true
    for (const slug of selectedSlugs) {
      if (!initialSlugs.has(slug)) return true
    }
    return false
  }, [selectedSlugs, initialSlugs])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    try {
      // Récupérer les IDs des event types par slug
      const slugArray = Array.from(selectedSlugs)
      const { data: eventTypes } = await supabase
        .from('cultural_event_types')
        .select('id, slug')
        .in('slug', slugArray.length > 0 ? slugArray : ['__none__'])

      const slugToId = new Map((eventTypes || []).map(et => [et.slug, et.id]))

      // Supprimer tous les anciens
      await supabase
        .from('provider_event_types')
        .delete()
        .eq('profile_id', userId)

      // Insérer les nouveaux
      if (selectedSlugs.size > 0) {
        const rows = Array.from(selectedSlugs)
          .map(slug => {
            const eventTypeId = slugToId.get(slug)
            if (!eventTypeId) return null
            return { profile_id: userId, event_type_id: eventTypeId }
          })
          .filter(Boolean)

        if (rows.length > 0) {
          const { error } = await supabase
            .from('provider_event_types')
            .insert(rows)

          if (error) throw error
        }
      }

      setInitialSlugs(new Set(selectedSlugs))
      toast.success('Événements mis à jour')
      onSave?.()
    } catch (err) {
      console.error('Erreur sauvegarde event types:', err)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // Groupes pertinents d'abord (basés sur les cultures du prestataire), puis les autres
  const sortedGroups = useMemo(() => {
    const relevant = CULTURAL_EVENTS_BY_CULTURE.filter(g =>
      providerCultureCategories.some(c => c.startsWith(g.cultureCategoryId) || g.cultureCategoryId === c)
    )
    const others = CULTURAL_EVENTS_BY_CULTURE.filter(g =>
      !relevant.includes(g)
    )
    return { relevant, others }
  }, [providerCultureCategories])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-[#823F91]" />
      </div>
    )
  }

  const renderEventGrid = (events: CulturalEventDefinition[], groupLabel: string) => (
    <div key={groupLabel} className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {groupLabel}
      </h4>
      <div className="flex flex-wrap gap-2">
        {events.map(event => {
          const isSelected = selectedSlugs.has(event.slug)
          return (
            <button
              key={event.slug}
              type="button"
              onClick={() => toggleSlug(event.slug)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border',
                isSelected
                  ? 'bg-[#823F91] text-white border-[#823F91]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#823F91]/40 hover:bg-[#823F91]/5'
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {event.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[#823F91]" />
        <h3 className="font-semibold text-sm sm:text-base text-gray-900">
          Événements que je couvre
        </h3>
      </div>
      <p className="text-xs text-gray-500">
        Sélectionnez les types d'événements pour lesquels vous proposez vos services.
        Les couples pourront vous trouver lorsqu'ils cherchent un prestataire pour ces événements spécifiques.
      </p>

      {/* Groupes pertinents (basés sur les cultures du prestataire) */}
      {sortedGroups.relevant.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-[#823F91]">
            Recommandés selon vos cultures
          </p>
          {sortedGroups.relevant.map(group =>
            renderEventGrid(group.events, group.cultureLabel)
          )}
        </div>
      )}

      {/* Événements universels toujours visibles */}
      {CULTURAL_EVENTS_BY_CULTURE.filter(g => g.cultureCategoryId === 'universel').map(group =>
        renderEventGrid(group.events, group.cultureLabel)
      )}

      {/* Autres groupes (collapsés) */}
      {sortedGroups.others.filter(g => g.cultureCategoryId !== 'universel').length > 0 && (
        <details className="group">
          <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-[#823F91] transition-colors">
            Voir tous les événements culturels
          </summary>
          <div className="mt-3 space-y-4">
            {sortedGroups.others
              .filter(g => g.cultureCategoryId !== 'universel')
              .map(group => renderEventGrid(group.events, group.cultureLabel))}
          </div>
        </details>
      )}

      {/* Compteur + Bouton sauvegarder */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {selectedSlugs.size} événement{selectedSlugs.size > 1 ? 's' : ''} sélectionné{selectedSlugs.size > 1 ? 's' : ''}
        </span>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="bg-[#823F91] hover:bg-[#6D3478] text-white"
          size="sm"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  )
}
