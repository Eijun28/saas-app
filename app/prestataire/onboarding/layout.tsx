/**
 * Layout séparé pour l'onboarding prestataire.
 * Pas de sidebar - uniquement le flow guidé.
 */
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function OnboardingLayout({
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_step')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && profile.onboarding_step >= 5) {
    redirect("/prestataire/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
      {children}
    </div>
  )
}
