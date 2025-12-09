'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LayoutDashboard, Bell, Store, CalendarCheck, MessageSquare, Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileMenu } from '@/components/layout/MobileMenu'

const prestataireMenuItems = [
  { href: '/prestataire/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/prestataire/demandes-recues', icon: Bell, label: 'Demandes reçues' },
  { href: '/prestataire/profil-public', icon: Store, label: 'Profil public' },
  { href: '/prestataire/agenda', icon: CalendarCheck, label: 'Agenda' },
  { href: '/prestataire/messagerie', icon: MessageSquare, label: 'Messagerie' },
]

export default function PrestataireLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <Sidebar role="prestataire" items={prestataireMenuItems} />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        items={prestataireMenuItems}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-[280px]">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-[#E8D4EF] transition-colors"
          >
            <Menu className="h-5 w-5 text-[#374151]" />
          </button>
          <Image
            src="/images/logo.svg"
            alt="NUPLY Logo"
            width={46}
            height={44}
            className="h-6 w-auto"
          />
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* TopBar */}
        <TopBar />

        {/* Page Content */}
        <main className="p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}

