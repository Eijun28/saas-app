"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { LayoutDashboard, Store, CalendarCheck, MessageSquare, Settings } from "lucide-react"

const prestataireNavItems = [
  { href: "/prestataire/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/prestataire/demandes-recues", icon: Store, label: "Demandes reçues" },
  { href: "/prestataire/agenda", icon: CalendarCheck, label: "Agenda" },
  { href: "/prestataire/messagerie", icon: MessageSquare, label: "Messagerie" },
  { href: "/prestataire/profil-public", icon: Settings, label: "Profil public" },
]

export function PrestataireSidebarWrapper() {
  return <Sidebar role="prestataire" items={prestataireNavItems} />
}

