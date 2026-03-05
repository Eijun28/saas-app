'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseTypingIndicatorOptions {
  conversationId: string | null
  userId: string | null
  userName?: string
}

interface TypingUser {
  userId: string
  userName: string
}

export function useTypingIndicator({
  conversationId,
  userId,
  userName = '',
}: UseTypingIndicatorOptions) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  useEffect(() => {
    if (!conversationId || !userId) return

    const supabase = createClient()
    const channelName = `typing:${conversationId}`

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: TypingUser[] = []
        for (const [key, presences] of Object.entries(state)) {
          if (key === userId) continue
          const presence = presences[0] as { userId?: string; userName?: string; isTyping?: boolean }
          if (presence?.isTyping) {
            users.push({
              userId: presence.userId || key,
              userName: presence.userName || 'Quelqu\'un',
            })
          }
        }
        setTypingUsers(users)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [conversationId, userId])

  const startTyping = useCallback(() => {
    if (!channelRef.current || !userId || isTypingRef.current) return

    isTypingRef.current = true
    channelRef.current.track({
      userId,
      userName,
      isTyping: true,
    })

    // Auto-stop after 3 seconds of no input
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [userId, userName])

  const stopTyping = useCallback(() => {
    if (!channelRef.current || !userId) return

    isTypingRef.current = false
    channelRef.current.track({
      userId,
      userName,
      isTyping: false,
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [userId, userName])

  const onInputChange = useCallback(() => {
    startTyping()

    // Reset the auto-stop timeout on each keystroke
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [startTyping, stopTyping])

  return {
    typingUsers,
    onInputChange,
    stopTyping,
  }
}
