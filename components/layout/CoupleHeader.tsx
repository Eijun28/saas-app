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
  PanelLeftClose,
  ChevronDown,
  Search,
  Sparkles,
  Bell,
  MessageSquare,
  FileText,
  Settings,
} from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/couple/dashboard': 'Accueil',
  '/couple/recherche': 'Rechercher',
  '/couple/matching': 'Nuply Matching',
  '/couple/timeline': 'Calendrier',
  '/couple/messagerie': 'Messages',
  '/couple/demandes': 'Demandes & Devis',
  '/couple/budget': 'Budget',
  '/couple/profil': 'Profil',
  '/couple/parametres': 'Paramètres',
  '/couple/favoris': 'Favoris',
  '/couple/evenements': 'Événements',
  '/couple/collaborateurs': 'Collaborateurs',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path + '/')) return title
  }
  return 'Dashboard'
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
    } catch (error) {
      console.error('Erreur lors de la deconnexion:', error)
      window.location.href = '/'
    }
  }

  const pageTitle = getPageTitle(pathname || '/couple/dashboard')

  const quickActions = pathname === '/couple/dashboard'
    ? [
        { label: 'Rechercher', icon: Search, href: '/couple/recherche' },
        { label: 'Matching IA', icon: Sparkles, href: '/couple/matching' },
      ]
    : []

  const totalNotifs = counts.unreadMessages + counts.newRequests

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md sticky top-0 z-[100] border-b border-gray-200/60 w-full flex items-center shadow-[0_1px_3px_0_rgb(0_0_0/0.03)]">
      <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: mobile toggle + page title + quick actions */}
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
              aria-label={openMobile ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {openMobile ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-tight">{pageTitle}</h1>
          </div>

          {/* Quick actions — desktop dashboard only */}
          {quickActions.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 ml-4 pl-4 border-l border-gray-200">
              {quickActions.map(action => (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:text-[#823F91] hover:bg-[#823F91]/5 rounded-lg transition-colors"
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: notifications bell + user dropdown */}
        <div className="flex items-center gap-1.5">
          {/* Notifications bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                suppressHydrationWarning
                className="relative h-9 w-9 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/30"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px] text-gray-600" />
                {totalNotifs > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#823F91] text-white text-[9px] font-semibold flex items-center justify-center">
                    {totalNotifs > 9 ? '9+' : totalNotifs}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-1">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-[13px] font-semibold text-gray-800">Notifications</p>
              </div>
              {totalNotifs === 0 ? (
                <div className="px-4 py-6 text-center text-[13px] text-gray-400">
                  Aucune notification
                </div>
              ) : (
                <div className="py-1">
                  {counts.unreadMessages > 0 && (
                    <DropdownMenuItem
                      onClick={() => router.push('/couple/messagerie')}
                      className="flex items-start gap-2.5 cursor-pointer rounded-md px-2.5 py-2.5"
                    >
                      <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-gray-900">Messages non lus</p>
                        <p className="text-[12px] text-gray-600">
                          {counts.unreadMessages} message{counts.unreadMessages > 1 ? 's' : ''} en attente
                        </p>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {counts.newRequests > 0 && (
                    <DropdownMenuItem
                      onClick={() => router.push('/couple/demandes')}
                      className="flex items-start gap-2.5 cursor-pointer rounded-md px-2.5 py-2.5"
                    >
                      <div className="h-7 w-7 rounded-md bg-[#823F91]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="h-3.5 w-3.5 text-[#823F91]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-gray-900">
                          Devis accepté{counts.newRequests > 1 ? 's' : ''}
                        </p>
                        <p className="text-[12px] text-gray-600">
                          {counts.newRequests} devis accepté{counts.newRequests > 1 ? 's' : ''} cette semaine
                        </p>
                      </div>
                    </DropdownMenuItem>
                  )}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User dropdown */}
          <div className="relative z-[103]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/30">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={profile?.avatar} alt={profile?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white text-xs font-semibold rounded-lg">
                      {profile?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-gray-800 max-w-[140px] truncate">{profile?.name || 'Couple'}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
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
                  <Link href="/couple/profil" className="flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-[13px]">Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/couple/parametres" className="flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-[13px]">Paramètres</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2.5 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 rounded-md px-2.5 py-2">
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
