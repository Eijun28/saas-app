'use client'

import { useState, useEffect, useRef } from 'react'
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
  const isEditingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Ne pas mettre à jour si l'utilisateur est en train de taper
    if (isEditingRef.current || isSaving) {
      return
    }
    
    const newName = currentName || '';
    
    console.log('🔄 BusinessNameEditor useEffect - currentName:', currentName, 'newName:', newName, 'initialName:', initialName, 'name:', name)
    
    // Mettre à jour uniquement si la valeur a vraiment changé depuis la DB
    if (newName !== initialName) {
      console.log('✅ Mise à jour BusinessNameEditor:', initialName, '->', newName)
      setName(newName);
      setInitialName(newName);
    }
  }, [currentName, isSaving, initialName]) // Ajouter initialName pour détecter les changements

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
      .select('nom_entreprise')
      .single()

    if (error) {
      console.error('Update error:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      
      // Message d'erreur plus détaillé pour aider au débogage
      let errorMessage = 'Erreur lors de la sauvegarde'
      if (error.code === '42703') {
        errorMessage = 'Erreur : La colonne "nom_entreprise" n\'existe pas dans la base de données. Veuillez contacter le support.'
      } else if (error.code === '42501') {
        errorMessage = 'Erreur : Vous n\'avez pas les permissions nécessaires pour modifier ce profil.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error('Erreur', {
        description: errorMessage,
      })
      setIsSaving(false)
      return
    }

    // Vérifier que les données ont bien été sauvegardées
    if (data && data.nom_entreprise) {
      const savedName = data.nom_entreprise.trim()
      setName(savedName)
      setInitialName(savedName)
      // Réinitialiser immédiatement pour permettre les mises à jour depuis props
      isEditingRef.current = false
      
      toast.success('Succès', {
        description: 'Nom d\'entreprise mis à jour',
      })
      
      // Attendre un peu avant de recharger pour s'assurer que la DB est à jour
      // Réduire à 300ms pour un affichage plus rapide
      setTimeout(() => {
        onSave?.()
      }, 300)
    } else {
      // Mettre à jour quand même l'état local
      const savedName = name.trim()
      setName(savedName)
      setInitialName(savedName)
      // Réinitialiser immédiatement pour permettre les mises à jour depuis props
      isEditingRef.current = false
      toast.success('Succès', {
        description: 'Nom d\'entreprise mis à jour',
      })
      setTimeout(() => {
        onSave?.()
      }, 500)
    }
    
    setIsSaving(false)
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
          ref={inputRef}
          id="nom_entreprise"
          placeholder="Ex: Studio Photo Mariage"
          value={name}
          onChange={(e) => {
            isEditingRef.current = true
            setName(e.target.value)
          }}
          onBlur={() => {
            // Attendre un peu avant de permettre les mises à jour depuis les props
            setTimeout(() => {
              isEditingRef.current = false
            }, 100)
          }}
          onFocus={() => {
            isEditingRef.current = true
          }}
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
