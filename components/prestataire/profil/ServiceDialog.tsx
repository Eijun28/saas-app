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
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'

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
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialiser le formulaire avec les données du service si en mode édition
  useEffect(() => {
    if (service) {
      setFormData({
        nom: service.nom,
        description: service.description,
        prix: service.prix.toString(),
      })
    } else {
      setFormData({
        nom: '',
        description: '',
        prix: '',
      })
    }
    setErrors({})
  }, [service, isOpen])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du service est requis'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise'
    }

    if (!formData.prix.trim()) {
      newErrors.prix = 'Le prix est requis'
    } else {
      const prixNum = parseFloat(formData.prix)
      if (isNaN(prixNum) || prixNum <= 0) {
        newErrors.prix = 'Le prix doit être un nombre positif'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSave({
      nom: formData.nom.trim(),
      description: formData.description.trim(),
      prix: parseFloat(formData.prix),
    })

    // Reset form
    setFormData({
      nom: '',
      description: '',
      prix: '',
    })
    setErrors({})
    onClose()
  }

  const handleClose = () => {
    setFormData({
      nom: '',
      description: '',
      prix: '',
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {service ? 'Modifier le service' : 'Ajouter un service'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">
              Nom du service *
            </Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: Forfait Mariage Complet"
              className={errors.nom ? 'border-red-500' : ''}
            />
            {errors.nom && (
              <p className="text-sm text-red-500">{errors.nom}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre service en détail..."
              className="min-h-[100px] resize-none"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prix">
              Prix (€) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                €
              </span>
              <Input
                id="prix"
                type="number"
                step="0.01"
                min="0"
                value={formData.prix}
                onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                placeholder="0.00"
                className={`pl-8 ${errors.prix ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.prix && (
              <p className="text-sm text-red-500">{errors.prix}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-[#823F91] hover:bg-[#6D3478]"
            >
              {service ? 'Enregistrer les modifications' : 'Ajouter le service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

