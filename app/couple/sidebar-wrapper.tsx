"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { Home, Sparkles, Calendar, MessageSquare, DollarSign, User, FileText } from "lucide-react"

const coupleNavItems = [
  { href: "/couple", icon: Home, label: "Accueil" },
  { href: "/couple/matching", icon: Sparkles, label: "Matching IA" },
  { href: "/couple/timeline", icon: Calendar, label: "Calendrier" },
  { href: "/couple/messagerie", icon: MessageSquare, label: "Messages" },
  { href: "/couple/demandes", icon: FileText, label: "Demandes & Devis" },
  { href: "/couple/budget", icon: DollarSign, label: "Budget" },
  { href: "/couple/profil", icon: User, label: "Profil" },
]

export function CoupleSidebarWrapper() {
  return <Sidebar role="couple" items={coupleNavItems} />
}

