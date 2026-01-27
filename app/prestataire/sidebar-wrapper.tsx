"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { LayoutDashboard, Store, CalendarCheck, MessageSquare, Settings } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"

export function PrestataireSidebarWrapper() {
  const { counts } = useNotifications('prestataire')

  const prestataireNavItems = [
    { href: "/prestataire/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/prestataire/demandes-recues", icon: Store, label: "Demandes reçues", badge: counts.demandes },
    { href: "/prestataire/agenda", icon: CalendarCheck, label: "Agenda" },
    { href: "/prestataire/messagerie", icon: MessageSquare, label: "Messagerie", badge: counts.messages },
    { href: "/prestataire/profil-public", icon: Settings, label: "Profil public" },
  ]

  return <Sidebar role="prestataire" items={prestataireNavItems} />
}

