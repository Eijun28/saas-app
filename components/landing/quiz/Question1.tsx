'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CoupleCommunities, CommunitySelection, Continent, ReligionChoice } from './types'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'

interface Props {
  onSelect: (communities: CoupleCommunities) => void
}

const CONTINENTS: { id: Continent; label: string }[] = [
  { id: 'afrique', label: 'Afrique' },
  { id: 'asie', label: 'Asie' },
  { id: 'europe', label: 'Europe' },
  { id: 'amerique', label: 'Amérique' },
  { id: 'oceanie', label: 'Océanie' },
  { id: 'moyen-orient', label: 'Moyen-Orient' }
]

const COUNTRIES_BY_CONTINENT: Record<Continent, string[]> = {
  'afrique': [
    'Maroc', 'Algérie', 'Tunisie', 'Sénégal', 'Cameroun', 'Côte d\'Ivoire',
    'Mali', 'Burkina Faso', 'Niger', 'Tchad', 'Guinée', 'Bénin', 'Togo',
    'Gabon', 'Congo', 'Madagascar', 'Mauritanie', 'Autre'
  ],
  'asie': [
    'Inde', 'Pakistan', 'Bangladesh', 'Chine', 'Japon', 'Corée du Sud',
    'Vietnam', 'Thaïlande', 'Philippines', 'Indonésie', 'Malaisie', 'Singapour',
    'Sri Lanka', 'Népal', 'Autre'
  ],
  'europe': [
    'France', 'Italie', 'Espagne', 'Portugal', 'Allemagne', 'Belgique',
    'Suisse', 'Royaume-Uni', 'Pays-Bas', 'Grèce', 'Pologne', 'Roumanie',
    'Bulgarie', 'Autre'
  ],
  'amerique': [
    'États-Unis', 'Canada', 'Brésil', 'Mexique', 'Argentine', 'Colombie',
    'Chili', 'Pérou', 'Venezuela', 'Cuba', 'Haïti', 'Jamaïque', 'Autre'
  ],
  'oceanie': [
    'Australie', 'Nouvelle-Zélande', 'Fidji', 'Papouasie-Nouvelle-Guinée',
    'Polynésie française', 'Nouvelle-Calédonie', 'Autre'
  ],
  'moyen-orient': [
    'Turquie', 'Liban', 'Syrie', 'Jordanie', 'Égypte', 'Arabie Saoudite',
    'Émirats arabes unis', 'Koweït', 'Qatar', 'Bahreïn', 'Oman', 'Yémen',
    'Irak', 'Iran', 'Israël', 'Palestine', 'Autre'
  ]
}

const RELIGION_OPTIONS: { id: ReligionChoice; label: string }[] = [
  { id: 'oui', label: 'Oui' },
  { id: 'non', label: 'Non' },
  { id: 'autre', label: 'Autre' }
]

