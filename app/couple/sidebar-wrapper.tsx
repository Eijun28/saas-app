"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Home, Sparkles, Calendar, MessageSquare, DollarSign, User, FileText, ChevronsLeft, ChevronsRight, Search } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { Separator } from "@/components/ui/separator"

const coupleNavItems = [
  { href: "/couple/dashboard", icon: Home, label: "Accueil" },
  { href: "/couple/recherche", icon: Search, label: "Rechercher" },
  { href: "/couple/matching", icon: Sparkles, label: "Nuply Matching" },
  { href: "/couple/timeline", icon: Calendar, label: "Calendrier" },
  { href: "/couple/messagerie", icon: MessageSquare, label: "Messages" },
  { href: "/couple/demandes", icon: FileText, label: "Demandes & Devis" },
  { href: "/couple/budget", icon: DollarSign, label: "Budget" },
  { href: "/couple/profil", icon: User, label: "Profil" },
]

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
      className={cn(
        'h-8 w-8 rounded-lg transition-all duration-200 flex-shrink-0',
        'hover:bg-[#823F91]/8 text-gray-400 hover:text-[#823F91]',
        'focus-visible:ring-2 focus-visible:ring-[#823F91]/30 focus-visible:ring-offset-1',
        'flex relative z-[100]',
        isCollapsed && 'bg-[#823F91]/5 text-[#823F91]'
      )}
      style={{ pointerEvents: 'auto' }}
      aria-label={isCollapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
    >
      {isCollapsed ? (
        <ChevronsRight className='h-4 w-4' />
      ) : (
        <ChevronsLeft className='h-4 w-4' />
      )}
    </Button>
  )
}

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

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200/80">
      <SidebarHeader className="h-16 px-4 border-b border-gray-100 flex flex-row items-center justify-between group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:justify-center">
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

      <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 group-data-[collapsible=icon]:space-y-1">
              {coupleNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

                let badgeCount = 0
                if (item.href === '/couple/messagerie') {
                  badgeCount = counts.unreadMessages
                } else if (item.href === '/couple/demandes') {
                  badgeCount = counts.newRequests
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "text-[13.5px] font-medium rounded-lg transition-all duration-150 h-10",
                        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:mx-auto",
                        "group-data-[collapsible=icon]:rounded-lg",
                        isActive
                          ? "bg-[#823F91]/10 text-[#823F91] font-semibold hover:bg-[#823F91]/12 group-data-[collapsible=icon]:bg-[#823F91] group-data-[collapsible=icon]:text-white group-data-[collapsible=icon]:shadow-sm"
                          : "hover:bg-gray-100/80 text-gray-600 hover:text-gray-900 group-data-[collapsible=icon]:hover:bg-gray-100"
                      )}
                    >
                      <Link href={item.href} onClick={handleNavClick} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-full relative">
                        <Icon className={cn(
                          "h-[18px] w-[18px] flex-shrink-0 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5",
                          isActive ? "text-[#823F91]" : "text-gray-400"
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
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:hidden">
        <Separator className="mb-3 bg-gray-100" />
        <div className="flex items-center gap-2 px-1">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-gray-400 font-medium">Nuply v1.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
