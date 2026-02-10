'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Hash, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SiretEditorProps {
  userId: string
  currentSiret?: string | null
  onSave?: () => void
}

export function SiretEditor({ userId, currentSiret = '', onSave }: SiretEditorProps) {
  const [siret, setSiret] = useState(currentSiret || '')
  const [initialSiret, setInitialSiret] = useState(currentSiret || '')
  const [isSaving, setIsSaving] = useState(false)
  const isEditingRef = useRef(false)

  useEffect(() => {
    if (isEditingRef.current || isSaving) return
    const newSiret = currentSiret || ''
    if (newSiret !== initialSiret) {
      setSiret(newSiret)
      setInitialSiret(newSiret)
    }
  }, [currentSiret, isSaving, initialSiret])

  const hasChanges = siret.trim() !== initialSiret.trim()

  // Formater le SIRET (XXX XXX XXX XXXXX)
  const formatSiret = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  }

  const isValidSiret = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.length === 14
  }

  const hasSavedSiret = initialSiret && isValidSiret(initialSiret)

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const cleanSiret = siret.replace(/\D/g, '')

    if (cleanSiret && !isValidSiret(siret)) {
      toast.error('Le numéro SIRET doit contenir exactement 14 chiffres')
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({ siret: cleanSiret || null })
      .eq('id', userId)

    if (error) {
      console.error('Erreur sauvegarde SIRET:', error)
      toast.error('Erreur lors de la sauvegarde du SIRET')
      setIsSaving(false)
      return
    }

    const savedSiret = cleanSiret ? formatSiret(cleanSiret) : ''
    setSiret(savedSiret)
    setInitialSiret(savedSiret)
    isEditingRef.current = false

    toast.success(cleanSiret ? 'SIRET enregistré — badge Professionnel activé !' : 'SIRET supprimé')
    setTimeout(() => {
      onSave?.()
    }, 300)

    setIsSaving(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Label htmlFor="siret" className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-[#823F91]" />
            Numéro de SIRET
          </Label>
          {hasSavedSiret && (
            <Badge className="text-[10px] px-2 py-0 bg-emerald-100 text-emerald-700 border-0 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Professionnel
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Optionnel — Ajouter votre SIRET active le badge &quot;Prestataire Professionnel&quot; sur votre profil
        </p>
        <Input
          id="siret"
          placeholder="123 456 789 00012"
          value={siret}
          onChange={(e) => {
            isEditingRef.current = true
            setSiret(formatSiret(e.target.value))
          }}
          onBlur={() => {
            setTimeout(() => {
              isEditingRef.current = false
            }, 100)
          }}
          onFocus={() => {
            isEditingRef.current = true
          }}
          maxLength={17}
        />
        {siret && !isValidSiret(siret) && (
          <p className="text-xs text-amber-600 mt-1">
            Le SIRET doit contenir 14 chiffres ({siret.replace(/\D/g, '').length}/14)
          </p>
        )}
      </div>

      {hasChanges && (
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              setSiret(initialSiret)
            }}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  )
}
