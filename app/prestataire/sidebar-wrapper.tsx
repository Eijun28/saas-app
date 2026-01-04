"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { Home, Inbox, Calendar, MessageCircle, UserCircle } from "lucide-react"

const prestataireNavItems = [
  { href: "/prestataire/dashboard", icon: Home, label: "Dashboard" },
  { href: "/prestataire/demandes-recues", icon: Inbox, label: "Demandes reçues" },
  { href: "/prestataire/agenda", icon: Calendar, label: "Agenda" },
  { href: "/prestataire/messagerie", icon: MessageCircle, label: "Messagerie" },
  { href: "/prestataire/profil-public", icon: UserCircle, label: "Profil public" },
]

export function PrestataireSidebarWrapper() {
  return <Sidebar role="prestataire" items={prestataireNavItems} />
}

