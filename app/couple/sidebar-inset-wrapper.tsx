"use client"

import { SidebarInset } from "@/components/ui/sidebar"
import { CoupleHeader } from "@/components/layout/CoupleHeader"
import { CoupleMobileNav } from "@/components/layout/MobileBottomNav"
import { OverdueBanner } from "@/components/couple-payments/OverdueBanner"

export function SidebarInsetWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset className="flex flex-col min-w-0 flex-1 h-svh overflow-hidden" style={{
      background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(130,63,145,0.05) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(130,63,145,0.04) 0%, transparent 60%), #f9f8fc',
    }}>
      <CoupleHeader />
      <OverdueBanner />
      <main className="flex flex-col min-h-0 flex-1 w-full px-4 sm:px-5 md:px-6 lg:px-8 pt-5 md:pt-6 pb-28 md:pb-8 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
      <CoupleMobileNav />
    </SidebarInset>
  )
}
