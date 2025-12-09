'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getUnreadConversationsCount } from '@/lib/supabase/messages'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import Link from 'next/link'

export function MessageNotifications() {
  const { user } = useUser()
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadConversationsCount(user.id)
        setUnreadCount(count)
      } catch (error) {
        console.error('Erreur lors du chargement du compteur:', error)
      }
    }

    loadUnreadCount()

    // Realtime subscription pour mettre à jour le compteur
    const channel = supabase
      .channel('unread-count-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        async () => {
          // Recharger le compteur
          const count = await getUnreadConversationsCount(user.id)
          setUnreadCount(count)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async () => {
          // Recharger le compteur
          const count = await getUnreadConversationsCount(user.id)
          setUnreadCount(count)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  if (!user) return null

  return (
    <Link href="/messages" className="relative">
      <Bell className="h-5 w-5 text-gray-600 hover:text-[#823F91] transition-colors" />
      {unreadCount > 0 && (
        <Badge
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Link>
  )
}

