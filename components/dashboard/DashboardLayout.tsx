"use client"

import { DashboardSidebar, SidebarItem } from "./DashboardSidebar"
import { DashboardHeader } from "./DashboardHeader"

interface DashboardLayoutProps {
  children: React.ReactNode
  pageTitle: string
  navItems?: SidebarItem[]
}

export function DashboardLayout({
  children,
  pageTitle,
  navItems
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar items={navItems} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader title={pageTitle} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

