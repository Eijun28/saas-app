import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/config/admin'
import { AdminShell } from './admin-shell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/sign-in')
  }

  if (!isAdminEmail(user.email)) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-2xl p-10 max-w-md text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Accès refusé</h1>
          <p className="text-sm text-[#6B7280] mb-6">
            Seuls les administrateurs autorisés peuvent accéder à cette section.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-[#823F91] text-white rounded-lg hover:bg-[#6D3478] transition-colors text-sm font-medium"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    )
  }

  return <AdminShell userEmail={user.email ?? ''}>{children}</AdminShell>
}
