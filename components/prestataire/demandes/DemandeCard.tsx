'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Calendar, Users, Euro, MessageSquare, Clock } from 'lucide-react'
import type { Demande } from '@/types/prestataire'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface DemandeCardProps {
  demande: Demande
}

export function DemandeCard({ demande }: DemandeCardProps) {
  // Formater le budget
  const formatBudget = (amount: number | null) => {
    if (!amount) return 'Non précisé'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Badge status
  const getStatusBadge = () => {
    switch (demande.status) {
      case 'pending':
        return <Badge className="bg-[#823F91]">Nouvelle</Badge>
      case 'viewed':
        return <Badge variant="secondary">Vue</Badge>
      case 'responded':
        return <Badge variant="outline">Répondu</Badge>
      case 'accepted':
        return <Badge className="bg-green-600">Acceptée</Badge>
      case 'rejected':
        return <Badge variant="destructive">Refusée</Badge>
      default:
        return <Badge variant="secondary">{demande.status}</Badge>
    }
  }

  // Formater la date de création
  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(demande.created_at), {
        addSuffix: true,
        locale: fr,
      })
    } catch {
      return 'Récemment'
    }
  }

  // Tronquer le message
  const truncateMessage = (text: string | undefined, maxLength = 150) => {
    if (!text) return 'Aucun message'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {demande.couple_name || 'Couple'}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {getTimeAgo()}
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Service demandé */}
          <div className="flex items-center gap-2 text-sm">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-[#823F91]" />
            </div>
            <div>
              <p className="font-medium">Service demandé</p>
              <p className="text-muted-foreground">{demande.service_type || 'Non précisé'}</p>
            </div>
          </div>

          {/* Date mariage */}
          {demande.wedding_date && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Date du mariage</p>
                <p className="text-muted-foreground">
                  {new Date(demande.wedding_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Nombre d'invités */}
          {demande.guest_count && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Nombre d'invités</p>
                <p className="text-muted-foreground">{demande.guest_count} personnes</p>
              </div>
            </div>
          )}

          {/* Budget */}
          <div className="flex items-center gap-2 text-sm">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Euro className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-medium">Budget indicatif</p>
              <p className="text-muted-foreground">{formatBudget(demande.budget_indicatif)}</p>
            </div>
          </div>

          {/* Message du couple */}
          {demande.message && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-1">Message :</p>
              <p className="text-sm text-muted-foreground italic">
                "{truncateMessage(demande.message)}"
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-2 flex-wrap">
          {demande.status === 'pending' && (
            <>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  // TODO: Implémenter refus
                  console.log('Refuser demande:', demande.id)
                }}
              >
                Refuser
              </Button>
              <Button 
                className="flex-1 bg-[#823F91] hover:bg-[#6D3478]"
                onClick={() => {
                  // TODO: Implémenter acceptation
                  console.log('Accepter demande:', demande.id)
                }}
              >
                Accepter
              </Button>
            </>
          )}
          
          <Button 
            variant="secondary" 
            className="flex-1"
            onClick={() => {
              // TODO: Ouvrir modal détails ou rediriger vers messagerie
              console.log('Voir détails demande:', demande.id)
            }}
          >
            Voir détails
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

