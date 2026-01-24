'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { getCouplesByUserIds, formatCoupleName } from '@/lib/supabase/queries/couples.queries'

interface PendingRequest {
  id: string
  couple_name: string
  created_at: string
  event_date?: string
}

export function PendingRequests() {
  const router = useRouter()
  const { user } = useUser()
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchPendingRequests = async () => {
      try {
        const supabase = createClient()
        
        // Récupérer les demandes en attente
        const { data: requestsData, error } = await supabase
          .from('requests')
          .select('id, couple_id, created_at')
          .eq('provider_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(3)

        if (error) {
          console.error('Erreur chargement demandes:', {
            message: error.message || 'Erreur inconnue',
            details: error.details || 'Aucun détail',
            hint: error.hint || 'Aucun indice',
            code: error.code || 'Aucun code',
            fullError: error
          })
          setLoading(false)
          return
        }

        if (!requestsData || requestsData.length === 0) {
          setRequests([])
          setLoading(false)
          return
        }

        // Récupérer les informations des couples
        const coupleUserIds = [...new Set(requestsData.map(r => r.couple_id).filter(Boolean))]
        const couplesMap = await getCouplesByUserIds(coupleUserIds, [
          'user_id',
          'partner_1_name',
          'partner_2_name',
          'wedding_date'
        ])

        // Transformer les données
        const formattedRequests = requestsData.map(req => {
          const couple = couplesMap.get(req.couple_id)

          return {
            id: req.id,
            couple_name: formatCoupleName(couple),
            created_at: req.created_at,
            event_date: couple?.wedding_date || undefined,
          }
        })

        setRequests(formattedRequests)
      } catch (error) {
        console.error('Erreur lors du chargement des demandes:', {
          message: error instanceof Error ? error.message : 'Erreur inconnue',
          error: error
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPendingRequests()
  }, [user])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffHours < 1) return "À l'instant"
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Il y a 1 jour'
    return `Il y a ${diffDays} jours`
  }

  const handleAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('requests')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', requestId)

      if (error) throw error

      // Retirer la demande de la liste
      setRequests(prev => prev.filter(req => req.id !== requestId))
    } catch (error) {
      console.error('Erreur action:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
      className="bg-white border border-gray-200/60 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 hover:shadow-lg hover:shadow-gray-900/5 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5 lg:mb-6">
        <div>
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900">Demandes en attente</h2>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5">
            Nécessitent une action rapide
          </p>
        </div>
        <button
          onClick={() => router.push('/prestataire/demandes-recues')}
          className="text-xs sm:text-sm font-semibold text-[#823F91] hover:text-[#6D3478] transition-colors flex items-center gap-1"
        >
          Voir tout
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune demande en attente</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-white border border-gray-200/60 hover:border-[#823F91]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-gradient-to-br from-[#823F91]/10 to-[#9D5FA8]/10 rounded-lg flex-shrink-0">
                    <Bell className="h-4 w-4 text-[#823F91]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Demande de {request.couple_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(request.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Button
                  size="sm"
                  onClick={() => handleAction(request.id, 'accept')}
                  className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white h-8 text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Accepter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(request.id, 'reject')}
                  className="flex-1 border-gray-200 hover:border-gray-300 h-8 text-xs"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Refuser
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
