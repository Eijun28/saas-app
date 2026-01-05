"use client"

import { SidebarInset } from "@/components/ui/sidebar"
import { PrestataireHeader } from "@/components/layout/PrestataireHeader"

export function SidebarInsetWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset className="flex flex-col min-w-0 flex-1">
      <PrestataireHeader />
      <main className="flex-1 w-full p-4 md:p-6 lg:p-8 overflow-x-hidden">
        {children}
      </main>
    </SidebarInset>
  )
}

