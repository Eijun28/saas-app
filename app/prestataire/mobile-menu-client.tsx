"use client"

import { useState } from "react"
import { MobileMenu } from "@/components/layout/MobileMenu"
import { LayoutDashboard, Store, CalendarCheck, MessageSquare, Settings, FileText } from "lucide-react"

const prestataireNavItems = [
  { href: "/prestataire/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/prestataire/demandes-recues", icon: Store, label: "Demandes reçues" },
  { href: "/prestataire/agenda", icon: CalendarCheck, label: "Agenda" },
  { href: "/prestataire/messagerie", icon: MessageSquare, label: "Messagerie" },
  { href: "/prestataire/devis-factures", icon: FileText, label: "Devis & Factures" },
  { href: "/prestataire/profil-public", icon: Settings, label: "Profil public" },
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
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} items={prestataireNavItems} />
    </>
  )
}
