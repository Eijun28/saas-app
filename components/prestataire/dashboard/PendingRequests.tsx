'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Clock, CheckCircle2, XCircle, ArrowRight, Inbox, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { getCouplesByUserIds, formatCoupleName } from '@/lib/supabase/queries/couples.queries'
import { cn } from '@/lib/utils'

interface PendingRequest {
  id: string
  couple_name: string
  created_at: string
  event_date?: string
}

type FilterMode = 'all' | 'recent' | 'urgent'

export function PendingRequests() {
  const router = useRouter()
  const { user } = useUser()
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

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
          .limit(5)

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

  // Filtrer les demandes selon le mode de filtrage
  const filteredRequests = requests.filter(request => {
    const now = new Date()
    const createdAt = new Date(request.created_at)
    const diffHours = (now.getTime() - createdAt.getTime()) / 3600000

    if (filterMode === 'all') {
      return true
    } else if (filterMode === 'recent') {
      // Demandes des dernières 24h
      return diffHours <= 24
    } else if (filterMode === 'urgent') {
      // Demandes dont l'événement approche (moins de 30 jours) ou anciennes demandes (plus de 3 jours)
      if (request.event_date) {
        const eventDate = new Date(request.event_date)
        const daysUntilEvent = (eventDate.getTime() - now.getTime()) / 86400000
        return daysUntilEvent <= 30 && daysUntilEvent > 0
      }
      // Si pas de date d'événement, considérer urgent si plus de 3 jours d'attente
      return diffHours >= 72
    }
    return true
  })

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

  // Pill component for filter selection
  const FilterPill = ({
    label,
    value,
    active,
    count
  }: {
    label: string
    value: FilterMode
    active: boolean
    count?: number
  }) => (
    <button
      onClick={() => setFilterMode(value)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
        active
          ? "bg-[#823F91] text-white shadow-sm"
          : "text-gray-600 hover:text-[#823F91] hover:bg-gray-50"
      )}
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
          active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
        )}>
          {count}
        </span>
      )}
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col"
    >
      {/* Header avec fond blanc ivoire et pills */}
      <div className="bg-gradient-to-r from-[#FBF8F3] to-[#FAF9F6] px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] sm:text-lg font-bold text-gray-900 tracking-tight">Demandes en attente</h2>
            <p className="text-[12px] sm:text-sm text-gray-400 mt-0.5 font-medium">
              Nécessitent une action rapide
            </p>
          </div>
          <button
            onClick={() => router.push('/prestataire/demandes-recues')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#823F91] hover:bg-[#6D3478] rounded-full text-white text-xs font-medium transition-colors"
          >
            Voir tout
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Pills de filtrage */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-full w-fit">
          <FilterPill label="Toutes" value="all" active={filterMode === 'all'} count={requests.length} />
          <FilterPill label="Récentes" value="recent" active={filterMode === 'recent'} />
          <FilterPill label="Urgentes" value="urgent" active={filterMode === 'urgent'} />
        </div>
      </div>

      {/* Contenu avec scroll caché */}
      <div
        className="flex-1 p-4 sm:p-5 overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
              <Inbox className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {filterMode === 'recent' ? 'Aucune demande récente' :
               filterMode === 'urgent' ? 'Aucune demande urgente' :
               'Aucune demande en attente'}
            </p>
            <p className="text-xs text-gray-500">
              {filterMode === 'recent' ? 'Pas de demande dans les dernières 24h' :
               filterMode === 'urgent' ? 'Aucune demande nécessitant une action urgente' :
               'Les nouvelles demandes apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-4 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 border border-transparent hover:border-[#823F91]/10 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm">
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

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(request.id, 'accept')}
                    className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white h-9 text-xs font-medium rounded-xl"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(request.id, 'reject')}
                    className="flex-1 border-gray-200 hover:border-gray-300 hover:bg-gray-100 h-9 text-xs font-medium rounded-xl"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Refuser
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
