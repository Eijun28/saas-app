'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface BusinessNameEditorProps {
  userId: string
  currentName?: string
  onSave?: () => void
}

export function BusinessNameEditor({ userId, currentName = '', onSave }: BusinessNameEditorProps) {
  const [name, setName] = useState(currentName)
  const [initialName, setInitialName] = useState(currentName)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const newName = currentName || '';
    // Mettre à jour seulement si la valeur initiale a changé (données rechargées depuis la DB)
    // Cela évite d'écraser les modifications en cours de l'utilisateur
    if (initialName !== newName) {
      // Si l'utilisateur n'a pas fait de modifications locales, mettre à jour
      if (name === initialName) {
        setName(newName);
      }
      // Toujours mettre à jour la valeur initiale pour refléter l'état de la DB
      setInitialName(newName);
    }
  }, [currentName])

  const hasChanges = name.trim() !== initialName.trim()

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!name.trim()) {
      toast.error('Erreur', {
        description: 'Le nom d\'entreprise est obligatoire',
      })
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .update({ nom_entreprise: name.trim() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      toast.error('Erreur', {
        description: error.message || 'Erreur lors de la sauvegarde',
      })
      setIsSaving(false)
      return
    }

    setInitialName(name.trim())
    toast.success('Succès', {
      description: 'Nom d\'entreprise mis à jour',
    })
    setIsSaving(false)
    onSave?.()
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nom_entreprise">
          Nom de votre entreprise <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mb-3">
          Le nom qui apparaîtra sur votre profil public
        </p>
        <Input
          id="nom_entreprise"
          placeholder="Ex: Studio Photo Mariage"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {hasChanges && (
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              setName(initialName)
            }}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478]"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  )
}
