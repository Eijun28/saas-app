'use client'

import { Bell, Search, User, LogOut, MessageSquare, Wallet, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUser } from '@/hooks/use-user'
import { signOut } from '@/lib/auth/actions'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/ui/user-avatar'

interface TopBarProps {
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

interface Notification {
  id: string
  type: 'message' | 'budget' | 'timeline'
  title: string
  description: string
  time: string
  href: string
}

export function TopBar({ title, breadcrumbs }: TopBarProps) {
  const { user } = useUser()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  useEffect(() => {
    if (user) {
      const supabase = createClient()
      supabase
        .from('profiles')
        .select('prenom, nom, photo_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setProfile(data)
          if (data?.photo_url) {
            setPhotoUrl(data.photo_url)
          }
        })
      
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    const supabase = createClient()
    const allNotifications: Notification[] = []

    try {
      // Récupérer les 3 derniers messages reçus (non lus et où l'utilisateur n'est pas l'expéditeur)
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, couple_id, last_message_at')
        .eq('couple_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(3)

      if (conversations && conversations.length > 0) {
        for (const conv of conversations) {
          const { data: messages } = await supabase
            .from('messages')
            .select('id, sender_id, content, created_at')
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (messages) {
            allNotifications.push({
              id: messages.id,
              type: 'message',
              title: 'Nouveau message',
              description: messages.content?.substring(0, 50) || 'Nouveau message reçu',
              time: new Date(messages.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
              href: '/couple/messagerie'
            })
          }
        }
      }

      // Récupérer les 3 dernières dépenses créées/modifiées
      const { data: budgetItems } = await supabase
        .from('budget_items')
        .select('id, title, amount, updated_at')
        .eq('couple_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3)

      if (budgetItems && budgetItems.length > 0) {
        budgetItems.forEach((item) => {
          allNotifications.push({
            id: item.id,
            type: 'budget',
            title: 'Dépense mise à jour',
            description: `${item.title} - ${item.amount}€`,
            time: new Date(item.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            href: '/couple/budget'
          })
        })
      }

      // Récupérer les 3 derniers événements créés/modifiés
      const { data: timelineEvents } = await supabase
        .from('timeline_events')
        .select('id, title, event_date, updated_at')
        .eq('couple_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3)

      if (timelineEvents && timelineEvents.length > 0) {
        timelineEvents.forEach((event) => {
          allNotifications.push({
            id: event.id,
            type: 'timeline',
            title: 'Événement mis à jour',
            description: event.title,
            time: new Date(event.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            href: '/couple/timeline'
          })
        })
      }

      // Trier par date et prendre les 3 plus récents
      allNotifications.sort((a, b) => {
        // Convertir les dates de format "12 jan" en timestamp pour trier
        const dateA = new Date(a.time).getTime()
        const dateB = new Date(b.time).getTime()
        return dateB - dateA
      })

      setNotifications(allNotifications.slice(0, 3))
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      window.location.href = '/'
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Rediriger vers une page de résultats de recherche ou filtrer
      router.push(`/couple/recherche?q=${encodeURIComponent(searchQuery)}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      case 'budget':
        return <Wallet className="h-4 w-4" />
      case 'timeline':
        return <Calendar className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] px-4 md:px-6 lg:px-8 py-3 md:py-4"
    >
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-2 text-sm text-[#374151]">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-2">
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-[#823F91] transition-colors">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-[#0B0E12] font-medium">{crumb.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && <span>/</span>}
                </span>
              ))}
            </nav>
          ) : (
            <h1 className="text-xl md:text-2xl font-bold text-[#0B0E12]">{title || 'Dashboard'}</h1>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Search Popover */}
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <div
              onMouseEnter={() => setIsSearchOpen(true)}
              onMouseLeave={() => setIsSearchOpen(false)}
              className="relative"
            >
              <PopoverTrigger asChild>
                <button
                  className="p-2 rounded-lg hover:bg-[#E8D4EF] transition-colors"
                  title="Recherche"
                >
                  <Search className="h-5 w-5 text-[#374151]" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-4" 
                align="end"
                onMouseEnter={() => setIsSearchOpen(true)}
                onMouseLeave={() => setIsSearchOpen(false)}
              >
                <form onSubmit={handleSearch} className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#823F91] text-white px-4 py-2 rounded-lg hover:bg-[#6D3478] transition-colors text-sm font-medium"
                  >
                    Rechercher
                  </button>
                </form>
              </PopoverContent>
            </div>
          </Popover>

          {/* Notifications Popover */}
          <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <div
              onMouseEnter={() => setIsNotificationsOpen(true)}
              onMouseLeave={() => setIsNotificationsOpen(false)}
              className="relative"
            >
              <PopoverTrigger asChild>
                <button
                  className="relative p-2 rounded-lg hover:bg-[#E8D4EF] transition-colors"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-[#374151]" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-[#823F91] rounded-full" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-0" 
                align="end"
                onMouseEnter={() => setIsNotificationsOpen(true)}
                onMouseLeave={() => setIsNotificationsOpen(false)}
              >
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-[#4A4A4A]">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucune notification</p>
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-[#0B0E12]">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-[#E8D4EF]/50 transition-colors border-b border-gray-100 last:border-b-0 cursor-default"
                        >
                          <div className={`mt-1 ${
                            notif.type === 'message' ? 'text-blue-500' :
                            notif.type === 'budget' ? 'text-green-500' :
                            'text-purple-500'
                          }`}>
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0B0E12] truncate">
                              {notif.title}
                            </p>
                            <p className="text-xs text-[#4A4A4A] truncate mt-1">
                              {notif.description}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-1">{notif.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </PopoverContent>
            </div>
          </Popover>

          {/* User profile */}
          <div className="flex items-center gap-3">
            {profile && (
              <>
                <UserAvatar
                  src={photoUrl}
                  fallback={`${profile.prenom || ''} ${profile.nom || ''}`.trim() || user?.email}
                  size="md"
                  status="online"
                />
                <span className="text-sm text-[#374151] hidden md:block">
                  {profile.prenom} {profile.nom}
                </span>
              </>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#E8D4EF] transition-colors"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4 text-[#374151]" />
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

