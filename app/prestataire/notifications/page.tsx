'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bell,
  CheckCircle,
  MessageSquare,
  Star,
  Inbox,
  CheckCheck,
  UserPlus,
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'new_request' | 'new_message' | 'new_review' | 'request_completed'
  title: string
  content: string
  href: string
  created_at: string
  read: boolean
}

const NOTIF_ICONS: Record<string, typeof Bell> = {
  new_request: UserPlus,
  new_message: MessageSquare,
  new_review: Star,
  request_completed: CheckCircle,
}

const NOTIF_COLORS: Record<string, string> = {
  new_request: 'bg-[#823F91]/10 text-[#823F91]',
  new_message: 'bg-blue-50 text-blue-600',
  new_review: 'bg-amber-50 text-amber-600',
  request_completed: 'bg-emerald-50 text-emerald-600',
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "A l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export default function PrestaNotificationsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadNotifications()
  }, [user])

  const loadNotifications = async () => {
    if (!user) return
    setLoading(true)
    const supabase = createClient()
    const notifs: Notification[] = []

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // New requests (last 30 days)
    const { data: requests } = await supabase
      .from('requests')
      .select('id, couple_id, status, created_at')
      .eq('provider_id', user.id)
      .eq('status', 'pending')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(20)

    if (requests?.length) {
      const coupleUserIds = [...new Set(requests.map(r => r.couple_id))]
      const { data: couples } = await supabase
        .from('couples')
        .select('user_id, partner_1_name, partner_2_name')
        .in('user_id', coupleUserIds)

      const coupleMap = new Map(
        couples?.map(c => {
          const name = [c.partner_1_name, c.partner_2_name].filter(Boolean).join(' & ') || 'Un couple'
          return [c.user_id, name]
        }) ?? []
      )

      for (const req of requests) {
        const name = coupleMap.get(req.couple_id) || 'Un couple'
        notifs.push({
          id: `req-${req.id}`,
          type: 'new_request',
          title: 'Nouvelle demande',
          content: `${name} vous a envoyé une demande de prestation.`,
          href: '/prestataire/demandes-recues',
          created_at: req.created_at,
          read: false,
        })
      }
    }

    // Unread messages (last 7 days)
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, couple_id')
      .eq('prestataire_id', user.id)

    if (conversations?.length) {
      const convIds = conversations.map(c => c.id)
      const coupleMap2 = new Map(conversations.map(c => [c.id, c.couple_id]))

      const { data: messages } = await supabase
        .from('messages')
        .select('id, conversation_id, content, created_at, sender_id')
        .in('conversation_id', convIds)
        .neq('sender_id', user.id)
        .is('read_at', null)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(10)

      if (messages?.length) {
        const coupleUserIds = [...new Set(messages.map(m => coupleMap2.get(m.conversation_id)).filter(Boolean))] as string[]
        const { data: msgCouples } = await supabase
          .from('couples')
          .select('user_id, partner_1_name, partner_2_name')
          .in('user_id', coupleUserIds)

        const msgCoupleMap = new Map(
          msgCouples?.map(c => {
            const name = [c.partner_1_name, c.partner_2_name].filter(Boolean).join(' & ') || 'Un couple'
            return [c.user_id, name]
          }) ?? []
        )

        const seenConvs = new Set<string>()
        for (const msg of messages) {
          if (seenConvs.has(msg.conversation_id)) continue
          seenConvs.add(msg.conversation_id)

          const coupleUserId = coupleMap2.get(msg.conversation_id)
          const name = coupleUserId ? msgCoupleMap.get(coupleUserId) || 'Un couple' : 'Un couple'

          notifs.push({
            id: `msg-${msg.id}`,
            type: 'new_message',
            title: 'Nouveau message',
            content: `${name} vous a envoyé un message`,
            href: '/prestataire/messagerie',
            created_at: msg.created_at,
            read: false,
          })
        }
      }
    }

    // New reviews (last 30 days)
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, couple_id, rating, comment, created_at')
      .eq('provider_id', user.id)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(10)

    if (reviews?.length) {
      const coupleUserIds = [...new Set(reviews.map(r => r.couple_id))]
      const { data: revCouples } = await supabase
        .from('couples')
        .select('user_id, partner_1_name, partner_2_name')
        .in('user_id', coupleUserIds)

      const revCoupleMap = new Map(
        revCouples?.map(c => {
          const name = [c.partner_1_name, c.partner_2_name].filter(Boolean).join(' & ') || 'Un couple'
          return [c.user_id, name]
        }) ?? []
      )

      for (const rev of reviews) {
        const name = revCoupleMap.get(rev.couple_id) || 'Un couple'
        notifs.push({
          id: `rev-${rev.id}`,
          type: 'new_review',
          title: 'Nouvel avis',
          content: `${name} vous a laissé un avis (${rev.rating}/5)`,
          href: '/prestataire/avis',
          created_at: rev.created_at,
          read: false,
        })
      }
    }

    // Completed requests (last 30 days)
    const { data: completedReqs } = await supabase
      .from('requests')
      .select('id, couple_id, created_at, updated_at')
      .eq('provider_id', user.id)
      .eq('status', 'completed')
      .gte('updated_at', thirtyDaysAgo)
      .order('updated_at', { ascending: false })
      .limit(10)

    if (completedReqs?.length) {
      const coupleUserIds = [...new Set(completedReqs.map(r => r.couple_id))]
      const { data: compCouples } = await supabase
        .from('couples')
        .select('user_id, partner_1_name, partner_2_name')
        .in('user_id', coupleUserIds)

      const compCoupleMap = new Map(
        compCouples?.map(c => {
          const name = [c.partner_1_name, c.partner_2_name].filter(Boolean).join(' & ') || 'Un couple'
          return [c.user_id, name]
        }) ?? []
      )

      for (const req of completedReqs) {
        const name = compCoupleMap.get(req.couple_id) || 'Un couple'
        notifs.push({
          id: `comp-${req.id}`,
          type: 'request_completed',
          title: 'Prestation terminee',
          content: `Votre prestation avec ${name} est marquee comme terminee.`,
          href: '/prestataire/demandes-recues',
          created_at: req.updated_at || req.created_at,
          read: false,
        })
      }
    }

    notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setNotifications(notifs)
    setLoading(false)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageTitle
          title="Notifications"
          description="Suivez vos demandes, messages et avis"
        />
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-[#823F91] gap-1.5 mt-1"
            onClick={() => {
              setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            }}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Tout marquer lu
          </Button>
        )}
      </div>

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
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <Inbox className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-600 font-medium mb-1">Aucune notification</p>
              <p className="text-sm text-gray-400">
                Vos notifications apparaitront ici lorsque des couples vous contacteront.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, index) => {
            const Icon = NOTIF_ICONS[notif.type] || Bell
            const colorClass = NOTIF_COLORS[notif.type] || 'bg-gray-50 text-gray-500'

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <button
                  onClick={() => router.push(notif.href)}
                  className={cn(
                    "w-full text-left bg-white border rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all duration-150 cursor-pointer",
                    notif.read
                      ? "border-gray-100 opacity-70"
                      : "border-gray-200 hover:border-[#823F91]/15"
                  )}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={cn("h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{notif.title}</h3>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#823F91] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-snug">{notif.content}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notif.created_at)}</p>
                    </div>
                  </div>
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
