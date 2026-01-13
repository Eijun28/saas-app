'use client'

import React, { useState, useEffect } from 'react'
import { Bell, PanelLeft, PanelLeftClose, Inbox, Calendar, MessageSquare } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth/actions'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import ProfileDropdown from '@/components/shadcn-studio/blocks/dropdown-profile'

export function PrestataireHeader() {
  const { user } = useUser()
  const { openMobile, setOpenMobile, toggleSidebar, state, isMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const [profile, setProfile] = useState<{
    name?: string
    email?: string
    avatar?: string
  } | null>(null)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'demande' | 'evenement' | 'message'
    title: string
    message: string
    date: string
    link?: string
  }>>([])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      const supabase = createClient()

      // Récupérer le profil du prestataire
      const { data: profileData } = await supabase
        .from('profiles')
        .select('prenom, nom, email, avatar_url')
        .eq('id', user.id)
        .single()

      if (profileData) {
        const fullName = [profileData.prenom, profileData.nom].filter(Boolean).join(' ') || 'Prestataire'
        setProfile({
          name: fullName,
          email: profileData.email || user.email || '',
          avatar: profileData.avatar_url || undefined
        })
      } else {
        setProfile({
          name: 'Prestataire',
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
        type: 'demande' | 'evenement' | 'message'
        title: string
        message: string
        date: string
        link?: string
      }> = []

      try {
        // Récupérer les nouvelles demandes
        const { data: demandes } = await supabase
          .from('demandes')
          .select('id, created_at, couple_id, profiles!demandes_couple_id_fkey(nom)')
          .eq('prestataire_id', user.id)
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(5)

        if (demandes) {
          demandes.forEach((demande: any) => {
            const coupleNom = demande.profiles?.nom || 'un couple'
            notificationsList.push({
              id: demande.id,
              type: 'demande',
              title: 'Nouvelle demande',
              message: `Nouvelle demande de ${coupleNom}`,
              date: demande.created_at,
              link: '/prestataire/demandes-recues'
            })
          })
        }

        // Récupérer les événements à venir
        const { data: evenements } = await supabase
          .from('events')
          .select('id, title, date, time')
          .eq('prestataire_id', user.id)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(5)

        if (evenements) {
          evenements.forEach((evenement: any) => {
            notificationsList.push({
              id: evenement.id,
              type: 'evenement',
              title: 'Événement à venir',
              message: evenement.title || 'Événement prévu',
              date: `${evenement.date}T${evenement.time}`,
              link: '/prestataire/agenda'
            })
          })
        }

        // Récupérer les messages non lus
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id, couple_id, profiles!conversations_couple_id_fkey(nom)')
          .eq('prestataire_id', user.id)

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
            messages.forEach((message: any) => {
              const conversation: any = conversations.find(c => c.id === message.conversation_id)
              const coupleNom = conversation?.profiles?.[0]?.nom || 'Un couple'
              notificationsList.push({
                id: message.id,
                type: 'message',
                title: 'Nouveau message',
                message: `${coupleNom}: ${message.content?.substring(0, 50)}...`,
                date: message.created_at,
                link: '/prestataire/messagerie'
              })
            })
          }
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

  const unreadCount = notifications.filter(n => n.type === 'message' || n.type === 'demande').length

  return (
    <header className='h-[4.5rem] md:h-16 bg-white/95 backdrop-blur-md sticky top-0 z-[100] border-b border-[#E5E7EB] w-full shadow-md shadow-black/5 flex items-center'>
      <div className='w-full flex items-center justify-between gap-6 px-5 sm:px-6 relative z-[101]'>
        {/* Sidebar toggle button - MOBILE uniquement */}
        <div className='md:hidden'>
          <Button
            variant='ghost'
            size='icon'
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('🔵 Bouton cliqué, openMobile actuel:', openMobile)
              const newValue = !openMobile
              console.log('🔵 Nouvelle valeur:', newValue)
              setOpenMobile(newValue)
            }}
            className={cn(
              'h-10 w-10 rounded-xl transition-all duration-200 flex-shrink-0',
              'hover:bg-gray-100',
              'focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2'
            )}
            style={{ pointerEvents: 'auto' }}
            aria-label={openMobile ? 'Fermer la sidebar' : 'Ouvrir la sidebar'}
          >
            {openMobile ? (
              <PanelLeftClose className='h-6 w-6 text-black' />
            ) : (
              <PanelLeft className='h-6 w-6 text-black' />
            )}
          </Button>
        </div>

        {/* Notifications et Avatar - alignés à droite */}
        <div className='flex items-center gap-3 ml-auto'>
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='relative h-10 w-10 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-lg transition-colors'>
                <Bell className='h-5 w-5 text-black' />
                {unreadCount > 0 && (
                  <span className='absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#823F91] text-white text-xs font-semibold flex items-center justify-center'>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-80' sideOffset={8} alignOffset={-8}>
              <div className='p-2'>
                <div className='px-2 py-1.5 text-sm font-semibold'>Notifications</div>
                <div className='max-h-96 overflow-y-auto'>
                  {notifications.length === 0 ? (
                    <div className='px-2 py-8 text-center text-sm text-muted-foreground'>
                      Aucune notification
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = notification.type === 'demande' ? Inbox :
                                   notification.type === 'evenement' ? Calendar : MessageSquare
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

          {/* Avatar */}
          <div className="relative z-[103]">
            <ProfileDropdown
              trigger={
                <button className='h-auto gap-2 px-2 py-1.5 flex items-center cursor-pointer'>
                  <Avatar className='h-9 w-9 rounded-xl'>
                    <AvatarImage src={profile?.avatar} alt={profile?.name} />
                    <AvatarFallback className='bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white font-semibold'>
                      {profile?.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              }
              user={profile || undefined}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