const CommunityForm = ({ 
  label, 
  community, 
  onUpdate 
}: { 
  label: string
  community: CommunitySelection
  onUpdate: (community: CommunitySelection) => void
}) => {
  const availableCountries = community.continent ? COUNTRIES_BY_CONTINENT[community.continent] : []
  const showReligionOther = community.religion === 'oui' || community.religion === 'autre'

  return (
    <div className="space-y-4 sm:space-y-6">
      <h4 className="text-base sm:text-lg font-semibold mb-4" style={{ color: '#823F91' }}>
        {label}
      </h4>
      
      {/* Continent */}
      <div>
        <label className="block text-sm sm:text-base font-medium mb-2 text-gray-700">
          Continent
        </label>
        <Select
          value={community.continent || undefined}
          onValueChange={(value) => {
            onUpdate({
              ...community,
              continent: value as Continent,
              country: null, // Reset country when continent changes
            })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionnez un continent" />
          </SelectTrigger>
          <SelectContent>
            {CONTINENTS.map((cont) => (
              <SelectItem key={cont.id} value={cont.id}>
                {cont.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pays */}
      <AnimatePresence>
        {community.continent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <label className="block text-sm sm:text-base font-medium mb-2 text-gray-700">
              Pays
            </label>
            <Select
              value={community.country || undefined}
              onValueChange={(value) => {
                onUpdate({
                  ...community,
                  country: value,
                })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez un pays" />
              </SelectTrigger>
              <SelectContent>
                {availableCountries.map((countryName) => (
                  <SelectItem key={countryName} value={countryName}>
                    {countryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choix religieux */}
      <AnimatePresence>
        {community.country && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <label className="block text-sm sm:text-base font-medium mb-2 text-gray-700">
              Cérémonie religieuse ?
            </label>
            <div className="flex gap-2 flex-wrap">
              {RELIGION_OPTIONS.map((option) => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onUpdate({
                      ...community,
                      religion: option.id,
                      religionOther: (option.id === 'oui' || option.id === 'autre') ? community.religionOther : null
                    })
                  }}
                  className={cn(
                    "px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 border-2",
                    community.religion === option.id
                      ? "border-[#823F91] bg-[#823F91] text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-[#823F91]/50 hover:bg-[#823F91]/5"
                  )}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Champ texte si "Oui" ou "Autre" est sélectionné */}
      <AnimatePresence>
        {(community.religion === 'oui' || community.religion === 'autre') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label className="block text-sm sm:text-base font-medium mb-2 text-gray-700 mt-4">
              {community.religion === 'oui' ? 'Quelle religion ?' : 'Précisez votre religion'}
            </label>
            <Input
              type="text"
              placeholder={community.religion === 'oui' ? "Ex: Musulman, Chrétien, Juif, Hindou..." : "Ex: Bouddhiste, Hindouiste, Juif..."}
              value={community.religionOther || ''}
              onChange={(e) => {
                onUpdate({
                  ...community,
                  religionOther: e.target.value
                })
              }}
              className="w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Question1({ onSelect }: Props) {
  const [epoux1, setEpoux1] = useState<CommunitySelection>({
    continent: null,
    country: null,
    religion: null,
    religionOther: null
  })
  
  const [epoux2, setEpoux2] = useState<CommunitySelection>({
    continent: null,
    country: null,
    religion: null,
    religionOther: null
  })

  const isEpoux1Complete = epoux1.continent && epoux1.country && epoux1.religion && 
    (epoux1.religion === 'non' || (epoux1.religionOther && epoux1.religionOther.trim() !== ''))
  
  const isEpoux2Complete = epoux2.continent && epoux2.country && epoux2.religion && 
    (epoux2.religion === 'non' || (epoux2.religionOther && epoux2.religionOther.trim() !== ''))

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (isEpoux1Complete && isEpoux2Complete) {
      onSelect({
        epoux1,
        epoux2
      })
    }
  }

  const isComplete = isEpoux1Complete && isEpoux2Complete

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Question */}
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 px-2"
      >
        Quelle communauté représente votre mariage ?
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm sm:text-base text-gray-600 text-center mb-8 sm:mb-10 px-2"
      >
        Nous célébrons les mariages multiculturels ! Indiquez les origines des deux époux
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
        {/* Époux 1 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ 
            scale: 1.02,
            boxShadow: '0 8px 32px rgba(130, 63, 145, 0.3)'
          }}
          className={cn(
            "relative rounded-xl p-4 sm:p-6 border-2 transition-all duration-300",
            "bg-gradient-to-br from-[#c081e3]/10 via-white to-[#c081e3]/10",
            "border-[#c081e3]/30",
            "shadow-lg"
          )}
          style={{
            boxShadow: '0 4px 20px rgba(192, 129, 227, 0.2), 0 0 0 1px rgba(192, 129, 227, 0.1)'
          }}
        >
          {/* Effet glow animé */}
          <motion.div
            className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(130, 63, 145, 0.1) 0%, transparent 70%)',
              filter: 'blur(20px)'
            }}
            animate={{
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <CommunityForm 
            label="Époux 1" 
            community={epoux1}
            onUpdate={setEpoux1}
          />
        </motion.div>

        {/* Époux 2 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ 
            scale: 1.02,
            boxShadow: '0 8px 32px rgba(130, 63, 145, 0.3)'
          }}
          className={cn(
            "relative rounded-xl p-4 sm:p-6 border-2 transition-all duration-300",
            "bg-gradient-to-br from-[#c081e3]/10 via-white to-[#c081e3]/10",
            "border-[#c081e3]/30",
            "shadow-lg"
          )}
          style={{
            boxShadow: '0 4px 20px rgba(192, 129, 227, 0.2), 0 0 0 1px rgba(192, 129, 227, 0.1)'
          }}
        >
          {/* Effet glow animé */}
          <motion.div
            className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(130, 63, 145, 0.1) 0%, transparent 70%)',
              filter: 'blur(20px)'
            }}
            animate={{
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5
            }}
          />
          <CommunityForm 
            label="Époux 2" 
            community={epoux2}
            onUpdate={setEpoux2}
          />
        </motion.div>
      </div>

      {/* Bouton suivant et pagination */}
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleNext}
              disabled={!isComplete}
              type="button"
              className={cn(
                "text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-5 w-full sm:w-auto",
                !isComplete && "opacity-50 cursor-not-allowed"
              )}
              style={{
                backgroundColor: isComplete ? '#823F91' : '#d1d5db',
                color: 'white',
              }}
              onFocus={(e) => e.preventDefault()}
            >
              <span>Suivant</span>
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Pagination */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#823F91' }} />
          <div className="w-2 h-2 rounded-full bg-gray-200" />
          <div className="w-2 h-2 rounded-full bg-gray-200" />
        </div>
        <Badge variant="secondary" className="text-xs sm:text-sm">Étape 1/3</Badge>
      </div>
    </div>
  )
}
