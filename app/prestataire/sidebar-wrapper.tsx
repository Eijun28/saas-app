"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Home,
  Inbox,
  Calendar,
  MessageCircle,
  UserCircle,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"

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
      { href: "/prestataire/dashboard", icon: Home, label: "Dashboard" },
      { href: "/prestataire/demandes-recues", icon: Inbox, label: "Demandes recues" },
      { href: "/prestataire/agenda", icon: Calendar, label: "Agenda" },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/prestataire/messagerie", icon: MessageCircle, label: "Messagerie" },
    ],
  },
  {
    title: "Finances",
    items: [
      { href: "/prestataire/devis-factures", icon: FileText, label: "Devis & Factures" },
    ],
  },
  {
    title: "Compte",
    items: [
      { href: "/prestataire/profil-public", icon: UserCircle, label: "Profil public" },
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
   Sidebar wrapper
   ───────────────────────────────────────────── */

export function PrestataireSidebarWrapper() {
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
    if (href === '/prestataire/messagerie') return counts.unreadMessages
    if (href === '/prestataire/demandes-recues') return counts.newRequests
    return 0
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200/60">
      {/* Header */}
      <SidebarHeader className="h-14 px-4 border-b border-gray-100 flex flex-row items-center justify-between group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:justify-center">
        <Link
          href="/prestataire/dashboard"
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
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 px-3 py-1.5 group-data-[collapsible=icon]:hidden">
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
                        className={cn(
                          "text-[13.5px] font-medium rounded-lg transition-all duration-150 h-10 relative",
                          "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:mx-auto",
                          "group-data-[collapsible=icon]:rounded-lg",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/30 focus-visible:ring-offset-1",
                          isActive
                            ? "bg-[#823F91]/8 text-[#823F91] font-semibold hover:bg-[#823F91]/12 group-data-[collapsible=icon]:bg-[#823F91] group-data-[collapsible=icon]:text-white group-data-[collapsible=icon]:shadow-sm"
                            : "hover:bg-gray-100/80 text-gray-600 hover:text-gray-900 group-data-[collapsible=icon]:hover:bg-gray-100"
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
                              : "text-gray-400"
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
    </Sidebar>
  )
}
