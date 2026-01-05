import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TopBar } from "@/components/layout/TopBar"
import { CoupleSidebarWrapper } from "./sidebar-wrapper"
import { MobileMenuClient } from "./mobile-menu-client"

export default async function CoupleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #faf5fc 50%, #f5eef8 100%)',
      }}
    >
      <CoupleSidebarWrapper />
      <div className="lg:pl-[280px]">
        <TopBar />
        <MobileMenuClient />
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
