import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CoupleSidebarWrapper } from "./sidebar-wrapper"
import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarInsetWrapper } from "./sidebar-inset-wrapper"
import { getUserRoleServer } from "@/lib/auth/utils"
import { UserProvider } from "@/lib/context/user-context"

export const dynamic = 'force-dynamic'

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

  // Vérifier que l'utilisateur est bien un couple
  const roleCheck = await getUserRoleServer(user.id)
  if (roleCheck.role !== 'couple') {
    if (roleCheck.role === 'prestataire') {
      redirect("/prestataire/dashboard")
    }
    redirect("/sign-in")
  }

  return (
    <UserProvider initialUser={user}>
      <SidebarProvider>
        <CoupleSidebarWrapper />
        <SidebarInsetWrapper>
          {children}
        </SidebarInsetWrapper>
      </SidebarProvider>
    </UserProvider>
  )
}
