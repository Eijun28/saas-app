'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Euro, MessageSquare, Check, X, ArrowRight } from 'lucide-react'
import type { Demande } from '@/lib/types/prestataire'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface DemandeCardProps {
  demande: Demande
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
  conversationId?: string | null
}

export function DemandeCard({ demande, onAccept, onReject, conversationId }: DemandeCardProps) {
  const router = useRouter()
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non spécifié'
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return 'Date invalide'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="w-full border-[#823F91]/20 hover:shadow-lg transition-shadow overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold mb-2 break-words pr-2">
                Demande reçue de {demande.couple_nom}
              </CardTitle>
              <Badge 
                className={`${getStatusColor(demande.statut)} text-xs sm:text-sm px-2 py-0.5 sm:px-2.5 sm:py-1 inline-flex items-center`} 
                style={getStatusStyle(demande.statut)}
              >
                {getStatusLabel(demande.statut)}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
              {formatDate(demande.created_at)}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
          {demande.message && (
            <div className="flex items-start gap-2 sm:gap-3 bg-gray-50 rounded-lg p-3 sm:p-4">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-[#823F91] mt-0.5 flex-shrink-0" />
              <p className="text-sm sm:text-base text-gray-700 break-words flex-1 leading-relaxed">
                {demande.message}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {demande.date_evenement && (
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#823F91] flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600 break-words">
                  {formatDate(demande.date_evenement)}
                </span>
              </div>
            )}
            {demande.lieu && (
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#823F91] flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600 break-words truncate sm:whitespace-normal">
                  {demande.lieu}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <Euro className="h-4 w-4 sm:h-5 sm:w-5 text-[#823F91] flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600 break-words">
                {demande.budget_min > 0 && demande.budget_max > 0
                  ? `${demande.budget_min}€ - ${demande.budget_max}€`
                  : 'Non spécifié'}
              </span>
            </div>
          </div>

          {demande.statut === 'nouvelle' && onAccept && onReject && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-gray-100">
              <Button
                onClick={() => onAccept(demande.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 sm:h-9 text-sm font-medium"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Accepter</span>
              </Button>
              <Button
                onClick={() => onReject(demande.id)}
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 h-10 sm:h-9 text-sm font-medium"
                size="sm"
              >
                <X className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Refuser</span>
              </Button>
            </div>
          )}

          {(demande.statut === 'en_cours' || demande.statut === 'terminee') && conversationId && (
            <div className="pt-2 sm:pt-3 border-t border-gray-100">
              <Button
                onClick={() => router.push(`/prestataire/messagerie/${conversationId}`)}
                className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white h-10 sm:h-9 text-sm font-medium"
                size="sm"
              >
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Voir la conversation</span>
                <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

