'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface RequestTag {
  id: string
  tag: string
  color: string
}

// Tags prédéfinis avec couleur
export const PRESET_TAGS: { tag: string; color: string }[] = [
  { tag: 'Chaud',         color: '#ef4444' },
  { tag: 'Budget serré',  color: '#f59e0b' },
  { tag: 'Relancer',      color: '#f97316' },
  { tag: 'Prioritaire',   color: '#823F91' },
  { tag: 'VIP',           color: '#8b5cf6' },
  { tag: 'En attente',    color: '#6b7280' },
  { tag: 'Perdu',         color: '#dc2626' },
  { tag: 'Potentiel',     color: '#10b981' },
]

interface RequestTagsProps {
  requestId: string
  tags: RequestTag[]
  onChange: (tags: RequestTag[]) => void
}

export function RequestTags({ requestId, tags, onChange }: RequestTagsProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [adding, setAdding] = useState(false)

  const existingTagNames = new Set(tags.map(t => t.tag))

  const handleAdd = async (preset: { tag: string; color: string }) => {
    if (existingTagNames.has(preset.tag)) return
    setAdding(true)
    try {
      const res = await fetch(`/api/prestataire/requests/${requestId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Erreur')
        return
      }
      onChange([...tags, json.tag])
      setShowPicker(false)
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (tagId: string) => {
    try {
      await fetch(`/api/prestataire/requests/${requestId}/tags?tagId=${tagId}`, { method: 'DELETE' })
      onChange(tags.filter(t => t.id !== tagId))
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {tags.map(tag => (
          <span
            key={tag.id}
            className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.tag}
            <button
              onClick={() => handleRemove(tag.id)}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label={`Retirer ${tag.tag}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => setShowPicker(p => !p)}
          disabled={adding}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-dashed border-gray-300 text-gray-400 hover:border-[#823F91] hover:text-[#823F91] transition-colors"
        >
          <Plus className="h-3 w-3" />
          Ajouter
        </button>
      </div>

      {showPicker && (
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
          {PRESET_TAGS.map(preset => {
            const used = existingTagNames.has(preset.tag)
            return (
              <button
                key={preset.tag}
                type="button"
                onClick={() => !used && handleAdd(preset)}
                disabled={used || adding}
                className={cn(
                  'px-2 py-0.5 rounded-full text-[11px] font-semibold text-white transition-all',
                  used ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 hover:shadow-sm'
                )}
                style={{ backgroundColor: preset.color }}
              >
                {preset.tag}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Version compacte pour affichage dans les cartes ──────────────────────────

export function TagPills({ tags, max = 3 }: { tags: RequestTag[]; max?: number }) {
  if (!tags.length) return null
  const shown = tags.slice(0, max)
  const rest  = tags.length - max
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(tag => (
        <span
          key={tag.id}
          className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.tag}
        </span>
      ))}
      {rest > 0 && (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
          +{rest}
        </span>
      )}
    </div>
  )
}
