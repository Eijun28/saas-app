'use client'

import React, { useState, useEffect } from 'react'
import { Bell, PanelLeft, Inbox, Calendar, MessageSquare } from 'lucide-react'
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
import { User, LogOut, ChevronDown, Settings } from 'lucide-react'
import Link from 'next/link'

const pageTitles: Record<string, { label: string; emoji: string }> = {
  '/prestataire/dashboard':     { label: 'Dashboard',        emoji: '⚡' },
  '/prestataire/demandes-recues': { label: 'Demandes reçues', emoji: '📬' },
  '/prestataire/agenda':        { label: 'Agenda',           emoji: '📅' },
  '/prestataire/messagerie':    { label: 'Messagerie',       emoji: '💬' },
  '/prestataire/devis-factures':{ label: 'Devis & Factures', emoji: '📄' },
  '/prestataire/analytics':     { label: 'Statistiques',     emoji: '📊' },
  '/prestataire/profil-public': { label: 'Profil public',    emoji: '🪪' },
  '/prestataire/parametres':    { label: 'Paramètres',       emoji: '⚙️' },
}

function getPageInfo(pathname: string): { label: string; emoji: string } {
  if (pageTitles[pathname]) return pageTitles[pathname]
  for (const [path, info] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path + '/')) return info
  }
  return { label: 'Dashboard', emoji: '⚡' }
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
            notificationsList.push({ id: request.id, type: 'demande', title: 'Nouvelle demande', message: `Demande de ${coupleNom}`, date: request.created_at, link: '/prestataire/demandes-recues' })
          })
        }

        const { data: evenements } = await supabase.from('events').select('id, title, date, time').eq('prestataire_id', user.id).gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true }).limit(5)
        if (evenements) {
          evenements.forEach((evenement: any) => {
            notificationsList.push({ id: evenement.id, type: 'evenement', title: 'Événement à venir', message: evenement.title || 'Événement prévu', date: `${evenement.date}T${evenement.time}`, link: '/prestataire/agenda' })
          })
        }

        notificationsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        const list = notificationsList.slice(0, 10)
        setNotifications(list)
      } catch (error) {
        console.error('Erreur notifications:', error)
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
    } catch {
      window.location.href = '/'
    }
  }

  const unreadCount = notifications.filter(n => n.type === 'message' || n.type === 'demande').length
  const pageInfo = getPageInfo(pathname || '/prestataire/dashboard')

  const quickActions = pathname === '/prestataire/dashboard'
    ? [
        { label: 'Demandes', icon: Inbox, href: '/prestataire/demandes-recues' },
        { label: 'Agenda', icon: Calendar, href: '/prestataire/agenda' },
      ]
    : []

  return (
    <header className="h-14 sticky top-0 z-[100] w-full flex flex-col">
      {/* Top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-violet-600 via-purple-500 to-violet-400 flex-shrink-0" />

      <div className="flex-1 bg-white/95 backdrop-blur-xl border-b border-gray-200/70 shadow-[0_1px_8px_0_rgba(0,0,0,0.06)] flex items-center">
        <div className="w-full flex items-center justify-between px-4 sm:px-5 lg:px-6 h-full">

          {/* Left: mobile toggle + page title */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile burger */}
            <div className="md:hidden flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMobile(!openMobile) }}
                className="h-8 w-8 rounded-lg text-gray-500 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                style={{ pointerEvents: 'auto' }}
                aria-label={openMobile ? 'Fermer la sidebar' : 'Ouvrir la sidebar'}
              >
                <PanelLeft className="h-[18px] w-[18px]" />
              </Button>
            </div>

            {/* Page title */}
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-[15px] font-bold text-gray-900 tracking-tight truncate leading-tight">
                {pageInfo.label}
              </h1>
              {/* Status pill — desktop only */}
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-[11px] font-semibold text-violet-600 flex-shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 inline-block" />
                Prestataire
              </span>
            </div>

            {/* Quick actions — desktop dashboard only */}
            {quickActions.length > 0 && (
              <div className="hidden lg:flex items-center gap-1 ml-3 pl-3 border-l border-gray-200">
                {quickActions.map(action => (
                  <button
                    key={action.href}
                    onClick={() => router.push(action.href)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                  >
                    <action.icon className="h-3.5 w-3.5" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: notifications + user */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  suppressHydrationWarning
                  className="relative h-8 w-8 flex items-center justify-center cursor-pointer hover:bg-violet-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
                  aria-label="Notifications"
                >
                  <Bell className={cn(
                    "h-[17px] w-[17px] transition-colors",
                    unreadCount > 0 ? "text-violet-600" : "text-gray-500"
                  )} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-violet-600 text-white text-[8px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
                <div className="px-3 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100/60">
                  <p className="text-[13px] font-semibold text-gray-900">Notifications</p>
                  {unreadCount > 0 && (
                    <p className="text-[11px] text-violet-600 font-medium">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
                  )}
                </div>
                <div className="py-1 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Bell className="h-6 w-6 text-gray-300 mx-auto mb-1.5" />
                      <p className="text-[12px] text-gray-400">Aucune notification</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => {
                      const Icon = notification.type === 'demande' ? Inbox : notification.type === 'evenement' ? Calendar : MessageSquare
                      const colorClass = notification.type === 'demande'
                        ? 'bg-violet-50 text-violet-600'
                        : notification.type === 'evenement'
                        ? 'bg-blue-50 text-blue-500'
                        : 'bg-emerald-50 text-emerald-600'
                      return (
                        <DropdownMenuItem
                          key={notification.id}
                          className="flex items-start gap-2.5 cursor-pointer rounded-none px-3 py-2.5 hover:bg-gray-50"
                          onClick={() => { if (notification.link) window.location.href = notification.link }}
                        >
                          <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", colorClass)}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-semibold text-gray-900">{notification.title}</p>
                            <p className="text-[11.5px] text-gray-500 truncate">{notification.message}</p>
                          </div>
                        </DropdownMenuItem>
                      )
                    })
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  suppressHydrationWarning
                  className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
                >
                  <Avatar className="h-7 w-7 rounded-lg ring-1 ring-gray-200 flex-shrink-0">
                    <AvatarImage src={profile?.avatar ? `${profile.avatar}${profile.avatar.includes('?') ? '&' : '?'}t=${Date.now()}` : undefined} alt={profile?.name} key={profile?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-700 text-white text-[10px] font-bold rounded-lg">
                      {profile?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-[13px] font-medium text-gray-700 max-w-[120px] truncate">{profile?.name || 'Prestataire'}</span>
                  <ChevronDown className="hidden sm:block h-3 w-3 text-gray-400 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1">
                <div className="px-2.5 py-2 sm:block">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{profile?.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{profile?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/prestataire/profil-public" className="flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-[13px]">Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/prestataire/parametres" className="flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-2">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-[13px]">Paramètres</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2.5 cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50 rounded-md px-2.5 py-2">
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
