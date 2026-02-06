"use client"

import { SidebarInset } from "@/components/ui/sidebar"
import { PrestataireHeader } from "@/components/layout/PrestataireHeader"

export function SidebarInsetWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset
      className="flex flex-col min-w-0 flex-1 bg-gray-50/50"
    >
      <PrestataireHeader />
      <main className="flex-1 w-full px-4 sm:px-5 md:px-6 lg:px-8 pt-5 md:pt-6 pb-6 md:pb-8 overflow-x-hidden">
        {children}
      </main>
    </SidebarInset>
  )
}
