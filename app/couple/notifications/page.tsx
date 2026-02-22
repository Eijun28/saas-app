'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { PageTitle } from '@/components/couple/shared/PageTitle'

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
    if (!user) return

    setLoading(true)

    // Notifications désactivées temporairement
    // Les notifications seront réactivées avec un nouveau système
    setNotifications([])

    setLoading(false)
  }

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      <PageTitle
        title="Notifications"
        description="Restez informé de toutes vos activités"
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-8 sm:p-12 text-center">
              <Bell className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-200" />
              <p className="text-gray-600 font-medium mb-1">Aucune notification</p>
              <p className="text-sm text-gray-400">
                Vous n&apos;avez aucune notification pour le moment.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
            >
              <Card className="border-gray-100 hover:shadow-md transition-all duration-150 hover:border-[#823F91]/15 cursor-pointer rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#823F91]/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#823F91]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5">{notif.title}</h3>
                      <p className="text-sm text-gray-600 mb-1 leading-snug">{notif.content}</p>
                      <p className="text-xs text-gray-400">{new Date(notif.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
