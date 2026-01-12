'use client'

import { Bell, Inbox, Calendar, MessageSquare, Menu, Wallet } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth/actions'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

import ProfileDropdown from '@/components/shadcn-studio/blocks/dropdown-profile'

const getBreadcrumbs = (pathname: string) => {
  const paths = pathname.split('/').filter(Boolean)
  const breadcrumbs: Array<{ label: string; href?: string }> = []

  // Page d'accueil
  breadcrumbs.push({ label: 'Home', href: '/couple/dashboard' })

  if (paths.length > 1) {
    const page = paths[1]
    const pageLabels: Record<string, string> = {
      dashboard: 'Accueil',
      matching: 'Matching IA',
      timeline: 'Calendrier',
      messagerie: 'Messages',
      demandes: 'Demandes & Devis',
      budget: 'Budget',
      profil: 'Profil',
      collaborateurs: 'Collaborateurs',
      notifications: 'Notifications',
      recherche: 'Recherche'
    }

    if (pageLabels[page]) {
      if (paths.length === 2) {
        breadcrumbs.push({ label: pageLabels[page] })
      } else {
        breadcrumbs.push({ label: pageLabels[page], href: `/couple/${page}` })
        breadcrumbs.push({ label: 'Détails' })
      }
    }
  }

  return breadcrumbs
}

