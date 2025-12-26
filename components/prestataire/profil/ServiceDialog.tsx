'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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

interface Service {
  id: string
  nom: string
  description: string
  prix: number
}

interface ServiceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: Omit<Service, 'id'>) => void
  service?: Service | null
}

export function ServiceDialog({ isOpen, onClose, onSave, service }: ServiceDialogProps) {
  const [selectedService, setSelectedService] = useState<string>('')
  const [customService, setCustomService] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isOtherSelected = selectedService === 'Autre'

  // Initialiser le formulaire avec les données du service si en mode édition
  useEffect(() => {
    if (service) {
      // Si le service existe, essayer de trouver le type correspondant
      const matchingService = SERVICES_LIST.find(s => service.nom.includes(s))
      if (matchingService) {
        setSelectedService(matchingService)
        if (matchingService === 'Autre') {
          setCustomService(service.nom.replace('Autre - ', ''))
        }
      } else {
        setSelectedService('Autre')
        setCustomService(service.nom)
      }
    } else {
      setSelectedService('')
      setCustomService('')
    }
    setErrors({})
  }, [service, isOpen])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedService) {
      newErrors.serviceType = 'Le type de service est requis'
    }

    if (isOtherSelected && !customService.trim()) {
      newErrors.customService = 'Veuillez préciser votre métier'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const serviceName = isOtherSelected ? customService.trim() : selectedService

    onSave({
      nom: serviceName,
      description: '', // On garde la description vide pour l'instant
      prix: 0, // On garde le prix à 0 pour l'instant
    })

    // Reset form
    setSelectedService('')
    setCustomService('')
    setErrors({})
    onClose()
  }

  const handleClose = () => {
    setSelectedService('')
    setCustomService('')
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {service ? 'Modifier votre service' : 'Ajouter un service'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez le type de prestation que vous proposez
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-type">Type de service</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger id="service-type" className={errors.serviceType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez un service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICES_LIST.map((serviceItem) => (
                  <SelectItem key={serviceItem} value={serviceItem}>
                    {serviceItem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceType && (
              <p className="text-sm text-red-500">{errors.serviceType}</p>
            )}
          </div>

          {isOtherSelected && (
            <div className="space-y-2">
              <Label htmlFor="custom-service">Précisez votre métier</Label>
              <Input
                id="custom-service"
                placeholder="Ex: Negafa, Calligraphe, Couturier..."
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                className={errors.customService ? 'border-red-500' : ''}
              />
              {errors.customService && (
                <p className="text-sm text-red-500">{errors.customService}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-[#823F91] hover:bg-[#6D3478]"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

