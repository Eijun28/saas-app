'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ProfessionalInfoEditorProps {
  userId: string
  currentBudgetMin?: number
  currentBudgetMax?: number
  currentExperience?: number
  currentVille?: string
  onSave?: () => void
}

export function ProfessionalInfoEditor({
  userId,
  currentBudgetMin,
  currentBudgetMax,
  currentExperience,
  currentVille,
  onSave,
}: ProfessionalInfoEditorProps) {
  const [budgetMin, setBudgetMin] = useState(currentBudgetMin?.toString() || '')
  const [budgetMax, setBudgetMax] = useState(currentBudgetMax?.toString() || '')
  const [experience, setExperience] = useState(currentExperience?.toString() || '')
  const [ville, setVille] = useState(currentVille || '')
  const [initialData, setInitialData] = useState({ budgetMin: '', budgetMax: '', experience: '', ville: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const newData = {
      budgetMin: currentBudgetMin?.toString() || '',
      budgetMax: currentBudgetMax?.toString() || '',
      experience: currentExperience?.toString() || '',
      ville: currentVille || '',
    }
    
    console.log('🔄 ProfessionalInfoEditor useEffect - current props:', {
      currentBudgetMin,
      currentBudgetMax,
      currentExperience,
      currentVille
    }, 'newData:', newData, 'current state:', { budgetMin, budgetMax, experience, ville });
    
    // Toujours mettre à jour les valeurs pour refléter l'état de la DB
    // Cela garantit que les données sauvegardées s'affichent correctement
    if (newData.budgetMin !== budgetMin) {
      console.log('✅ Mise à jour budgetMin:', budgetMin, '->', newData.budgetMin);
      setBudgetMin(newData.budgetMin)
    }
    if (newData.budgetMax !== budgetMax) {
      console.log('✅ Mise à jour budgetMax:', budgetMax, '->', newData.budgetMax);
      setBudgetMax(newData.budgetMax)
    }
    if (newData.experience !== experience) {
      console.log('✅ Mise à jour experience:', experience, '->', newData.experience);
      setExperience(newData.experience)
    }
    if (newData.ville !== ville) {
      console.log('✅ Mise à jour ville:', ville, '->', newData.ville);
      setVille(newData.ville)
    }
    
    // Toujours mettre à jour les valeurs initiales pour refléter l'état de la DB
    setInitialData(newData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBudgetMin, currentBudgetMax, currentExperience, currentVille])

  const hasChanges =
    budgetMin !== initialData.budgetMin ||
    budgetMax !== initialData.budgetMax ||
    experience !== initialData.experience ||
    ville !== initialData.ville

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const minBudget = budgetMin ? parseInt(budgetMin) : null
    const maxBudget = budgetMax ? parseInt(budgetMax) : null
    const yearsExp = experience ? parseInt(experience) : null

    if (minBudget && maxBudget && minBudget > maxBudget) {
      toast.error('Erreur', {
        description: 'Le budget minimum ne peut pas être supérieur au maximum',
      })
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .update({
        budget_min: minBudget,
        budget_max: maxBudget,
        annees_experience: yearsExp,
        ville_principale: ville.trim() || null,
      })
      .eq('id', userId)
      .select('budget_min, budget_max, annees_experience, ville_principale')
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
        errorMessage = 'Erreur : Une ou plusieurs colonnes n\'existent pas dans la base de données. Veuillez contacter le support.'
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

    // Mettre à jour l'état local avec les données retournées
    if (data) {
      console.log('✅ Données sauvegardées avec succès:', data)
      const savedData = {
        budgetMin: data.budget_min?.toString() || '',
        budgetMax: data.budget_max?.toString() || '',
        experience: data.annees_experience?.toString() || '',
        ville: data.ville_principale || '',
      }
      setBudgetMin(savedData.budgetMin)
      setBudgetMax(savedData.budgetMax)
      setExperience(savedData.experience)
      setVille(savedData.ville)
      setInitialData(savedData)
    } else {
      // Fallback : utiliser les valeurs locales
      setInitialData({ budgetMin, budgetMax, experience, ville })
    }
    
    toast.success('Succès', {
      description: 'Informations mises à jour',
    })
    setIsSaving(false)
    
    // Attendre un peu avant de recharger pour s'assurer que la DB est à jour
    setTimeout(() => {
      onSave?.()
    }, 200)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="ville">Ville principale</Label>
        <p className="text-sm text-muted-foreground">Où êtes-vous basé(e) ?</p>
        <Input
          id="ville"
          placeholder="Ex: Paris, Lyon, Marseille"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Fourchette de prix</Label>
        <p className="text-sm text-muted-foreground">Indiquez vos tarifs pour donner une idée aux couples</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget_min" className="text-xs text-muted-foreground">
              Minimum (€)
            </Label>
            <Input
              id="budget_min"
              type="number"
              placeholder="3000"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="budget_max" className="text-xs text-muted-foreground">
              Maximum (€)
            </Label>
            <Input
              id="budget_max"
              type="number"
              placeholder="8000"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience">Années d'expérience</Label>
        <p className="text-sm text-muted-foreground">Combien d'années dans ce domaine ?</p>
        <Input
          id="experience"
          type="number"
          placeholder="10"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          min="0"
          max="50"
        />
      </div>

      {hasChanges && (
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              setBudgetMin(initialData.budgetMin)
              setBudgetMax(initialData.budgetMax)
              setExperience(initialData.experience)
              setVille(initialData.ville)
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
