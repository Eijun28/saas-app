'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Briefcase, Globe, MapPin, Euro, Sparkles, Search, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SERVICE_CATEGORIES, getServiceTypeLabel, type ServiceCategory } from '@/lib/constants/service-types'
import { DEPARTEMENTS, DEPARTEMENTS_BY_REGION } from '@/lib/constants/zones'
import { CultureSelector } from '@/components/provider/CultureSelector'

const STEPS = [
  { id: 1, label: 'Prestation', icon: Briefcase, description: 'Votre métier et ville' },
  { id: 2, label: 'Cultures', icon: Globe, description: 'Cultures de mariage' },
  { id: 3, label: 'Zones', icon: MapPin, description: 'Zones d\'intervention' },
  { id: 4, label: 'Budget', icon: Euro, description: 'Vos tarifs' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Step 1: Service type + city
  const [serviceType, setServiceType] = useState('')
  const [ville, setVille] = useState('')
  // Service type picker state
  const [pickerStep, setPickerStep] = useState<'category' | 'service'>('category')
  const [pickerCategory, setPickerCategory] = useState<ServiceCategory | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')

  // Step 3: Zones
  const [selectedZones, setSelectedZones] = useState<string[]>([])

  // Step 4: Budget
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }
      setUserId(user.id)

      // Charger les données existantes et l'étape en cours
      const { data: profile } = await supabase
        .from('profiles')
        .select('service_type, ville_principale, budget_min, budget_max, onboarding_step')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        if (profile.onboarding_step >= 5) {
          router.push('/prestataire/dashboard')
          return
        }
        if (profile.service_type) setServiceType(profile.service_type)
        if (profile.ville_principale) setVille(profile.ville_principale)
        if (profile.budget_min) setBudgetMin(String(profile.budget_min))
        if (profile.budget_max) setBudgetMax(String(profile.budget_max))
        // Reprendre là où on s'est arrêté
        if (profile.onboarding_step > 0 && profile.onboarding_step < 5) {
          setCurrentStep(profile.onboarding_step)
        }
      }

      // Charger les zones existantes
      const { data: zones } = await supabase
        .from('provider_zones')
        .select('zone_id')
        .eq('profile_id', user.id)

      if (zones && zones.length > 0) {
        setSelectedZones(zones.map(z => z.zone_id))
      }

      setIsLoading(false)
    }
    init()
  }, [])

  async function saveStepAndAdvance() {
    if (!userId) return
    setIsSaving(true)

    try {
      if (currentStep === 1) {
        if (!serviceType || !ville.trim()) {
          toast.error('Veuillez remplir tous les champs')
          setIsSaving(false)
          return
        }
        const { error } = await supabase
          .from('profiles')
          .update({
            service_type: serviceType,
            ville_principale: ville.trim(),
            onboarding_step: 2,
          })
          .eq('id', userId)
        if (error) throw error
      }

      if (currentStep === 2) {
        // Les cultures sont déjà sauvées par le CultureSelector
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_step: 3 })
          .eq('id', userId)
        if (error) throw error
      }

      if (currentStep === 3) {
        if (selectedZones.length === 0) {
          toast.error('Sélectionnez au moins une zone')
          setIsSaving(false)
          return
        }
        // Sauvegarder les zones
        await supabase.from('provider_zones').delete().eq('profile_id', userId)
        const inserts = selectedZones.map(zone_id => ({ profile_id: userId, zone_id }))
        const { error: zonesError } = await supabase.from('provider_zones').insert(inserts)
        if (zonesError) throw zonesError

        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_step: 4 })
          .eq('id', userId)
        if (error) throw error
      }

      if (currentStep === 4) {
        const min = budgetMin ? parseFloat(budgetMin) : null
        const max = budgetMax ? parseFloat(budgetMax) : null

        if (min !== null && max !== null && min > max) {
          toast.error('Le tarif minimum ne peut pas dépasser le maximum')
          setIsSaving(false)
          return
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            budget_min: min,
            budget_max: max,
            onboarding_step: 5,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq('id', userId)
        if (error) throw error

        toast.success('Bienvenue sur NUPLY !')
        // Full page reload pour que le layout Server Component se re-rende
        // avec la sidebar (router.push ne suffit pas car le layout persiste)
        window.location.href = '/prestataire/dashboard'
        return
      }

      setCurrentStep(prev => prev + 1)
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  function toggleZone(zoneId: string) {
    setSelectedZones(prev =>
      prev.includes(zoneId)
        ? prev.filter(z => z !== zoneId)
        : [...prev, zoneId]
    )
  }

  function toggleRegion(region: string) {
    const regionDepts: string[] = DEPARTEMENTS.filter(d => d.region === region).map(d => d.id)
    const allSelected = regionDepts.every(d => selectedZones.includes(d))
    if (allSelected) {
      setSelectedZones(prev => prev.filter(z => !regionDepts.includes(z)))
    } else {
      setSelectedZones(prev => [...new Set([...prev, ...regionDepts])])
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[#823F91]">Chargement...</div>
      </div>
    )
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!serviceType && !!ville.trim()
      case 2: return true // cultures are optional but encouraged
      case 3: return selectedZones.length > 0
      case 4: return true // budget is optional
      default: return false
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-[#823F91]" />
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#823F91] to-[#B855D6] bg-clip-text text-transparent">
            Configurez votre profil
          </h1>
        </div>
        <p className="text-sm text-gray-500 max-w-md">
          Ces informations permettent aux couples de vous trouver. Cela prend moins de 3 minutes.
        </p>
      </motion.div>

      {/* Stepper */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-[#823F91] text-white shadow-lg shadow-[#823F91]/25"
                      : "bg-gray-100 text-gray-400"
                  )}>
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs mt-1.5 font-medium text-center",
                    isActive ? "text-[#823F91]" : isCompleted ? "text-emerald-600" : "text-gray-400"
                  )}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 flex-1 mx-2 transition-all duration-300",
                    currentStep > step.id ? "bg-emerald-500" : "bg-gray-200"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white shadow-xl shadow-[#823F91]/10 border-0 ring-1 ring-[#E8D4EF]/50 overflow-hidden">
              <div className="p-5 sm:p-8">
                {/* Step 1: Service Type + City */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Quel est votre métier ?</h2>
                      <p className="text-sm text-gray-500">Sélectionnez votre type de prestation principal</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Type de prestation <span className="text-red-500">*</span>
                        </Label>

                        {/* Selected state */}
                        {serviceType ? (
                          <div className="flex items-center justify-between p-3 bg-[#F5F0F7] border border-[#823F91]/20 rounded-xl">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#823F91]/15 flex items-center justify-center flex-shrink-0">
                                <Check className="h-4 w-4 text-[#823F91]" />
                              </div>
                              <span className="text-sm font-semibold text-[#823F91] truncate">
                                {getServiceTypeLabel(serviceType)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setServiceType('')
                                setPickerStep('category')
                                setPickerCategory(null)
                                setPickerSearch('')
                              }}
                              className="ml-2 flex items-center gap-1 text-xs text-gray-500 hover:text-[#823F91] flex-shrink-0 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                              Modifier
                            </button>
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-xl overflow-hidden">
                            {/* Search bar */}
                            <div className="relative border-b border-gray-100">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              <input
                                type="text"
                                value={pickerSearch}
                                onChange={(e) => {
                                  setPickerSearch(e.target.value)
                                  if (e.target.value) setPickerStep('service')
                                  else { setPickerStep('category'); setPickerCategory(null) }
                                }}
                                placeholder="Rechercher un métier..."
                                className="w-full pl-9 pr-9 py-3 text-sm bg-white outline-none placeholder-gray-400 min-w-0"
                              />
                              {pickerSearch && (
                                <button
                                  type="button"
                                  onClick={() => { setPickerSearch(''); setPickerStep('category'); setPickerCategory(null) }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            {/* Category grid */}
                            {pickerStep === 'category' && !pickerSearch && (
                              <div className="grid grid-cols-2 gap-px bg-gray-100 max-h-72 overflow-y-auto">
                                {SERVICE_CATEGORIES.map(cat => {
                                  const CatIcon = cat.icon
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => {
                                        setPickerCategory(cat)
                                        setPickerStep('service')
                                      }}
                                      className="flex items-center gap-2.5 p-3 bg-white hover:bg-[#F5F0F7] transition-colors text-left group"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#823F91]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                                        <CatIcon className="h-4 w-4 text-gray-500 group-hover:text-[#823F91] transition-colors" />
                                      </div>
                                      <span className="text-xs font-medium text-gray-700 group-hover:text-[#823F91] leading-tight transition-colors">
                                        {cat.label}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            )}

                            {/* Service list for selected category or search results */}
                            {(pickerStep === 'service' || pickerSearch) && (
                              <div className="bg-white">
                                {/* Back button when browsing by category */}
                                {pickerCategory && !pickerSearch && (
                                  <button
                                    type="button"
                                    onClick={() => { setPickerStep('category'); setPickerCategory(null) }}
                                    className="flex items-center gap-1.5 w-full px-3 py-2.5 text-xs font-semibold text-[#823F91] border-b border-gray-100 hover:bg-[#F5F0F7] transition-colors"
                                  >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    {pickerCategory.label}
                                  </button>
                                )}

                                <div className="max-h-64 overflow-y-auto">
                                  {pickerSearch ? (
                                    // Search results across all categories
                                    (() => {
                                      const q = pickerSearch.toLowerCase()
                                      const results = SERVICE_CATEGORIES.flatMap(cat =>
                                        cat.services
                                          .filter(s => s.label.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q))
                                          .map(s => ({ ...s, categoryLabel: cat.label }))
                                      )
                                      return results.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">Aucun résultat</p>
                                      ) : (
                                        results.map(s => (
                                          <button
                                            key={s.value}
                                            type="button"
                                            onClick={() => {
                                              setServiceType(s.value)
                                              setPickerSearch('')
                                              setPickerStep('category')
                                              setPickerCategory(null)
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-[#F5F0F7] hover:text-[#823F91] transition-colors text-left border-b border-gray-50 last:border-0"
                                          >
                                            <span className="flex-1">{s.label}</span>
                                            <span className="text-xs text-gray-400 flex-shrink-0">{s.categoryLabel}</span>
                                          </button>
                                        ))
                                      )
                                    })()
                                  ) : (
                                    // Services for selected category
                                    pickerCategory?.services.map(s => (
                                      <button
                                        key={s.value}
                                        type="button"
                                        onClick={() => {
                                          setServiceType(s.value)
                                          setPickerStep('category')
                                          setPickerCategory(null)
                                        }}
                                        className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-[#F5F0F7] hover:text-[#823F91] transition-colors text-left border-b border-gray-50 last:border-0"
                                      >
                                        {s.label}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Ville principale d'exercice <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={ville}
                          onChange={(e) => setVille(e.target.value)}
                          placeholder="Ex: Paris, Lyon, Marseille..."
                          className="h-12 rounded-xl border-gray-200 focus-visible:ring-[#823F91]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Cultures */}
                {currentStep === 2 && userId && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Quelles cultures connaissez-vous ?</h2>
                      <p className="text-sm text-gray-500">
                        Indiquez les cultures de mariage pour lesquelles vous avez de l'expérience.
                        Cela aide les couples à trouver un prestataire qui comprend leurs traditions.
                      </p>
                    </div>

                    <CultureSelector userId={userId} compact />
                  </div>
                )}

                {/* Step 3: Zones */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Où intervenez-vous ?</h2>
                      <p className="text-sm text-gray-500">
                        Sélectionnez les départements où vous pouvez vous déplacer.
                        <span className="text-[#823F91] font-medium"> Au moins 1 zone requise.</span>
                      </p>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {Object.entries(DEPARTEMENTS_BY_REGION).map(([region, depts]) => {
                        const regionDeptIds: string[] = depts.map(d => d.id)
                        const allSelected = regionDeptIds.every(d => selectedZones.includes(d))
                        const someSelected = regionDeptIds.some(d => selectedZones.includes(d))

                        return (
                          <div key={region} className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => toggleRegion(region)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                                allSelected
                                  ? "bg-[#823F91] text-white"
                                  : someSelected
                                  ? "bg-[#F5F0F7] text-[#823F91]"
                                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                              )}
                            >
                              {region}
                              {someSelected && (
                                <span className="ml-2 text-xs opacity-75">
                                  ({regionDeptIds.filter(d => selectedZones.includes(d)).length}/{regionDeptIds.length})
                                </span>
                              )}
                            </button>
                            <div className="flex flex-wrap gap-1.5 pl-2">
                              {depts.map(dept => (
                                <button
                                  key={dept.id}
                                  type="button"
                                  onClick={() => toggleZone(dept.id)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                                    selectedZones.includes(dept.id)
                                      ? "bg-[#823F91] text-white shadow-sm"
                                      : "bg-white border border-gray-200 text-gray-600 hover:border-[#823F91]/30 hover:text-[#823F91]"
                                  )}
                                >
                                  {dept.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {selectedZones.length > 0 && (
                      <p className="text-xs text-[#823F91] font-medium">
                        {selectedZones.length} département{selectedZones.length > 1 ? 's' : ''} sélectionné{selectedZones.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}

                {/* Step 4: Budget */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Quelle est votre fourchette de prix ?</h2>
                      <p className="text-sm text-gray-500">
                        Indiquez vos tarifs habituels. Vous pourrez détailler vos formules plus tard.
                        <span className="text-gray-400"> (optionnel)</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Tarif minimum
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={budgetMin}
                            onChange={(e) => setBudgetMin(e.target.value)}
                            placeholder="500"
                            min={0}
                            className="h-12 rounded-xl border-gray-200 focus-visible:ring-[#823F91] pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Tarif maximum
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={budgetMax}
                            onChange={(e) => setBudgetMax(e.target.value)}
                            placeholder="5000"
                            min={0}
                            className="h-12 rounded-xl border-gray-200 focus-visible:ring-[#823F91] pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#F5F0F7] to-pink-50 border border-[#E8D4EF]">
                      <p className="text-sm text-[#5C2B66]">
                        <span className="font-semibold">Presque terminé !</span> Après cette étape, vous aurez accès à votre tableau de bord pour compléter votre portfolio, vos réseaux sociaux et plus encore.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  {currentStep > 1 ? (
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      disabled={isSaving}
                      className="text-gray-500"
                    >
                      Retour
                    </Button>
                  ) : (
                    <div />
                  )}

                  <Button
                    onClick={saveStepAndAdvance}
                    disabled={isSaving || !isStepValid()}
                    className="bg-[#823F91] hover:bg-[#6D3478] text-white px-6 h-11 rounded-xl shadow-md shadow-[#823F91]/20"
                  >
                    {isSaving ? (
                      'Enregistrement...'
                    ) : currentStep === 4 ? (
                      <>
                        Terminer
                        <Check className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Suivant
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Step description */}
      <motion.p
        key={currentStep}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-gray-400 mt-4"
      >
        Étape {currentStep} sur {STEPS.length} — {STEPS[currentStep - 1]?.description}
      </motion.p>
    </div>
  )
}
