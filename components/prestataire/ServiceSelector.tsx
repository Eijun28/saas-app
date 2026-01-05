'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SERVICES_LIST = [
  'Traiteur',
  'Photographe',
  'Vidéaste',
  'DJ / Musicien',
  'Salle de réception',
  'Décorateur / Fleuriste',
  'Coiffeur / Maquilleur',
  'Pâtissier (Wedding cake)',
  'Robe de mariée / Costume',
  'Bijoutier',
  'Faire-part / Papeterie',
  'Animation (photobooth, jeux...)',
  'Wedding planner',
  'Officiant de cérémonie',
  'Location de véhicules',
  'Autre',
]

export function ServiceSelector() {
  const [selectedService, setSelectedService] = useState<string>('')
  const [customService, setCustomService] = useState<string>('')
  const [currentService, setCurrentService] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Charger le service existant au montage
  useEffect(() => {
    async function loadCurrentService() {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('service_type')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Erreur lors du chargement du service:', error)
      } else if (profile?.service_type) {
        setCurrentService(profile.service_type)
        // Si le service n'est pas dans la liste, c'est "Autre"
        if (SERVICES_LIST.includes(profile.service_type)) {
          setSelectedService(profile.service_type)
        } else {
          setSelectedService('Autre')
          setCustomService(profile.service_type)
        }
      }
      
      setIsLoading(false)
    }

    loadCurrentService()
  }, [])

  const isOtherSelected = selectedService === 'Autre'
  const canSave = selectedService && (!isOtherSelected || customService.trim())

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()
    
    const serviceToSave = isOtherSelected ? customService.trim() : selectedService

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Vous devez être connecté")
        setIsSaving(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({ service_type: serviceToSave })
        .eq('id', user.id)

      if (error) throw error

      // Mettre à jour le service affiché et fermer le formulaire
      setCurrentService(serviceToSave)
      setIsEditing(false)
      
      toast.success("✅ Succès", {
        description: "Merci ! Votre type de service a été enregistré avec succès.",
      })
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error("Erreur", {
        description: error.message || "Impossible d'enregistrer le service",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Si un service est déjà enregistré et qu'on n'est pas en mode édition, afficher le service avec bouton modifier
  if (currentService && !isEditing) {
    return (
      <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Votre service
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {currentService}
            </p>
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="border-[#823F91] text-[#823F91] hover:bg-[#823F91] hover:text-white"
          >
            Modifier
          </Button>
        </div>
      </div>
    )
  }

  // Formulaire de sélection/édition
  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {currentService ? 'Modifier votre service' : 'Choisissez votre service'}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Sélectionnez le type de prestation que vous proposez
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="service-type">Type de service</Label>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger id="service-type">
              <SelectValue placeholder="Sélectionnez un service" />
            </SelectTrigger>
            <SelectContent>
              {SERVICES_LIST.map((service) => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isOtherSelected && (
          <div className="space-y-2">
            <Label htmlFor="custom-service">Précisez votre métier</Label>
            <Input
              id="custom-service"
              placeholder="Ex: Calligraphe, Couturier..."
              value={customService}
              onChange={(e) => setCustomService(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-2">
          {currentService && (
            <Button
              onClick={() => {
                setIsEditing(false)
                // Réinitialiser les valeurs du formulaire
                if (SERVICES_LIST.includes(currentService)) {
                  setSelectedService(currentService)
                  setCustomService('')
                } else {
                  setSelectedService('Autre')
                  setCustomService(currentService)
                }
              }}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`${currentService ? 'flex-1' : 'w-full'} bg-[#823F91] hover:bg-[#6D3478]`}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  )
}