export function CoupleHeader() {
  const pathname = usePathname()
  const { user } = useUser()
  const { openMobile, setOpenMobile } = useSidebar()
  const [profile, setProfile] = useState<{
    name?: string
    email?: string
    avatar?: string
  } | null>(null)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'message' | 'budget' | 'timeline'
    title: string
    message: string
    date: string
    link?: string
  }>>([])
  const breadcrumbs = getBreadcrumbs(pathname || '')

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      const supabase = createClient()

      // Récupérer le profil du couple
      const { data: coupleData } = await supabase
        .from('couples')
        .select('partner_1_name, partner_2_name, avatar_url')
        .eq('user_id', user.id)
        .single()

      if (coupleData) {
        const name1 = coupleData.partner_1_name || ''
        const name2 = coupleData.partner_2_name || ''
        const displayName = name1 && name2 ? `${name1} & ${name2}` : name1 || name2 || 'Couple'
        
        setProfile({
          name: displayName,
          email: user.email || '',
          avatar: coupleData.avatar_url || undefined
        })
      } else {
        setProfile({
          name: 'Couple',
          email: user.email || '',
          avatar: undefined
        })
      }
    }

    loadProfile()
  }, [user])

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return

      const supabase = createClient()
      const notificationsList: Array<{
        id: string
        type: 'message' | 'budget' | 'timeline'
        title: string
        message: string
        date: string
        link?: string
      }> = []

      try {
        // Récupérer les messages non lus (sans relation inexistante)
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id, prestataire_id')
          .eq('couple_id', user.id)

        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map(c => c.id)
          
          const { data: messages } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id, conversation_id')
            .in('conversation_id', conversationIds)
            .neq('sender_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(5)

          if (messages) {
            // Récupérer les noms des prestataires séparément si nécessaire
            const prestataireIds = [...new Set(conversations.map((c: any) => c.prestataire_id).filter(Boolean))]
            const prestataireNames: Record<string, string> = {}
            
            if (prestataireIds.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, nom')
                .in('id', prestataireIds)
              
              if (profiles) {
                profiles.forEach((p: any) => {
                  prestataireNames[p.id] = p.nom || 'Un prestataire'
                })
              }
            }
            
            messages.forEach((message: any) => {
              const conversation: any = conversations.find(c => c.id === message.conversation_id)
              const prestataireNom = conversation?.prestataire_id ? prestataireNames[conversation.prestataire_id] || 'Un prestataire' : 'Un prestataire'
              notificationsList.push({
                id: message.id,
                type: 'message',
                title: 'Nouveau message',
                message: `${prestataireNom}: ${message.content?.substring(0, 50)}...`,
                date: message.created_at,
                link: '/couple/messagerie'
              })
            })
          }
        }

        // Récupérer les dépenses récentes
        const { data: budgetItems } = await supabase
          .from('budget_items')
          .select('id, title, amount, updated_at')
          .eq('couple_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(3)

        if (budgetItems) {
          budgetItems.forEach((item: any) => {
            notificationsList.push({
              id: item.id,
              type: 'budget',
              title: 'Dépense mise à jour',
              message: `${item.title} - ${item.amount}€`,
              date: item.updated_at,
              link: '/couple/budget'
            })
          })
        }

        // Récupérer les événements à venir
        const { data: timelineEvents } = await supabase
          .from('timeline_events')
          .select('id, title, event_date, updated_at')
          .eq('couple_id', user.id)
          .gte('event_date', new Date().toISOString().split('T')[0])
          .order('event_date', { ascending: true })
          .limit(3)

        if (timelineEvents) {
          timelineEvents.forEach((event: any) => {
            notificationsList.push({
              id: event.id,
              type: 'timeline',
              title: 'Événement à venir',
              message: event.title || 'Événement prévu',
              date: event.updated_at,
              link: '/couple/timeline'
            })
          })
        }

        // Trier par date (plus récent en premier)
        notificationsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setNotifications(notificationsList.slice(0, 10))
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error)
      }
    }

    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      window.location.href = '/'
    }
  }

  const getNotificationIcon = (type: 'message' | 'budget' | 'timeline') => {
    switch (type) {
      case 'message':
        return MessageSquare
      case 'budget':
        return Wallet
      case 'timeline':
        return Calendar
      default:
        return Bell
    }
  }

  const unreadCount = notifications.filter(n => n.type === 'message').length

  return (
    <header className='h-[4.5rem] md:h-16 bg-white/95 backdrop-blur-md sticky top-0 z-[55] border-b border-[#E5E7EB] w-full shadow-md shadow-black/5 flex items-center pointer-events-auto'>
      <div className='w-full flex items-center justify-between gap-6 px-5 sm:px-6'>
        <div className='flex items-center gap-4'>
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('🔥 Toggle clicked! openMobile before:', openMobile)
              setOpenMobile(!openMobile)
              console.log('🔥 setOpenMobile called with:', !openMobile)
            }}
            className={cn(
              'md:hidden z-[70] relative h-11 w-11 rounded-xl flex items-center justify-center bg-white border border-gray-200 hover:bg-[#823F91]/10 hover:border-[#823F91]/30 active:bg-[#823F91]/20 active:scale-95 transition-all duration-200 cursor-pointer touch-manipulation shadow-sm',
              openMobile 
                ? 'bg-gradient-to-br from-[#823F91]/20 to-[#9D5FA8]/20 border-[#823F91]/50' 
                : ''
            )}
            aria-label={openMobile ? 'Fermer le menu' : 'Ouvrir le menu'}
            style={{ pointerEvents: 'auto' }}
          >
            <Menu className='h-6 w-6 text-black flex-shrink-0' strokeWidth={2.5} />
          </button>
          <Breadcrumb className='hidden sm:block'>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className='flex items-center'>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
              <div className='flex items-center gap-3'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant='ghost' 
                      size='icon'
                      className='relative h-11 w-11 rounded-xl hover:bg-[#823F91]/10 transition-all duration-200 active:scale-[0.98]'
                    >
                      <Bell className='size-5' />
                      {unreadCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className='absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#823F91] text-white text-xs font-semibold flex items-center justify-center shadow-sm ring-2 ring-white'
                        >
                          <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </motion.span>
                        </motion.div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-80'>
                    <div className='p-2'>
                      <div className='px-2 py-1.5 text-sm font-semibold'>Notifications</div>
                      <div className='max-h-96 overflow-y-auto'>
                        {notifications.length === 0 ? (
                          <div className='px-2 py-8 text-center text-sm text-muted-foreground'>
                            Aucune notification
                          </div>
                        ) : (
                          notifications.map((notification) => {
                            const Icon = getNotificationIcon(notification.type)
                            return (
                              <DropdownMenuItem
                                key={notification.id}
                                className='flex items-start gap-3 p-3 cursor-pointer'
                                onClick={() => {
                                  if (notification.link) {
                                    window.location.href = notification.link
                                  }
                                }}
                              >
                                <div className='mt-0.5'>
                                  <Icon className='h-4 w-4 text-[#823F91]' />
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <div className='text-sm font-medium'>{notification.title}</div>
                                  <div className='text-xs text-muted-foreground truncate'>
                                    {notification.message}
                                  </div>
                                  <div className='text-xs text-muted-foreground mt-1'>
                                    {new Date(notification.date).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ProfileDropdown
                  trigger={
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button variant='ghost' className='h-auto gap-2 px-2 py-1.5 rounded-xl hover:bg-[#823F91]/10 transition-all duration-200'>
                        <Avatar className='h-9 w-9 rounded-xl ring-2 ring-[#823F91]/20 transition-all duration-200 hover:ring-[#823F91]/40'>
                          <AvatarImage src={profile?.avatar} alt={profile?.name} />
                          <AvatarFallback className='bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white font-semibold'>
                            {profile?.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2) || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <span className='hidden sm:block text-sm font-semibold text-gray-900'>
                          {profile?.name || 'Couple'}
                        </span>
                      </Button>
                    </motion.div>
                  }
                  user={profile || undefined}
                  onLogout={handleLogout}
                />
              </div>
      </div>
    </header>
  )
}

