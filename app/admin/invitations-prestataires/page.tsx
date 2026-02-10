import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/config/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import InvitationsPrestatairesClient from './client'

export const dynamic = 'force-dynamic'

export default async function InvitationsPrestatairesPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/sign-in')
  }

  if (!isAdminEmail(user.email)) {
    redirect('/')
  }

  // Récupérer les invitations existantes
  const adminClient = createAdminClient()
  const { data: invitations } = await adminClient
    .from('vendor_invitations')
    .select('id, email, nom_entreprise, prenom, nom, service_type, status, channel, created_at, accepted_at, viewed_at, viewed_count, invitation_expires_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return <InvitationsPrestatairesClient invitations={invitations || []} />
}
