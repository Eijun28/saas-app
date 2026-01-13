'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Euro, MessageSquare, Check, X } from 'lucide-react'
import type { Demande } from '@/lib/types/prestataire'
import { motion } from 'framer-motion'

interface DemandeCardProps {
  demande: Demande
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
}

export function DemandeCard({ demande, onAccept, onReject }: DemandeCardProps) {
  const getStatusColor = (statut: Demande['statut']) => {
    switch (statut) {
      case 'nouvelle':
        return 'text-amber-50 border-transparent'
      case 'en_cours':
        return 'bg-blue-100 text-blue-800'
      case 'terminee':
        return 'bg-green-100 text-green-800'
      case 'refusee':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getStatusStyle = (statut: Demande['statut']) => {
    if (statut === 'nouvelle') {
      return { backgroundColor: 'rgba(221, 97, 255, 1)', borderColor: 'rgba(255, 255, 255, 0)' }
    }
    return {}
  }

  const getStatusLabel = (statut: Demande['statut']) => {
    switch (statut) {
      case 'nouvelle':
        return 'Nouvelle'
      case 'en_cours':
        return 'En cours'
      case 'terminee':
        return 'Terminée'
      case 'refusee':
        return 'Refusée'
      default:
        return statut
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-[#823F91]/20 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg mb-1">{demande.couple_nom}</CardTitle>
              <Badge className={getStatusColor(demande.statut)} style={getStatusStyle(demande.statut)}>
                {getStatusLabel(demande.statut)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(demande.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {demande.message && (
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-[#823F91] mt-1 flex-shrink-0" />
              <p className="text-sm text-gray-700">{demande.message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#823F91]" />
              <span className="text-gray-600">
                {new Date(demande.date_evenement).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#823F91]" />
              <span className="text-gray-600">{demande.lieu}</span>
            </div>
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-[#823F91]" />
              <span className="text-gray-600">
                {demande.budget_min > 0 && demande.budget_max > 0
                  ? `${demande.budget_min}€ - ${demande.budget_max}€`
                  : 'Non spécifié'}
              </span>
            </div>
          </div>

          {demande.statut === 'nouvelle' && onAccept && onReject && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onAccept(demande.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Accepter
              </Button>
              <Button
                onClick={() => onReject(demande.id)}
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Refuser
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

