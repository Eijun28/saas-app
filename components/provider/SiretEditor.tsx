'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'

interface SiretEditorProps {
  userId: string
  currentSiret?: string
  onSave?: () => void
}

export function SiretEditor({ userId, currentSiret = '', onSave }: SiretEditorProps) {
  const [siret, setSiret] = useState(currentSiret)
  const [initialSiret, setInitialSiret] = useState(currentSiret)
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

  // Format SIRET for display (### ### ### #####)
  const formatSiret = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    return digits
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const trimmedSiret = siret.trim().replace(/\s/g, '')

    // If not empty, validate format (14 digits)
    if (trimmedSiret && !/^\d{14}$/.test(trimmedSiret)) {
      toast.error('Erreur', {
        description: 'Le SIRET doit contenir exactement 14 chiffres',
      })
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    // Check if banking_info row exists
    const { data: existing } = await supabase
      .from('prestataire_banking_info')
      .select('id')
      .eq('prestataire_id', userId)
      .maybeSingle()

    let error
    if (existing) {
      // Update existing row
      const result = await supabase
        .from('prestataire_banking_info')
        .update({ siret: trimmedSiret || null })
        .eq('prestataire_id', userId)
      error = result.error
    } else {
      // Insert new row
      const result = await supabase
        .from('prestataire_banking_info')
        .insert({ prestataire_id: userId, siret: trimmedSiret || null })
      error = result.error
    }

    if (error) {
      console.error('SIRET update error:', error)
      toast.error('Erreur', {
        description: 'Erreur lors de la sauvegarde du SIRET',
      })
      setIsSaving(false)
      return
    }

    const savedSiret = trimmedSiret
    setSiret(savedSiret)
    setInitialSiret(savedSiret)
    isEditingRef.current = false

    toast.success('Succès', {
      description: trimmedSiret ? 'SIRET mis à jour — badge Professionnel activé !' : 'SIRET supprimé',
    })

    setTimeout(() => {
      onSave?.()
    }, 300)

    setIsSaving(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Label htmlFor="siret">
            Numéro SIRET
          </Label>
          {initialSiret && (
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
          placeholder="Ex: 12345678901234"
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
          maxLength={14}
        />
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
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478]"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  )
}
