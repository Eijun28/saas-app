import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/config/admin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/sign-in')
  }
  
  // Vérifier que l'email est autorisé
  if (!isAdminEmail(user.email)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border-2 border-red-200 rounded-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">🚫 Accès refusé</h1>
          <p className="text-gray-700 mb-2">
            Vous n'avez pas l'autorisation d'accéder à cette page.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Seuls les administrateurs autorisés peuvent accéder à cette section.
          </p>
          <a 
            href="/" 
            className="inline-block px-4 py-2 bg-[#823F91] text-white rounded-lg hover:bg-[#6D3478] transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">🔧 Administration</h1>
            <div className="flex items-center gap-4">
              <a
                href="/admin/bypass-confirmation"
                className="text-sm text-[#823F91] hover:text-[#6D3478] font-medium"
              >
                Bypass confirmation
              </a>
              <a
                href="/admin/invitations-prestataires"
                className="text-sm text-[#823F91] hover:text-[#6D3478] font-medium"
              >
                Invitations
              </a>
              <a
                href="/admin/early-adopters-alerts"
                className="text-sm text-[#823F91] hover:text-[#6D3478] font-medium"
              >
                Early Adopters
              </a>
              <a
                href="/admin/ambassadeurs"
                className="text-sm text-[#823F91] hover:text-[#6D3478] font-medium"
              >
                Ambassadeurs
              </a>
              <a
                href="/admin/newsletter"
                className="text-sm text-[#823F91] hover:text-[#6D3478] font-medium"
              >
                Newsletter
              </a>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
