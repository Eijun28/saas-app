'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Check, Save } from 'lucide-react'

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ru', label: 'Русский' },
]

// Service types for which capacity matters
const CAPACITY_RELEVANT_TYPES = [
  'traiteur',
  'salle_reception',
  'dj',
  'orchestre',
  'location_materiel',
  'animation',
]

interface LanguagesCapacityEditorProps {
  userId: string
  serviceType?: string
  initialLanguages?: string[]
  initialCapacityMin?: number | null
  initialCapacityMax?: number | null
  onSave?: () => void
}

export function LanguagesCapacityEditor({
  userId,
  serviceType,
  initialLanguages = [],
  initialCapacityMin,
  initialCapacityMax,
  onSave,
}: LanguagesCapacityEditorProps) {
  const supabase = createClient()
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialLanguages)
  const [capacityMin, setCapacityMin] = useState<string>(initialCapacityMin?.toString() ?? '')
  const [capacityMax, setCapacityMax] = useState<string>(initialCapacityMax?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showCapacity = serviceType && CAPACITY_RELEVANT_TYPES.includes(serviceType)

  useEffect(() => {
    setSelectedLanguages(initialLanguages)
    setCapacityMin(initialCapacityMin?.toString() ?? '')
    setCapacityMax(initialCapacityMax?.toString() ?? '')
  }, [initialLanguages, initialCapacityMin, initialCapacityMax])

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    )
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const update: Record<string, unknown> = {
      languages: selectedLanguages,
    }

    if (showCapacity) {
      update.guest_capacity_min = capacityMin ? parseInt(capacityMin, 10) : null
      update.guest_capacity_max = capacityMax ? parseInt(capacityMax, 10) : null
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', userId)

    setSaving(false)

    if (updateError) {
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.')
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    onSave?.()
  }

  return (
    <div className="space-y-6">
      {/* Languages */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-3 block">
          Langues parlées
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          Sélectionnez les langues dans lesquelles vous pouvez travailler avec les couples.
        </p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(({ code, label }) => {
            const selected = selectedLanguages.includes(code)
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleLanguage(code)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                  selected
                    ? 'bg-[#823F91] border-[#823F91] text-white'
                    : 'border-gray-200 text-gray-700 hover:border-[#823F91] hover:text-[#823F91]'
                )}
              >
                {selected && <Check className="h-3.5 w-3.5" />}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Capacity (conditional) */}
      {showCapacity && (
        <div>
          <Label className="text-sm font-medium text-foreground mb-3 block">
            Capacité d'accueil (nombre de personnes)
          </Label>
          <p className="text-xs text-muted-foreground mb-3">
            Indiquez le nombre minimum et maximum de personnes que vous pouvez accueillir.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Minimum</Label>
              <Input
                type="number"
                min={1}
                max={10000}
                placeholder="ex: 50"
                value={capacityMin}
                onChange={e => {
                  setCapacityMin(e.target.value)
                  setSaved(false)
                }}
              />
            </div>
            <span className="text-muted-foreground mt-5">—</span>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Maximum</Label>
              <Input
                type="number"
                min={1}
                max={10000}
                placeholder="ex: 300"
                value={capacityMax}
                onChange={e => {
                  setCapacityMax(e.target.value)
                  setSaved(false)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          'flex items-center gap-2',
          saved
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-[#823F91] hover:bg-[#6D3478]'
        )}
      >
        {saved ? (
          <>
            <Check className="h-4 w-4" />
            Sauvegardé
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </>
        )}
      </Button>
    </div>
  )
}
