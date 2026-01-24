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
          .limit(3)

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
      className="bg-white border border-gray-200/60 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 hover:shadow-lg hover:shadow-gray-900/5 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5 lg:mb-6">
        <div>
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900">Aperçu Agenda</h2>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5">
            Prochains rendez-vous
          </p>
        </div>
        <button
          onClick={() => router.push('/prestataire/agenda')}
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
      ) : evenements.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucun événement à venir</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
          {evenements.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center gap-2 sm:gap-2.5 md:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-white border border-gray-200/60 hover:border-[#823F91]/30 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => router.push('/prestataire/agenda')}
            >
              <div className="p-2 bg-gradient-to-br from-[#823F91]/10 to-[#9D5FA8]/10 rounded-lg flex-shrink-0">
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
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
