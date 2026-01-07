'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PrestataireType } from './types'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'

interface Props {
  onSelect: (prestataire: PrestataireType) => void
  onBack: () => void
}

type PrestataireCategory = 
  | 'alimentation'
  | 'media'
  | 'decoration'
  | 'beaute'
  | 'logistique'
  | 'autre'

const CATEGORIES: { id: PrestataireCategory; label: string }[] = [
  { id: 'alimentation', label: 'Alimentation' },
  { id: 'media', label: 'Média & Communication' },
  { id: 'decoration', label: 'Décoration & Ambiance' },
  { id: 'beaute', label: 'Beauté & Style' },
  { id: 'logistique', label: 'Logistique & Organisation' },
  { id: 'autre', label: 'Autre' }
]

const PRESTATAIRES_BY_CATEGORY: Record<PrestataireCategory, PrestataireType[]> = {
  'alimentation': [
    'Traiteur',
    'Pâtissier (Wedding cake)'
  ],
  'media': [
    'Photographe',
    'Vidéaste',
    'Faire-part / Papeterie'
  ],
  'decoration': [
    'Décorateur / Fleuriste',
    'Salle de réception',
    'Animation (photobooth, jeux...)'
  ],
  'beaute': [
    'Coiffeur / Maquilleur',
    'Robe de mariée / Costume',
    'Bijoutier'
  ],
  'logistique': [
    'DJ / Musicien',
    'Wedding planner',
    'Officiant de cérémonie',
    'Location de véhicules'
  ],
  'autre': [
    'Autre'
  ]
}

export default function Question2({ onSelect, onBack }: Props) {
  const [category, setCategory] = useState<PrestataireCategory | null>(null)
  const [prestataire, setPrestataire] = useState<PrestataireType | null>(null)

  const availablePrestataires = category ? PRESTATAIRES_BY_CATEGORY[category] : []

  const handleNext = () => {
    if (prestataire) {
      onSelect(prestataire)
    }
  }

  const isComplete = category && prestataire

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Question */}
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12 px-2"
      >
        Quel prestataire recherchez-vous ?
      </motion.h3>

      <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-10">
        {/* Sélection de la catégorie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm sm:text-base font-medium mb-2 text-gray-700">
            Catégorie
          </label>
          <Select
            value={category || undefined}
            onValueChange={(value) => {
              setCategory(value as PrestataireCategory)
              setPrestataire(null) // Reset prestataire when category changes
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Sélection du prestataire */}
        <AnimatePresence>
          {category && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm sm:text-base font-medium mb-2 text-gray-700">
                Prestataire
              </label>
              <Select
                value={prestataire || undefined}
                onValueChange={(value) => setPrestataire(value as PrestataireType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un prestataire" />
                </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {availablePrestataires.map((prestataireName) => (
                <SelectItem key={prestataireName} value={prestataireName}>
                  {prestataireName}
                </SelectItem>
              ))}
            </SelectContent>
              </Select>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Boutons navigation et pagination */}
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-sm sm:text-base w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleNext}
              disabled={!isComplete}
              className={cn(
                "text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-5 w-full sm:w-auto",
                !isComplete && "opacity-50 cursor-not-allowed"
              )}
              style={{
                backgroundColor: isComplete ? '#823F91' : '#d1d5db',
                color: 'white',
              }}
            >
              <span>Suivant</span>
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Pagination */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#823F91' }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#823F91' }} />
          <div className="w-2 h-2 rounded-full bg-gray-200" />
        </div>
        <Badge variant="secondary" className="text-xs sm:text-sm">Étape 2/3</Badge>
      </div>
    </div>
  )
}
