'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { getCached, setCached } from '@/lib/cache'

export interface NotificationCounts {
  unreadMessages: number
  newRequests: number
}

interface UseNotificationsOptions {
  /** Pass true/false when the role is already known to skip the extra DB lookup */
  isCouple?: boolean
}

const NOTIF_TTL = 30_000 // 30 seconds cache for notifications

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

    const CACHE_KEY = `notifications-${user.id}`

    const loadNotifications = async (skipCache = false) => {
      // Serve cached counts instantly to avoid flash of zeros
      if (!skipCache) {
        const cached = getCached<NotificationCounts>(CACHE_KEY, NOTIF_TTL)
        if (cached) {
          setCounts(cached)
          setLoading(false)
          return
        }
      }

      const supabase = createClient()

      try {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        // Round 1: conversations + role check in parallel
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

        const result: NotificationCounts = {
          unreadMessages: (unreadResult as any).count ?? 0,
          newRequests: (requestsResult as any).count ?? 0,
        }

        setCounts(result)
        setCached(CACHE_KEY, result)
      } catch (error) {
        console.error('Erreur chargement notifications:', error)
        setCounts({ unreadMessages: 0, newRequests: 0 })
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    // Refresh every 30 seconds (skip cache for interval refreshes)
    const interval = setInterval(() => loadNotifications(true), 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  return { counts, loading }
}
