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
      <main className="flex-1 w-full p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 overflow-x-hidden">
        {children}
      </main>
    </SidebarInset>
  )
}

