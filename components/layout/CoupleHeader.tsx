'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { useNotifications } from '@/hooks/use-notifications'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth/actions'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User,
  LogOut,
  PanelLeft,
  ChevronDown,
  Search,
  Sparkles,
  Bell,
  MessageSquare,
  FileText,
  Settings,
  Heart,
} from 'lucide-react'

const pageTitles: Record<string, { label: string }> = {
  '/couple/dashboard':       { label: 'Accueil' },
  '/couple/recherche':       { label: 'Rechercher' },
  '/couple/matching':        { label: 'Nuply Matching' },
  '/couple/timeline':        { label: 'Calendrier' },
  '/couple/messagerie':      { label: 'Messages' },
  '/couple/demandes':        { label: 'Demandes & Devis' },
  '/couple/budget':          { label: 'Budget' },
  '/couple/profil':          { label: 'Profil' },
  '/couple/parametres':      { label: 'Paramètres' },
  '/couple/favoris':         { label: 'Favoris' },
  '/couple/evenements':      { label: 'Événements' },
  '/couple/collaborateurs':  { label: 'Collaborateurs' },
}

function getPageInfo(pathname: string): { label: string } {
  if (pageTitles[pathname]) return pageTitles[pathname]
  for (const [path, info] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path + '/')) return info
  }
  return { label: 'Accueil' }
}

export function CoupleHeader() {
  const { user } = useUser()
  const { counts } = useNotifications()
  const pathname = usePathname()
  const router = useRouter()
  const { openMobile, setOpenMobile } = useSidebar()
  const [profile, setProfile] = useState<{
    name?: string
    email?: string
    avatar?: string
  } | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      const supabase = createClient()
      const { data: coupleData } = await supabase
        .from('couples')
        .select('partner_1_name, partner_2_name, avatar_url')
        .eq('user_id', user.id)
        .single()

      if (coupleData) {
        const name1 = coupleData.partner_1_name || ''
        const name2 = coupleData.partner_2_name || ''
        const displayName = name1 && name2 ? `${name1} & ${name2}` : name1 || name2 || 'Couple'
        setProfile({ name: displayName, email: user.email || '', avatar: coupleData.avatar_url || undefined })
      } else {
        setProfile({ name: 'Couple', email: user.email || '', avatar: undefined })
      }
    }
    loadProfile()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch {
      window.location.href = '/'
    }
  }

  const pageInfo = getPageInfo(pathname || '/couple/dashboard')
  const totalNotifs = counts.unreadMessages + counts.newRequests

  const quickActions = pathname === '/couple/dashboard'
    ? [
        { label: 'Rechercher', icon: Search, href: '/couple/recherche' },
        { label: 'Matching IA', icon: Sparkles, href: '/couple/matching' },
      ]
    : []

  return (
    <header className="h-14 sticky top-0 z-[100] w-full flex flex-col">
      {/* Top accent line — pink/rose for couples */}
      <div className="h-[2px] w-full bg-gradient-to-r from-pink-500 via-rose-400 to-violet-500 flex-shrink-0" />

      <div className="flex-1 bg-white/95 backdrop-blur-xl border-b border-gray-200/70 shadow-[0_1px_8px_0_rgba(0,0,0,0.06)] flex items-center">
        <div className="w-full flex items-center justify-between px-4 sm:px-5 lg:px-6 h-full">

          {/* Left: mobile toggle + page title + quick actions */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile burger */}
            <div className="md:hidden flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMobile(!openMobile) }}
                className="h-8 w-8 rounded-lg text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                style={{ pointerEvents: 'auto' }}
                aria-label={openMobile ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                <PanelLeft className="h-[18px] w-[18px]" />
              </Button>
            </div>

            {/* Page title + status pill */}
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-[15px] font-bold text-gray-900 tracking-tight truncate leading-tight">
                {pageInfo.label}
              </h1>
              {/* Status pill — desktop only */}
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 border border-pink-100 text-[11px] font-semibold text-pink-600 flex-shrink-0">
                <Heart className="h-2.5 w-2.5 fill-pink-500 text-pink-500" />
                Couple
              </span>
            </div>

            {/* Quick actions — desktop dashboard only */}
            {quickActions.length > 0 && (
              <div className="hidden lg:flex items-center gap-1 ml-3 pl-3 border-l border-gray-200">
                {quickActions.map(action => (
                  <button
                    key={action.href}
                    onClick={() => router.push(action.href)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                  >
                    <action.icon className="h-3.5 w-3.5" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: notifications + user dropdown */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* Notifications bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  suppressHydrationWarning
                  className="relative h-8 w-8 flex items-center justify-center cursor-pointer hover:bg-pink-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/30"
                  aria-label="Notifications"
                >
                  <Bell className={cn(
                    "h-[17px] w-[17px] transition-colors",
                    totalNotifs > 0 ? "text-pink-500" : "text-gray-500"
                  )} />
                  {totalNotifs > 0 && (
                    <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-pink-500 text-white text-[8px] font-bold flex items-center justify-center">
                      {totalNotifs > 9 ? '9+' : totalNotifs}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
                <div className="px-3 py-2.5 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100/60">
                  <p className="text-[13px] font-semibold text-gray-900">Notifications</p>
                  {totalNotifs > 0 && (
                    <p className="text-[11px] text-pink-600 font-medium">{totalNotifs} non lue{totalNotifs > 1 ? 's' : ''}</p>
                  )}
                </div>
                <div className="py-1 max-h-64 overflow-y-auto">
                  {totalNotifs === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Bell className="h-6 w-6 text-gray-300 mx-auto mb-1.5" />
                      <p className="text-[12px] text-gray-400">Aucune notification</p>
                    </div>
                  ) : (
                    <div>
                      {counts.unreadMessages > 0 && (
                        <button
                          onClick={() => router.push('/couple/messagerie')}
                          className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-semibold text-gray-900">Messages non lus</p>
                            <p className="text-[11.5px] text-gray-500">
                              {counts.unreadMessages} message{counts.unreadMessages > 1 ? 's' : ''} en attente
                            </p>
                          </div>
                        </button>
                      )}
                      {counts.newRequests > 0 && (
                        <button
                          onClick={() => router.push('/couple/demandes')}
                          className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="h-7 w-7 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="h-3.5 w-3.5 text-pink-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-semibold text-gray-900">
                              Devis accepté{counts.newRequests > 1 ? 's' : ''}
                            </p>
                            <p className="text-[11.5px] text-gray-500">
                              {counts.newRequests} devis accepté{counts.newRequests > 1 ? 's' : ''} cette semaine
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  suppressHydrationWarning
                  className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/30"
                >
                  <Avatar className="h-7 w-7 rounded-lg ring-1 ring-gray-200 flex-shrink-0">
                    <AvatarImage src={profile?.avatar} alt={profile?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white text-[10px] font-bold rounded-lg">
                      {profile?.name?.split(' ').filter(w => w !== '&').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-[13px] font-medium text-gray-700 max-w-[120px] truncate">{profile?.name || 'Couple'}</span>
                  <ChevronDown className="hidden sm:block h-3 w-3 text-gray-400 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1">
                <div className="px-2.5 py-2">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{profile?.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{profile?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/couple/profil" className="flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-[13px]">Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/couple/parametres" className="flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-2">
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
