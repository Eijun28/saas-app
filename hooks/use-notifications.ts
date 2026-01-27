'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'

interface NotificationCounts {
  demandes: number
  messages: number
}

export function useNotifications(role: 'couple' | 'prestataire') {
  const { user } = useUser()
  const [counts, setCounts] = useState<NotificationCounts>({
    demandes: 0,
    messages: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    let demandesChannel: any = null
    let messagesChannel: any = null

    const loadCounts = async () => {
      try {
        if (role === 'prestataire') {
          // Compter les nouvelles demandes pour les prestataires
          const { count: demandesCount } = await supabase
            .from('demandes')
            .select('*', { count: 'exact', head: true })
            .eq('prestataire_id', user.id)
            .eq('statut', 'nouvelle')

          setCounts((prev) => ({
            ...prev,
            demandes: demandesCount || 0,
          }))

          // Compter les messages non lus pour les prestataires
          const { data: conversations } = await supabase
            .from('conversations')
            .select('id, unread_count')
            .eq('prestataire_id', user.id)
            .eq('status', 'active')

          const messagesCount = (conversations || []).reduce(
            (sum: number, conv: any) => sum + (conv.unread_count || 0),
            0
          )

          setCounts((prev) => ({
            ...prev,
            messages: messagesCount,
          }))

          // Écouter les nouvelles demandes en temps réel
          demandesChannel = supabase
            .channel('prestataire-demandes')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'demandes',
                filter: `prestataire_id=eq.${user.id}`,
              },
              () => {
                loadCounts()
              }
            )
            .subscribe()
        } else {
          // Pour les couples, compter les messages non lus
          const { data: conversations } = await supabase
            .from('conversations')
            .select('id, unread_count')
            .eq('couple_id', user.id)
            .eq('status', 'active')

          const messagesCount = (conversations || []).reduce(
            (sum: number, conv: any) => sum + (conv.unread_count || 0),
            0
          )

          setCounts((prev) => ({
            ...prev,
            messages: messagesCount,
          }))
        }

        // Écouter les nouveaux messages en temps réel
        messagesChannel = supabase
          .channel('user-messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
            },
            () => {
              loadCounts()
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'conversations',
            },
            () => {
              loadCounts()
            }
          )
          .subscribe()
      } catch (error) {
        console.error('Erreur chargement notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCounts()

    return () => {
      if (demandesChannel) {
        supabase.removeChannel(demandesChannel)
      }
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel)
      }
    }
  }, [user, role])

  return { counts, loading }
}
