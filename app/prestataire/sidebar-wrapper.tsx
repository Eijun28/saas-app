"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Home, Inbox, Calendar, MessageCircle, UserCircle, PanelLeftClose, PanelLeft } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const prestataireNavItems = [
  { href: "/prestataire/dashboard", icon: Home, label: "Dashboard" },
  { href: "/prestataire/demandes-recues", icon: Inbox, label: "Demandes reçues" },
  { href: "/prestataire/agenda", icon: Calendar, label: "Agenda" },
  { href: "/prestataire/messagerie", icon: MessageCircle, label: "Messagerie" },
  { href: "/prestataire/profil-public", icon: UserCircle, label: "Profil public" },
]

export function PrestataireSidebarWrapper() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 px-6 border-b border-[#E5E7EB] flex items-center group-data-[collapsible=icon]:h-16 group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-b group-data-[collapsible=icon]:border-[#E5E7EB]">
        <Link href="/prestataire/dashboard" className="flex items-center gap-2 pt-1 group-data-[collapsible=icon]:pt-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
          <Image
            src="/images/logo.svg"
            alt="NUPLY Logo"
            width={46}
            height={44}
            className="h-8 w-auto group-data-[collapsible=icon]:hidden"
          />
          <div className="hidden group-data-[collapsible=icon]:flex w-12 h-12 items-center justify-center">
            <Image
              src="/images/nuply-icon.svg"
              alt="NUPLY Logo"
              width={48}
              height={48}
              className="w-12 h-12"
            />
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-6 py-4 group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 group-data-[collapsible=icon]:space-y-3">
              {prestataireNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      size="lg"
                      className={cn(
                        "text-base font-medium rounded-lg transition-all duration-200",
                        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:mx-auto",
                        "group-data-[collapsible=icon]:rounded-xl",
                        isActive 
                          ? "bg-[#E8D4EF] text-[#823F91] font-semibold hover:bg-[#E8D4EF] group-data-[collapsible=icon]:bg-[#823F91] group-data-[collapsible=icon]:text-white group-data-[collapsible=icon]:shadow-md" 
                          : "hover:bg-gray-50 text-gray-700 group-data-[collapsible=icon]:hover:bg-gray-100"
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
