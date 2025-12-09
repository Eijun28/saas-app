'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'

export default function NotificationsPage() {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Pour l'instant, on récupère les messages non lus comme notifications
    // À adapter selon votre système de notifications
    const { data: conversations } = await supabase
      .from('conversations')
      .select(`
        *,
        messages:messages!inner(
          id,
          content,
          is_read,
          created_at
        )
      `)
      .eq('couple_id', user.id)
      .order('last_message_at', { ascending: false })
      .limit(20)

    if (conversations) {
      const notifs = conversations
        .filter((conv: any) => conv.messages?.some((msg: any) => !msg.is_read))
        .map((conv: any) => ({
          id: conv.id,
          type: 'message',
          title: 'Nouveau message',
          content: conv.messages?.[0]?.content || 'Vous avez un nouveau message',
          date: conv.last_message_at,
        }))
      setNotifications(notifs)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-semibold text-[#0D0D0D]">
            Notifications
          </h1>
          <p className="text-[#4A4A4A]">
            Restez informé de toutes vos activités
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#4A4A4A]">Chargement...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-[#4A4A4A]">
                Vous n'avez aucune notification pour le moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#823F91] flex items-center justify-center flex-shrink-0">
                        <Bell className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#0D0D0D] mb-1">
                          {notif.title}
                        </h3>
                        <p className="text-sm text-[#4A4A4A] mb-2">
                          {notif.content}
                        </p>
                        <p className="text-xs text-[#4A4A4A]">
                          {new Date(notif.date).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

