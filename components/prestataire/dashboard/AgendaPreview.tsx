'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'

interface Evenement {
  id: string
  titre: string
  date: string
  heure_debut?: string
}

export function AgendaPreview() {
  const router = useRouter()
  const { user } = useUser()
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchEvenements = async () => {
      try {
        const supabase = createClient()
        const today = new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
          .from('evenements_prestataire')
          .select('id, titre, date, heure_debut')
          .eq('prestataire_id', user.id)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(5)

        if (error) {
          console.error('Erreur chargement événements:', error)
          return
        }

        setEvenements(data || [])
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvenements()
  }, [user])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain'
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col"
    >
      {/* Header avec fond blanc ivoire et pills */}
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Apercu Agenda</h2>
            <p className="text-xs sm:text-[13px] text-gray-400 mt-0.5">
              Prochains rendez-vous
            </p>
          </div>
          <button
            onClick={() => router.push('/prestataire/agenda')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#823F91] hover:bg-[#6D3478] rounded-full text-white text-xs font-medium transition-colors"
          >
            Voir tout
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
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
        ) : evenements.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
              <Calendar className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Aucun événement à venir
            </p>
            <p className="text-xs text-gray-500">Vos prochains rendez-vous apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-2">
            {evenements.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 border border-transparent hover:border-[#823F91]/10 transition-all cursor-pointer group"
                onClick={() => router.push('/prestataire/agenda')}
              >
                <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:shadow transition-shadow">
                  <Calendar className="h-4 w-4 text-[#823F91]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {event.titre}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatDate(event.date)}
                      {event.heure_debut && ` • ${event.heure_debut}`}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#823F91] group-hover:translate-x-0.5 transition-all" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
