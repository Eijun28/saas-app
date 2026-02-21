'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'

export interface NotificationCounts {
  unreadMessages: number
  newRequests: number
}

interface UseNotificationsOptions {
  /** Pass true/false when the role is already known to skip the extra DB lookup */
  isCouple?: boolean
}

export function useNotifications(options?: UseNotificationsOptions) {
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
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        // Round 1: fetch conversations + role check in parallel
        // If isCouple is already known, skip the couples table lookup entirely
        const [conversationsResult, coupleCheckResult] = await Promise.all([
          supabase
            .from('conversations')
            .select('id')
            .or(`couple_id.eq.${user.id},provider_id.eq.${user.id}`),
          options?.isCouple !== undefined
            ? Promise.resolve(null) // role already known — skip DB call
            : supabase
                .from('couples')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle(),
        ])

        const conversations = conversationsResult.data ?? []
        const isCouple =
          options?.isCouple !== undefined
            ? options.isCouple
            : !!coupleCheckResult?.data

        const conversationIds = conversations.map((c) => c.id)

        // Round 2: unread messages + requests count in parallel
        const [unreadResult, requestsResult] = await Promise.all([
          conversationIds.length > 0
            ? supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .in('conversation_id', conversationIds)
                .neq('sender_id', user.id)
                .is('read_at', null)
            : Promise.resolve({ count: 0 }),
          isCouple
            ? supabase
                .from('requests')
                .select('id', { count: 'exact', head: true })
                .eq('couple_id', user.id)
                .eq('status', 'accepted')
                .gte('responded_at', sevenDaysAgo.toISOString())
            : supabase
                .from('requests')
                .select('id', { count: 'exact', head: true })
                .eq('provider_id', user.id)
                .eq('status', 'pending'),
        ])

        setCounts({
          unreadMessages: unreadResult.count ?? 0,
          newRequests: requestsResult.count ?? 0,
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
