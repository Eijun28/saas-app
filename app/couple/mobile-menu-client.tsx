"use client"

import { useState } from "react"
import { MobileMenu } from "@/components/layout/MobileMenu"
import { Home, Sparkles, Calendar, MessageSquare, DollarSign, User } from "lucide-react"

const coupleNavItems = [
  { href: "/couple/dashboard", icon: Home, label: "Accueil" },
  { href: "/couple/matching", icon: Sparkles, label: "Matching IA" },
  { href: "/couple/timeline", icon: Calendar, label: "Calendrier" },
  { href: "/couple/messagerie", icon: MessageSquare, label: "Messages" },
  { href: "/couple/budget", icon: DollarSign, label: "Budget" },
  { href: "/couple/profil", icon: User, label: "Profil" },
]

export function MobileMenuClient() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white shadow-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} items={coupleNavItems} />
    </>
  )
}
