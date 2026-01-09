'use client'

import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'

interface Props {
  trialEndDate: string | null
}

export function EarlyAdopterWelcomeBanner({ trialEndDate }: Props) {
  const [isVisible, setIsVisible] = useState(true)
  
  if (!isVisible) return null
  
  const endDate = trialEndDate ? new Date(trialEndDate).toLocaleDateString('fr-FR') : ''
  
  return (
    <div className="relative bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-6 mb-6">
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 hover:opacity-70"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex items-start gap-4">
        <Sparkles className="w-8 h-8 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold mb-2">
            🎉 Vous faites partie des 50 premiers !
          </h3>
          <p className="text-purple-100 mb-4">
            Profitez de 3 mois d'accès gratuit à toutes les fonctionnalités premium jusqu'au <strong>{endDate}</strong>
          </p>
          <ul className="space-y-1 text-sm text-purple-100">
            <li>✓ Profil mis en avant dans les recherches</li>
            <li>✓ Messagerie illimitée avec les couples</li>
            <li>✓ Badge "Founding Member" permanent</li>
            <li>✓ Support prioritaire</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
