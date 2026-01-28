'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'

export interface NotificationCounts {
  unreadMessages: number
  newRequests: number
}

export function useNotifications() {
  const { user } = useUser()
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    newRequests: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const loadNotifications = async () => {
      const supabase = createClient()

      try {
        // Récupérer toutes les conversations de l'utilisateur
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`couple_id.eq.${user.id},provider_id.eq.${user.id}`)

        if (!conversations || conversations.length === 0) {
          setCounts({ unreadMessages: 0, newRequests: 0 })
          setLoading(false)
          return
        }

        const conversationIds = conversations.map(c => c.id)

        // Compter les messages non lus dans toutes les conversations
        const { count: unreadMessages } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', user.id)
          .is('read_at', null)

        // Déterminer si l'utilisateur est un couple ou un prestataire
        const { data: coupleData } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        const isCouple = !!coupleData

        let newRequests = 0
        if (isCouple) {
          // Pour les couples : compter les nouvelles demandes acceptées (statut 'accepted' créées récemment)
          // On considère comme "nouvelles" les demandes acceptées dans les 7 derniers jours
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          
          const { count: acceptedRequests } = await supabase
            .from('requests')
            .select('id', { count: 'exact', head: true })
            .eq('couple_id', user.id)
            .eq('status', 'accepted')
            .gte('responded_at', sevenDaysAgo.toISOString())
          
          newRequests = acceptedRequests || 0
        } else {
          // Pour les prestataires : compter les nouvelles demandes (statut 'pending')
          const { count: pendingRequests } = await supabase
            .from('requests')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', user.id)
            .eq('status', 'pending')
          
          newRequests = pendingRequests || 0
        }

        setCounts({
          unreadMessages: unreadMessages || 0,
          newRequests: newRequests || 0,
        })
      } catch (error) {
        console.error('Erreur chargement notifications:', error)
        setCounts({ unreadMessages: 0, newRequests: 0 })
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  return { counts, loading }
}
