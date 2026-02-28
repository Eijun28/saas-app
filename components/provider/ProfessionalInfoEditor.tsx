'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CityAutocompleteInput } from '@/components/provider/CityAutocompleteInput'
import { getServiceTypeLabel, SERVICE_CATEGORIES, SERVICE_TYPES } from '@/lib/constants/service-types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfessionalInfoEditorProps {
  userId: string
  currentBudgetMin?: number
  currentBudgetMax?: number
  currentExperience?: number
  currentVille?: string
  currentServiceType?: string
  onSave?: () => void
}

export function ProfessionalInfoEditor({
  userId,
  currentBudgetMin,
  currentBudgetMax,
  currentExperience,
  currentVille,
  currentServiceType,
  onSave,
}: ProfessionalInfoEditorProps) {
  const [budgetMin, setBudgetMin] = useState(currentBudgetMin?.toString() || '')
  const [budgetMax, setBudgetMax] = useState(currentBudgetMax?.toString() || '')
  const [experience, setExperience] = useState(currentExperience?.toString() || '')
  const [ville, setVille] = useState(currentVille || '')
  const [serviceType, setServiceType] = useState(currentServiceType || '')
  const [initialData, setInitialData] = useState({ budgetMin: '', budgetMax: '', experience: '', ville: '', serviceType: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [professionOpen, setProfessionOpen] = useState(false)
  const isEditingRef = useRef(false)

  useEffect(() => {
    // Ne pas mettre à jour si l'utilisateur est en train de taper
    if (isEditingRef.current || isSaving) {
      return
    }
    
    const newData = {
      budgetMin: currentBudgetMin?.toString() || '',
      budgetMax: currentBudgetMax?.toString() || '',
      experience: currentExperience?.toString() || '',
      ville: currentVille || '',
      serviceType: currentServiceType || '',
    }
    
    // Utiliser une fonction de mise à jour pour éviter les dépendances circulaires
    setInitialData(prev => {
      // Si les données n'ont pas changé, retourner l'état précédent pour éviter le re-render
      if (
        prev.budgetMin === newData.budgetMin &&
        prev.budgetMax === newData.budgetMax &&
        prev.experience === newData.experience &&
        prev.ville === newData.ville &&
        prev.serviceType === newData.serviceType
      ) {
        return prev
      }
      
      // Sinon, mettre à jour les valeurs d'état seulement si elles ont changé
      if (newData.budgetMin !== prev.budgetMin) {
        setBudgetMin(newData.budgetMin)
      }
      if (newData.budgetMax !== prev.budgetMax) {
        setBudgetMax(newData.budgetMax)
      }
      if (newData.experience !== prev.experience) {
        setExperience(newData.experience)
      }
      if (newData.ville !== prev.ville) {
        setVille(newData.ville)
      }
      if (newData.serviceType !== prev.serviceType) {
        setServiceType(newData.serviceType)
      }
      
      return newData
    })
  }, [currentBudgetMin, currentBudgetMax, currentExperience, currentVille, currentServiceType, isSaving])

  const hasChanges =
    budgetMin !== initialData.budgetMin ||
    budgetMax !== initialData.budgetMax ||
    experience !== initialData.experience ||
    ville !== initialData.ville ||
    serviceType !== initialData.serviceType

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

    const serviceToSave = serviceType || null

    const { data, error } = await supabase
      .from('profiles')
      .update({
        budget_min: minBudget,
        budget_max: maxBudget,
        annees_experience: yearsExp,
        ville_principale: ville.trim() || null,
        service_type: serviceToSave,
      })
      .eq('id', userId)
      .select('budget_min, budget_max, annees_experience, ville_principale, service_type')
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
      const savedData = {
        budgetMin: data.budget_min?.toString() || '',
        budgetMax: data.budget_max?.toString() || '',
        experience: data.annees_experience?.toString() || '',
        ville: data.ville_principale || '',
        serviceType: data.service_type || '',
      }
      setBudgetMin(savedData.budgetMin)
      setBudgetMax(savedData.budgetMax)
      setExperience(savedData.experience)
      setVille(savedData.ville)
      setServiceType(savedData.serviceType)
      setInitialData(savedData)
    } else {
      // Fallback : utiliser les valeurs locales
      const fallbackData = { budgetMin, budgetMax, experience, ville, serviceType }
      setBudgetMin(fallbackData.budgetMin)
      setBudgetMax(fallbackData.budgetMax)
      setExperience(fallbackData.experience)
      setVille(fallbackData.ville)
      setServiceType(fallbackData.serviceType)
      setInitialData(fallbackData)
    }
    
    // Réinitialiser immédiatement pour permettre les mises à jour depuis props
    isEditingRef.current = false
    
    toast.success('Succès', {
      description: 'Informations mises à jour',
    })
    setIsSaving(false)
    
    // Attendre un peu avant de recharger pour s'assurer que la DB est à jour
    // Réduire à 300ms pour un affichage plus rapide
    setTimeout(() => {
      onSave?.()
    }, 300)
  }

  return (
    <div className="space-y-6">
      {/* Profession (service_type) - Modifiable avec recherche */}
      <div className="space-y-2">
        <Label htmlFor="service-type">Profession</Label>
        <Popover open={professionOpen} onOpenChange={setProfessionOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={professionOpen}
              className="w-full justify-between font-normal"
            >
              {serviceType
                ? getServiceTypeLabel(serviceType)
                : 'Sélectionnez votre profession'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border border-gray-200 shadow-lg" align="start" side="bottom" sideOffset={4} avoidCollisions={false}>
            <Command filter={(value, search) => {
              const service = SERVICE_TYPES.find(s => s.value === value)
              if (!service) return 0
              const label = service.label.toLowerCase()
              const category = SERVICE_CATEGORIES.find(c => c.services.some(s => s.value === value))
              const categoryLabel = category?.label.toLowerCase() || ''
              const s = search.toLowerCase()
              if (label.includes(s) || categoryLabel.includes(s) || value.includes(s)) return 1
              return 0
            }}>
              <CommandInput placeholder="Rechercher un métier..." />
              <CommandList>
                <CommandEmpty>Aucun métier trouvé.</CommandEmpty>
                {SERVICE_CATEGORIES.map((category) => (
                  <CommandGroup key={category.id} heading={category.label}>
                    {category.services.map((service) => (
                      <CommandItem
                        key={service.value}
                        value={service.value}
                        onSelect={(value) => {
                          isEditingRef.current = true
                          setServiceType(value === serviceType ? '' : value)
                          setProfessionOpen(false)
                          setTimeout(() => {
                            isEditingRef.current = false
                          }, 100)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            serviceType === service.value ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {service.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ville">Ville principale</Label>
        <p className="text-sm text-muted-foreground">Où êtes-vous basé(e) ?</p>
        <CityAutocompleteInput
          value={ville}
          onChange={(value) => {
            isEditingRef.current = true
            setVille(value)
            setTimeout(() => {
              isEditingRef.current = false
            }, 100)
          }}
          placeholder="Tapez votre ville..."
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
              onChange={(e) => {
                isEditingRef.current = true
                setBudgetMin(e.target.value)
              }}
              onBlur={() => {
                setTimeout(() => {
                  isEditingRef.current = false
                }, 100)
              }}
              onFocus={() => {
                isEditingRef.current = true
              }}
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
              onChange={(e) => {
                isEditingRef.current = true
                setBudgetMax(e.target.value)
              }}
              onBlur={() => {
                setTimeout(() => {
                  isEditingRef.current = false
                }, 100)
              }}
              onFocus={() => {
                isEditingRef.current = true
              }}
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
          onChange={(e) => {
            isEditingRef.current = true
            setExperience(e.target.value)
          }}
          onBlur={() => {
            setTimeout(() => {
              isEditingRef.current = false
            }, 100)
          }}
          onFocus={() => {
            isEditingRef.current = true
          }}
          min="0"
          max="50"
        />
      </div>

      {hasChanges && (
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              setBudgetMin(initialData.budgetMin)
              setBudgetMax(initialData.budgetMax)
              setExperience(initialData.experience)
              setVille(initialData.ville)
              setServiceType(initialData.serviceType)
            }}
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
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  )
}
