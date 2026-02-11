import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { PrestataireSidebarWrapper } from "./sidebar-wrapper"
import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarInsetWrapper } from "./sidebar-inset-wrapper"

export default async function PrestataireLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  // L'onboarding a son propre layout minimal (pas de sidebar)
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  if (pathname.includes('/onboarding')) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <PrestataireSidebarWrapper />
      <SidebarInsetWrapper>
        {children}
      </SidebarInsetWrapper>
    </SidebarProvider>
  )
}
