'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './use-user'

interface NotificationCounts {
  demandes: number
  agenda: number
}

export function useNotifications() {
  const { user } = useUser()
  const [counts, setCounts] = useState<NotificationCounts>({ demandes: 0, agenda: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCounts({ demandes: 0, agenda: 0 })
      setLoading(false)
      return
    }

    const fetchNotifications = async () => {
      const supabase = createClient()
      
      try {
        // Vérifier si l'utilisateur est un prestataire ou un couple
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, service_type')
          .eq('id', user.id)
          .single()

        const isPrestataire = profile?.service_type !== null

        if (isPrestataire) {
          // Pour prestataire : demandes reçues en attente
          const { count: demandesCount } = await supabase
            .from('requests')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', user.id)
            .eq('status', 'pending')

          // Pour prestataire : événements à venir
          const { count: agendaCount } = await supabase
            .from('evenements_prestataire')
            .select('id', { count: 'exact', head: true })
            .eq('prestataire_id', user.id)
            .gte('date', new Date().toISOString().split('T')[0])

          setCounts({
            demandes: demandesCount || 0,
            agenda: agendaCount || 0,
          })
        } else {
          // Pour couple : récupérer le couple_id pour les événements
          const { data: couple } = await supabase
            .from('couples')
            .select('id')
            .eq('user_id', user.id)
            .single()

          // Pour couple : demandes envoyées en attente
          // Note: requests.couple_id référence couples.user_id directement
          const { count: demandesCount } = await supabase
            .from('requests')
            .select('id', { count: 'exact', head: true })
            .eq('couple_id', user.id)
            .eq('status', 'pending')

          let agendaCount = 0
          if (couple) {
            // Pour couple : événements à venir dans timeline
            const { count } = await supabase
              .from('timeline_events')
              .select('id', { count: 'exact', head: true })
              .eq('couple_id', couple.id)
              .gte('event_date', new Date().toISOString().split('T')[0])
            agendaCount = count || 0
          }

          setCounts({
            demandes: demandesCount || 0,
            agenda: agendaCount,
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error)
        setCounts({ demandes: 0, agenda: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [user])

  return { counts, loading }
}
