"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Home, Sparkles, Calendar, MessageSquare, DollarSign, User, FileText, PanelLeftClose, PanelLeft, Search } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
        'h-10 w-10 rounded-xl transition-all duration-200 flex-shrink-0',
        'hover:bg-gray-100',
        'focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2',
        'flex relative z-[100]', // Visible sur tous les écrans avec z-index élevé
        isCollapsed && 'bg-gray-100'
      )}
      style={{ pointerEvents: 'auto' }}
      aria-label={isCollapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
    >
      {isCollapsed ? (
        <PanelLeft className='h-5 w-5 text-black' />
      ) : (
        <PanelLeftClose className='h-5 w-5 text-black' />
      )}
    </Button>
  )
}

export function CoupleSidebarWrapper() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-[63px] py-2 px-4 border-b border-[#E5E7EB] flex flex-row items-center justify-between group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:justify-center">
        {/* Logo - visible quand sidebar ouverte */}
        <Link 
          href="/couple/dashboard" 
          className="flex items-center group-data-[collapsible=icon]:hidden"
        >
          <Image
            src="/images/logo.svg"
            alt="NUPLY Logo"
            width={100}
            height={40}
            className="h-8 w-auto"
          />
        </Link>
        
        {/* Toggle button */}
        <SidebarToggleButton />
      </SidebarHeader>
      <SidebarContent className="px-5 md:px-6 py-5 md:py-4 group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 group-data-[collapsible=icon]:space-y-3">
              {coupleNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      size="lg"
                      className={cn(
                        "text-base font-semibold rounded-xl transition-all duration-200 h-12",
                        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:mx-auto",
                        "group-data-[collapsible=icon]:rounded-xl",
                        "active:scale-[0.98]",
                        isActive 
                          ? "bg-[#E8D4EF] text-[#823F91] font-bold hover:bg-[#E8D4EF]/90 group-data-[collapsible=icon]:bg-[#823F91] group-data-[collapsible=icon]:text-white group-data-[collapsible=icon]:shadow-md" 
                          : "hover:bg-[#823F91]/10 text-gray-700 group-data-[collapsible=icon]:hover:bg-gray-100"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-full">
                        <Icon className="h-5 w-5 flex-shrink-0 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
