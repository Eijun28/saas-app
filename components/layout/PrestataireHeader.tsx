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
import { User, LogOut } from 'lucide-react'
import Link from 'next/link'

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
        // Récupérer les nouvelles demandes (requests)
        const { data: requests } = await supabase
          .from('requests')
          .select('id, created_at, couple_id, initial_message')
          .eq('provider_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5)

        if (requests) {
          // Récupérer les noms des couples
          const coupleIds = [...new Set(requests.map((r: any) => r.couple_id).filter(Boolean))]
          let couplesMap = new Map()
          
          if (coupleIds.length > 0) {
            const { data: couplesData } = await supabase
              .from('couples')
              .select('user_id, partner_1_name, partner_2_name')
              .in('user_id', coupleIds)
            
            if (couplesData) {
              couplesMap = new Map(couplesData.map((c: any) => {
                const name = c.partner_1_name && c.partner_2_name 
                  ? `${c.partner_1_name} & ${c.partner_2_name}`
                  : c.partner_1_name || c.partner_2_name || 'un couple'
                return [c.user_id, name]
              }))
            }
          }

          requests.forEach((request: any) => {
            const coupleNom = couplesMap.get(request.couple_id) || 'un couple'
            notificationsList.push({
              id: request.id,
              type: 'demande',
              title: 'Nouvelle demande',
              message: `Nouvelle demande de ${coupleNom}`,
              date: request.created_at,
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

        // Messages désactivés temporairement

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
              setOpenMobile(!openMobile)
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
            <DropdownMenuContent align='end' className='w-64'>
              {notifications.length === 0 ? (
                <div className='px-4 py-6 text-center text-sm text-muted-foreground'>
                  Aucune notification
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => {
                  const Icon = notification.type === 'demande' ? Inbox :
                               notification.type === 'evenement' ? Calendar : MessageSquare
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className='flex items-center gap-2 cursor-pointer'
                      onClick={() => {
                        if (notification.link) {
                          window.location.href = notification.link
                        }
                      }}
                    >
                      <Icon className='h-4 w-4 text-[#823F91]' />
                      <span className='text-sm'>{notification.title}</span>
                    </DropdownMenuItem>
                  )
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Avatar */}
          <div className="relative z-[103]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className='h-auto gap-2 px-2 py-1.5 flex items-center cursor-pointer hover:opacity-80 transition-opacity'>
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
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/prestataire/profil-public" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

