'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowRight, CalendarDays, CalendarRange } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { cn } from '@/lib/utils'

interface Evenement {
  id: string
  titre: string
  date: string
  heure_debut?: string
}

type ViewMode = 'upcoming' | 'week' | 'month'

export function AgendaPreview() {
  const router = useRouter()
  const { user } = useUser()
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('upcoming')

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

  // Filtrer les événements selon le mode de vue
  const filteredEvenements = evenements.filter(event => {
    const eventDate = new Date(event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (viewMode === 'upcoming') {
      // Tous les événements à venir (déjà filtré par la requête)
      return true
    } else if (viewMode === 'week') {
      // Événements de cette semaine
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
      return eventDate >= today && eventDate <= endOfWeek
    } else if (viewMode === 'month') {
      // Événements de ce mois
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return eventDate >= today && eventDate <= endOfMonth
    }
    return true
  })

  // Pill component for view mode selection
  const ViewPill = ({
    icon: Icon,
    label,
    value,
    active
  }: {
    icon: typeof Calendar
    label: string
    value: ViewMode
    active: boolean
  }) => (
    <button
      onClick={() => setViewMode(value)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
        active
          ? "bg-[#823F91] text-white shadow-sm"
          : "text-gray-600 hover:text-[#823F91] hover:bg-gray-50"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )

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

        {/* Pills de sélection */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-full w-fit">
          <ViewPill icon={Calendar} label="À venir" value="upcoming" active={viewMode === 'upcoming'} />
          <ViewPill icon={CalendarDays} label="Semaine" value="week" active={viewMode === 'week'} />
          <ViewPill icon={CalendarRange} label="Mois" value="month" active={viewMode === 'month'} />
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
        ) : filteredEvenements.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
              <Calendar className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {viewMode === 'week' ? 'Aucun événement cette semaine' :
               viewMode === 'month' ? 'Aucun événement ce mois' :
               'Aucun événement à venir'}
            </p>
            <p className="text-xs text-gray-500">Vos prochains rendez-vous apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEvenements.map((event, index) => (
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
