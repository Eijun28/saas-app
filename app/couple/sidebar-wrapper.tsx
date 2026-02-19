"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Home,
  Sparkles,
  Calendar,
  MessageSquare,
  DollarSign,
  User,
  FileText,
  ChevronsLeft,
  ChevronsRight,
  Search,
  PartyPopper,
  UserPlus,
  Heart,
  Settings,
  ChevronsUpDown,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { signOut } from "@/lib/auth/actions"

/* ─────────────────────────────────────────────
   Sidebar sections with nav items
   ───────────────────────────────────────────── */

interface NavItem {
  href: string
  icon: typeof Home
  label: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { href: "/couple/dashboard", icon: Home, label: "Accueil" },
      { href: "/couple/recherche", icon: Search, label: "Rechercher" },
      { href: "/couple/favoris", icon: Heart, label: "Favoris" },
      { href: "/couple/matching", icon: Sparkles, label: "Nuply Matching" },
      { href: "/couple/timeline", icon: Calendar, label: "Calendrier" },
      { href: "/couple/evenements", icon: PartyPopper, label: "Événements" },
      { href: "/couple/collaborateurs", icon: UserPlus, label: "Collaborateurs" },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/couple/messagerie", icon: MessageSquare, label: "Messages" },
      { href: "/couple/demandes", icon: FileText, label: "Demandes & Devis" },
    ],
  },
  {
    title: "Finances",
    items: [
      { href: "/couple/budget", icon: DollarSign, label: "Budget" },
    ],
  },
  {
    title: "Compte",
    items: [
      { href: "/couple/profil", icon: User, label: "Profil" },
      { href: "/couple/parametres", icon: Settings, label: "Paramètres" },
    ],
  },
]

/* ─────────────────────────────────────────────
   Toggle button
   ───────────────────────────────────────────── */

function SidebarToggleButton() {
  const { state, toggleSidebar, isMobile, openMobile, setOpenMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleToggle = () => {
    if (isMobile) {
      setOpenMobile(!openMobile)
    } else {
      toggleSidebar()
    }
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleToggle()
      }}
      className='h-8 w-8 rounded-lg flex-shrink-0 flex relative z-[100] hover:bg-gray-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/30 focus-visible:ring-offset-1'
      style={{ pointerEvents: 'auto', color: '#4B5563', background: 'transparent', border: 'none', boxShadow: 'none' }}
      aria-label={isCollapsed ? 'Ouvrir la sidebar' : 'Reduire la sidebar'}
    >
      {isCollapsed ? (
        <ChevronsRight className='h-4 w-4' style={{ color: '#4B5563' }} />
      ) : (
        <ChevronsLeft className='h-4 w-4' style={{ color: '#4B5563' }} />
      )}
    </Button>
  )
}

/* ─────────────────────────────────────────────
   User footer card
   ───────────────────────────────────────────── */

function SidebarUserFooter() {
  const { user } = useUser()
  const [profile, setProfile] = React.useState<{ name: string; avatar?: string } | null>(null)

  React.useEffect(() => {
    if (!user) return
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('couples')
        .select('partner_1_name, partner_2_name, avatar_url')
        .eq('user_id', user.id)
        .single()
      if (data) {
        const n1 = data.partner_1_name || ''
        const n2 = data.partner_2_name || ''
        setProfile({
          name: n1 && n2 ? `${n1} & ${n2}` : n1 || n2 || 'Couple',
          avatar: data.avatar_url ?? undefined,
        })
      }
    }
    load()
  }, [user?.id])

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch {
      window.location.href = '/'
    }
  }

  const initials = profile?.name
    ? profile.name.split(' ').filter(w => w !== '&').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'C'

  return (
    <SidebarFooter className="border-t border-gray-100 p-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={cn(
                  "hover:bg-gray-100/80 rounded-lg transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/30",
                  "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:!p-0",
                )}
              >
                <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
                  <AvatarImage src={profile?.avatar} alt={profile?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white text-xs font-semibold rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-gray-900 text-[13px]">
                    {profile?.name || 'Couple'}
                  </span>
                  <span className="text-[10px] font-semibold text-[#823F91] uppercase tracking-wide">
                    Couple
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-gray-400 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="end"
              sideOffset={4}
              className="w-56 p-1"
            >
              <div className="px-2.5 py-2">
                <p className="text-[13px] font-semibold text-gray-900 truncate">
                  {profile?.name || 'Couple'}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/couple/profil"
                  className="flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-2"
                >
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-[13px]">Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/couple/parametres"
                  className="flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-2"
                >
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span className="text-[13px]">Paramètres</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2.5 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 rounded-md px-2.5 py-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-[13px]">Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}

/* ─────────────────────────────────────────────
   Sidebar wrapper
   ───────────────────────────────────────────── */

export function CoupleSidebarWrapper() {
  const pathname = usePathname()
  const { counts } = useNotifications()
  const { isMobile, setOpenMobile, openMobile } = useSidebar()

  React.useEffect(() => {
    if (isMobile && openMobile) {
      setOpenMobile(false)
    }
  }, [pathname])

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const getBadgeCount = (href: string) => {
    if (href === '/couple/messagerie') return counts.unreadMessages
    if (href === '/couple/demandes') return counts.newRequests
    return 0
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200/60">
      {/* Header */}
      <SidebarHeader className="h-14 px-4 border-b border-gray-100 flex flex-row items-center justify-between group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:justify-center">
        <Link
          href="/couple/dashboard"
          className="flex items-center group-data-[collapsible=icon]:hidden"
        >
          <Image
            src="/images/logo.svg"
            alt="NUPLY Logo"
            width={100}
            height={40}
            className="h-7 w-auto"
          />
        </Link>
        <SidebarToggleButton />
      </SidebarHeader>

      {/* Navigation sections */}
      <SidebarContent className="px-3 py-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        {sections.map((section) => (
          <SidebarGroup key={section.title} className="mb-1">
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 px-3 py-1.5 group-data-[collapsible=icon]:hidden">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5 group-data-[collapsible=icon]:space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  const badgeCount = getBadgeCount(item.href)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={cn(
                          "text-[13.5px] font-medium rounded-lg transition-all duration-150 h-10 relative",
                          "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:mx-auto",
                          "group-data-[collapsible=icon]:rounded-lg",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/30 focus-visible:ring-offset-1",
                          isActive
                            ? "bg-[#823F91]/8 text-[#823F91] font-semibold hover:bg-[#823F91]/12 group-data-[collapsible=icon]:bg-[#823F91] group-data-[collapsible=icon]:text-white group-data-[collapsible=icon]:shadow-sm"
                            : "hover:bg-gray-100/80 text-gray-700 hover:text-gray-900 group-data-[collapsible=icon]:hover:bg-gray-100"
                        )}
                      >
                        <Link href={item.href} onClick={handleNavClick} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-full relative">
                          {/* Active indicator bar (left edge) */}
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-[#823F91] rounded-r-full group-data-[collapsible=icon]:hidden" />
                          )}
                          <Icon className={cn(
                            "h-[18px] w-[18px] flex-shrink-0 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5 transition-colors duration-150",
                            isActive
                              ? "text-[#823F91] group-data-[collapsible=icon]:text-white"
                              : "text-gray-500"
                          )} />
                          <span className="flex-1 group-data-[collapsible=icon]:hidden">{item.label}</span>
                          {badgeCount > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#823F91] text-white text-[10px] font-semibold flex items-center justify-center group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:-top-1 group-data-[collapsible=icon]:-right-1">
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer with user card */}
      <SidebarUserFooter />
    </Sidebar>
  )
}
