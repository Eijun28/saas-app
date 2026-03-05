'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ChevronRight, ChevronLeft, Heart, MapPin, Euro,
  Sparkles, Users, Palette, CalendarHeart, Search, X
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SERVICE_CATEGORIES, getServiceTypeLabel } from '@/lib/constants/service-types'
import { CULTURE_CATEGORIES } from '@/lib/constants/cultures'

const STEPS = [
  { id: 1, label: 'Mariage', icon: CalendarHeart, description: 'Date et lieu' },
  { id: 2, label: 'Budget', icon: Euro, description: 'Votre budget' },
  { id: 3, label: 'Culture', icon: Palette, description: 'Style et traditions' },
  { id: 4, label: 'Services', icon: Search, description: 'Prestataires recherchés' },
]

export default function CoupleOnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Step 1: Wedding date + city
  const [dateMarriage, setDateMarriage] = useState('')
  const [lieuMarriage, setLieuMarriage] = useState('')
  const [nombreInvites, setNombreInvites] = useState('')

  // Step 2: Budget
  const [budgetTotal, setBudgetTotal] = useState('')

  // Step 3: Culture
  const [selectedCultures, setSelectedCultures] = useState<string[]>([])

  // Step 4: Services needed
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [serviceSearch, setServiceSearch] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }
      setUserId(user.id)

      // Charger les données existantes
      const { data: couple } = await supabase
        .from('couples')
        .select('date_mariage, lieu_marriage, budget_total')
        .eq('id', user.id)
        .maybeSingle()

      if (couple) {
        if (couple.date_mariage) setDateMarriage(couple.date_mariage)
        if (couple.lieu_marriage) setLieuMarriage(couple.lieu_marriage)
        if (couple.budget_total) setBudgetTotal(String(couple.budget_total))
      }

      // Charger préférences et reprendre l'étape
      const { data: prefs } = await supabase
        .from('couple_preferences')
        .select('onboarding_step, essential_services, cultural_preferences')
        .eq('couple_id', user.id)
        .maybeSingle()

      if (prefs) {
        if (prefs.profile_completed) {
          router.push('/couple/dashboard')
          return
        }
        if (prefs.onboarding_step > 0 && prefs.onboarding_step <= 4) {
          setCurrentStep(prefs.onboarding_step)
        }
        if (prefs.essential_services?.length) {
          setSelectedServices(prefs.essential_services)
        }
        if (prefs.cultural_preferences && typeof prefs.cultural_preferences === 'object') {
          const cultures = (prefs.cultural_preferences as Record<string, unknown>).selected
          if (Array.isArray(cultures)) setSelectedCultures(cultures)
        }
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
        if (!lieuMarriage.trim()) {
          toast.error('Veuillez indiquer le lieu du mariage')
          setIsSaving(false)
          return
        }

        const { error: coupleError } = await supabase
          .from('couples')
          .update({
            date_mariage: dateMarriage || null,
            lieu_marriage: lieuMarriage.trim(),
          })
          .eq('id', userId)
        if (coupleError) throw coupleError

        const { error } = await supabase
          .from('couple_preferences')
          .update({ onboarding_step: 2 })
          .eq('couple_id', userId)
        if (error) throw error
      }

      if (currentStep === 2) {
        const budget = budgetTotal ? parseFloat(budgetTotal) : null

        const { error: coupleError } = await supabase
          .from('couples')
          .update({ budget_total: budget })
          .eq('id', userId)
        if (coupleError) throw coupleError

        const { error } = await supabase
          .from('couple_preferences')
          .update({ onboarding_step: 3 })
          .eq('couple_id', userId)
        if (error) throw error
      }

      if (currentStep === 3) {
        const { error } = await supabase
          .from('couple_preferences')
          .update({
            cultural_preferences: { selected: selectedCultures },
            onboarding_step: 4,
          })
          .eq('couple_id', userId)
        if (error) throw error
      }

      if (currentStep === 4) {
        const { error } = await supabase
          .from('couple_preferences')
          .update({
            essential_services: selectedServices,
            onboarding_step: 5,
            profile_completed: true,
            completion_percentage: 100,
          })
          .eq('couple_id', userId)
        if (error) throw error

        toast.success('Bienvenue sur NUPLY !')
        window.location.href = '/couple/dashboard'
        return
      }

      setCurrentStep(prev => prev + 1)
    } catch (error: unknown) {
      console.error('Save error:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  function toggleCulture(cultureId: string) {
    setSelectedCultures(prev =>
      prev.includes(cultureId)
        ? prev.filter(c => c !== cultureId)
        : [...prev, cultureId]
    )
  }

  function toggleService(serviceValue: string) {
    setSelectedServices(prev =>
      prev.includes(serviceValue)
        ? prev.filter(s => s !== serviceValue)
        : [...prev, serviceValue]
    )
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
      case 1: return !!lieuMarriage.trim()
      case 2: return true // budget is optional
      case 3: return true // culture is optional
      case 4: return true // services are optional but encouraged
      default: return false
    }
  }

  const BUDGET_PRESETS = [
    { label: '< 10 000', value: '10000' },
    { label: '10 - 20k', value: '20000' },
    { label: '20 - 35k', value: '35000' },
    { label: '35 - 50k', value: '50000' },
    { label: '50k+', value: '75000' },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="h-5 w-5 text-[#823F91]" />
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#823F91] to-[#B855D6] bg-clip-text text-transparent">
            Planifiez votre mariage
          </h1>
        </div>
        <p className="text-sm text-gray-500 max-w-md">
          Quelques informations pour personnaliser votre expérience. Moins de 2 minutes.
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
                {/* Step 1: Wedding Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Quand et où vous mariez-vous ?</h2>
                      <p className="text-sm text-gray-500">Ces infos nous aident à trouver les meilleurs prestataires disponibles</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Lieu du mariage <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={lieuMarriage}
                          onChange={(e) => setLieuMarriage(e.target.value)}
                          placeholder="Ex: Paris, Lyon, Bordeaux..."
                          className="h-12 rounded-xl border-gray-200 focus-visible:ring-[#823F91]"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Date du mariage
                          <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
                        </Label>
                        <Input
                          type="date"
                          value={dateMarriage}
                          onChange={(e) => setDateMarriage(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-12 rounded-xl border-gray-200 focus-visible:ring-[#823F91]"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Nombre d'invités estimé
                          <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
                        </Label>
                        <Input
                          type="number"
                          value={nombreInvites}
                          onChange={(e) => setNombreInvites(e.target.value)}
                          placeholder="Ex: 150"
                          min={0}
                          className="h-12 rounded-xl border-gray-200 focus-visible:ring-[#823F91]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Budget */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Quel est votre budget ?</h2>
                      <p className="text-sm text-gray-500">
                        Estimez votre budget global. Vous pourrez l'affiner plus tard.
                        <span className="text-gray-400"> (optionnel)</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {BUDGET_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setBudgetTotal(budgetTotal === preset.value ? '' : preset.value)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                            budgetTotal === preset.value
                              ? "bg-[#823F91] text-white shadow-md shadow-[#823F91]/20"
                              : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#823F91]/30 hover:text-[#823F91]"
                          )}
                        >
                          {preset.label} €
                        </button>
                      ))}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Ou saisissez un montant précis
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={budgetTotal}
                          onChange={(e) => setBudgetTotal(e.target.value)}
                          placeholder="25000"
                          min={0}
                          className="h-12 rounded-xl border-gray-200 focus-visible:ring-[#823F91] pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Culture */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Quelles sont vos traditions ?</h2>
                      <p className="text-sm text-gray-500">
                        Sélectionnez les cultures de votre mariage pour trouver des prestataires qui les connaissent.
                        <span className="text-gray-400"> (optionnel)</span>
                      </p>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {CULTURE_CATEGORIES.map((category) => {
                        const isMainSelected = selectedCultures.includes(category.id)
                        const subSelected = category.subcategories?.filter(s => selectedCultures.includes(s.id)) || []

                        return (
                          <div key={category.id} className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => toggleCulture(category.id)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                                isMainSelected
                                  ? "bg-[#823F91] text-white"
                                  : subSelected.length > 0
                                  ? "bg-[#F5F0F7] text-[#823F91]"
                                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                              )}
                            >
                              {category.label}
                              {(isMainSelected || subSelected.length > 0) && (
                                <Check className="inline-block ml-2 h-4 w-4" />
                              )}
                            </button>

                            {(isMainSelected || subSelected.length > 0) && category.subcategories && (
                              <div className="flex flex-wrap gap-1.5 pl-2">
                                {category.subcategories.map(sub => (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => toggleCulture(sub.id)}
                                    className={cn(
                                      "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                                      selectedCultures.includes(sub.id)
                                        ? "bg-[#823F91] text-white shadow-sm"
                                        : "bg-white border border-gray-200 text-gray-600 hover:border-[#823F91]/30 hover:text-[#823F91]"
                                    )}
                                  >
                                    {sub.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {selectedCultures.length > 0 && (
                      <p className="text-xs text-[#823F91] font-medium">
                        {selectedCultures.length} culture{selectedCultures.length > 1 ? 's' : ''} sélectionnée{selectedCultures.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}

                {/* Step 4: Services Needed */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Quels prestataires recherchez-vous ?</h2>
                      <p className="text-sm text-gray-500">
                        Sélectionnez les types de prestataires dont vous avez besoin.
                        <span className="text-gray-400"> (optionnel)</span>
                      </p>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Rechercher un prestataire..."
                        className="w-full pl-9 pr-9 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none placeholder-gray-400 focus:ring-2 focus:ring-[#823F91]/20 focus:border-[#823F91]/30"
                      />
                      {serviceSearch && (
                        <button
                          type="button"
                          onClick={() => setServiceSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Selected services pills */}
                    {selectedServices.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedServices.map(sv => (
                          <span
                            key={sv}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#823F91] text-white"
                          >
                            {getServiceTypeLabel(sv)}
                            <button type="button" onClick={() => toggleService(sv)}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Service categories */}
                    <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                      {SERVICE_CATEGORIES.map(cat => {
                        const q = serviceSearch.toLowerCase()
                        const filteredServices = q
                          ? cat.services.filter(s =>
                              s.label.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)
                            )
                          : cat.services

                        if (filteredServices.length === 0) return null

                        const CatIcon = cat.icon
                        return (
                          <div key={cat.id}>
                            <div className="flex items-center gap-2 mb-2">
                              <CatIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {cat.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {filteredServices.map(service => (
                                <button
                                  key={service.value}
                                  type="button"
                                  onClick={() => toggleService(service.value)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    selectedServices.includes(service.value)
                                      ? "bg-[#823F91] text-white shadow-sm"
                                      : "bg-white border border-gray-200 text-gray-600 hover:border-[#823F91]/30 hover:text-[#823F91]"
                                  )}
                                >
                                  {service.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#F5F0F7] to-pink-50 border border-[#E8D4EF]">
                      <p className="text-sm text-[#5C2B66]">
                        <span className="font-semibold">Presque terminé !</span> Après cette étape, vous aurez accès à votre tableau de bord avec le matching IA, la messagerie et bien plus.
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
                      <ChevronLeft className="mr-1 h-4 w-4" />
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
                        <Sparkles className="ml-2 h-4 w-4" />
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
