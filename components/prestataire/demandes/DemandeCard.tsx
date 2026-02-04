'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MessageSquare, Check, X, ArrowRight } from 'lucide-react'
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

  const getStatusBadge = (statut: Demande['statut']) => {
    switch (statut) {
      case 'nouvelle':
        return <Badge className="bg-[#823F91] text-white text-xs px-2 py-0.5">Nouvelle</Badge>
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">En cours</Badge>
      case 'terminee':
        return <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5">Terminée</Badge>
      case 'refusee':
        return <Badge className="bg-red-100 text-red-700 text-xs px-2 py-0.5">Refusée</Badge>
      case 'annulee':
        return <Badge className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5">Annulée</Badge>
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return ''
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {demande.couple_nom}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(demande.statut)}
                {demande.date_evenement && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(demande.date_evenement)}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[11px] text-gray-400 flex-shrink-0">
              {formatDate(demande.created_at)}
            </span>
          </div>

          {/* Message */}
          {demande.message && (
            <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
              {demande.message}
            </p>
          )}

          {/* Actions */}
          {demande.statut === 'nouvelle' && onAccept && onReject && (
            <div className="flex gap-2 pt-3 border-t border-gray-50">
              <Button
                onClick={() => onAccept(demande.id)}
                size="sm"
                className="flex-1 h-9 bg-[#823F91] hover:bg-[#6D3478] text-white text-sm font-medium rounded-lg"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Accepter
              </Button>
              <Button
                onClick={() => onReject(demande.id)}
                size="sm"
                variant="outline"
                className="flex-1 h-9 text-gray-600 border-gray-200 hover:bg-gray-50 text-sm font-medium rounded-lg"
              >
                <X className="h-4 w-4 mr-1.5" />
                Refuser
              </Button>
            </div>
          )}

          {(demande.statut === 'en_cours' || demande.statut === 'terminee') && conversationId && (
            <div className="pt-3 border-t border-gray-50">
              <button
                onClick={() => router.push(`/prestataire/messagerie/${conversationId}`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#823F91] text-sm font-semibold rounded-full shadow-[0_2px_12px_rgba(130,63,145,0.25)] border border-[#823F91]/20 hover:shadow-[0_4px_16px_rgba(130,63,145,0.35)] hover:border-[#823F91]/40 transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4" />
                Voir la conversation
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
