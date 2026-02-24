"use client"

import { SidebarInset } from "@/components/ui/sidebar"
import { PrestataireHeader } from "@/components/layout/PrestataireHeader"
import { PrestataireMobileNav } from "@/components/layout/MobileBottomNav"
import { ChatbotAdvisor } from "@/components/prestataire/ChatbotAdvisor"

export function SidebarInsetWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset className="flex flex-col min-w-0 flex-1 h-svh overflow-hidden" style={{
      background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(139,92,246,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(167,139,250,0.04) 0%, transparent 60%), #f8f8fc',
    }}>
      <PrestataireHeader />
      <main className="flex flex-col min-h-0 flex-1 w-full px-4 sm:px-5 md:px-6 lg:px-8 pt-5 md:pt-6 pb-28 md:pb-8 overflow-x-hidden overflow-y-auto touch-pan-y overscroll-y-contain">
        {children}
      </main>
      <ChatbotAdvisor />
      <PrestataireMobileNav />
    </SidebarInset>
  )
}
