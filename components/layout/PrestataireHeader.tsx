'use client'

import React, { useState, useEffect } from 'react'
import { Bell, PanelLeft, PanelLeftClose, Inbox, Calendar, MessageSquare } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, ChevronDown } from 'lucide-react'
import Link from 'next/link'

const pageTitles: Record<string, string> = {
  '/prestataire/dashboard': 'Tableau de bord',
  '/prestataire/demandes-recues': 'Demandes reçues',
  '/prestataire/agenda': 'Agenda',
  '/prestataire/messagerie': 'Messagerie',
  '/prestataire/devis-factures': 'Devis & Factures',
  '/prestataire/profil-public': 'Profil public',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path + '/')) return title
  }
  return 'Tableau de bord'
}

export function PrestataireHeader() {
  const { user } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const { openMobile, setOpenMobile } = useSidebar()
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

  const loadProfile = async () => {
    if (!user) return
    const supabase = createClient()
    const { data: profileData } = await supabase
      .from('profiles')
      .select('prenom, nom, email, avatar_url')
      .eq('id', user.id)
      .single()

    if (profileData) {
      const fullName = [profileData.prenom, profileData.nom].filter(Boolean).join(' ') || 'Prestataire'
      setProfile({ name: fullName, email: profileData.email || user.email || '', avatar: profileData.avatar_url || undefined })
    } else {
      setProfile({ name: 'Prestataire', email: user.email || '', avatar: undefined })
    }
  }

  useEffect(() => { loadProfile() }, [user])

  useEffect(() => {
    const handleAvatarUpdate = () => { loadProfile() }
    window.addEventListener('avatar-updated', handleAvatarUpdate)
    return () => { window.removeEventListener('avatar-updated', handleAvatarUpdate) }
  }, [user])

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return
      const supabase = createClient()
      const notificationsList: Array<{
        id: string; type: 'demande' | 'evenement' | 'message'; title: string; message: string; date: string; link?: string
      }> = []

      try {
        const { data: requests } = await supabase
          .from('requests')
          .select('id, created_at, couple_id, initial_message')
          .eq('provider_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5)

        if (requests) {
          const coupleIds = [...new Set(requests.map((r: any) => r.couple_id).filter(Boolean))]
          let couplesMap = new Map()
          if (coupleIds.length > 0) {
            const { data: couplesData } = await supabase.from('couples').select('user_id, partner_1_name, partner_2_name').in('user_id', coupleIds)
            if (couplesData) {
              couplesMap = new Map(couplesData.map((c: any) => {
                const name = c.partner_1_name && c.partner_2_name ? `${c.partner_1_name} & ${c.partner_2_name}` : c.partner_1_name || c.partner_2_name || 'un couple'
                return [c.user_id, name]
              }))
            }
          }
          requests.forEach((request: any) => {
            const coupleNom = couplesMap.get(request.couple_id) || 'un couple'
            notificationsList.push({ id: request.id, type: 'demande', title: 'Nouvelle demande', message: `Nouvelle demande de ${coupleNom}`, date: request.created_at, link: '/prestataire/demandes-recues' })
          })
        }

        const { data: evenements } = await supabase.from('events').select('id, title, date, time').eq('prestataire_id', user.id).gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true }).limit(5)
        if (evenements) {
          evenements.forEach((evenement: any) => {
            notificationsList.push({ id: evenement.id, type: 'evenement', title: 'Événement à venir', message: evenement.title || 'Événement prévu', date: `${evenement.date}T${evenement.time}`, link: '/prestataire/agenda' })
          })
        }

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
  const pageTitle = getPageTitle(pathname || '/prestataire/dashboard')

  // Quick actions based on current page
  const quickActions = pathname === '/prestataire/dashboard'
    ? [
        { label: 'Demandes', icon: Inbox, href: '/prestataire/demandes-recues' },
        { label: 'Agenda', icon: Calendar, href: '/prestataire/agenda' },
      ]
    : []

  return (
    <header className="h-14 bg-white/80 backdrop-blur-sm sticky top-0 z-[100] border-b border-gray-100 w-full flex items-center">
      <div className="w-full flex items-center justify-between px-4 sm:px-6">
        {/* Left: mobile toggle + page title */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMobile(!openMobile) }}
              className={cn(
                'h-9 w-9 rounded-lg transition-all duration-150',
                'hover:bg-gray-100 text-gray-500',
                'focus-visible:ring-2 focus-visible:ring-[#823F91]/30 focus-visible:ring-offset-1'
              )}
              style={{ pointerEvents: 'auto' }}
              aria-label={openMobile ? 'Fermer la sidebar' : 'Ouvrir la sidebar'}
            >
              {openMobile ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>
          </div>
          <h1 className="text-[15px] font-semibold text-gray-800 tracking-tight">{pageTitle}</h1>

          {/* Quick actions — only on desktop dashboard */}
          {quickActions.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 ml-3 pl-3 border-l border-gray-200">
              {quickActions.map(action => (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: notifications + user dropdown */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                suppressHydrationWarning
                className="relative h-9 w-9 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/30"
              >
                <Bell className="h-[18px] w-[18px] text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#823F91] text-white text-[9px] font-semibold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-1">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-[13px] font-semibold text-gray-800">Notifications</p>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-[13px] text-gray-400">Aucune notification</div>
              ) : (
                notifications.slice(0, 5).map((notification) => {
                  const Icon = notification.type === 'demande' ? Inbox : notification.type === 'evenement' ? Calendar : MessageSquare
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex items-start gap-2.5 cursor-pointer rounded-md px-2.5 py-2.5"
                      onClick={() => { if (notification.link) window.location.href = notification.link }}
                    >
                      <div className="h-7 w-7 rounded-md bg-[#823F91]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-[#823F91]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-gray-800">{notification.title}</p>
                        <p className="text-[12px] text-gray-500 truncate">{notification.message}</p>
                      </div>
                    </DropdownMenuItem>
                  )
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User dropdown */}
          <div className="relative z-[103]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  suppressHydrationWarning
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/30"
                >
                  <Avatar className="h-8 w-8 rounded-lg ring-1 ring-gray-100">
                    <AvatarImage src={profile?.avatar} alt={profile?.name} key={profile?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white text-xs font-semibold rounded-lg">
                      {profile?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-gray-700 max-w-[140px] truncate">{profile?.name || 'Prestataire'}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1">
                <div className="px-2.5 py-2 sm:hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">{profile?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                </div>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem asChild>
                  <Link href="/prestataire/profil-public" className="flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-[13px]">Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2.5 cursor-pointer text-red-600 focus:text-red-600 rounded-md px-2.5 py-2">
                  <LogOut className="h-4 w-4" />
                  <span className="text-[13px]">Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
