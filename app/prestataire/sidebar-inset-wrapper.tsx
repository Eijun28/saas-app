"use client"

import { SidebarInset } from "@/components/ui/sidebar"
import { PrestataireHeader } from "@/components/layout/PrestataireHeader"

export function SidebarInsetWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset 
      className="flex flex-col min-w-0 flex-1"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #faf5fc 50%, #f5eef8 100%)',
      }}
    >
      <PrestataireHeader />
      <main className="flex-1 w-full px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 pt-4 sm:pt-5 md:pt-6 pb-3 sm:pb-4 md:pb-5 lg:pb-6 xl:pb-8 overflow-x-hidden">
        {children}
      </main>
    </SidebarInset>
  )
}

