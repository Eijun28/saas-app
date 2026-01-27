"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { Home, Sparkles, Calendar, MessageSquare, DollarSign, User, FileText } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"

export function CoupleSidebarWrapper() {
  const { counts } = useNotifications('couple')

  const coupleNavItems = [
    { href: "/couple", icon: Home, label: "Accueil" },
    { href: "/couple/matching", icon: Sparkles, label: "Matching IA" },
    { href: "/couple/timeline", icon: Calendar, label: "Calendrier" },
    { href: "/couple/messagerie", icon: MessageSquare, label: "Messages", badge: counts.messages },
    { href: "/couple/demandes", icon: FileText, label: "Demandes & Devis" },
    { href: "/couple/budget", icon: DollarSign, label: "Budget" },
    { href: "/couple/profil", icon: User, label: "Profil" },
  ]

  return <Sidebar role="couple" items={coupleNavItems} />
}

