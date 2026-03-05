/**
 * Layout pour l'onboarding couple.
 * Pas de sidebar - uniquement le flow guidé.
 */
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CoupleOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Vérifier si l'onboarding est déjà terminé
  const { data: prefs } = await supabase
    .from('couple_preferences')
    .select('profile_completed')
    .eq('couple_id', user.id)
    .maybeSingle()

  if (prefs?.profile_completed) {
    redirect("/couple/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F5F0F7]/30 to-white">
      {children}
    </div>
  )
}
