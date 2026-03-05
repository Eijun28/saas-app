import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/config/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function EarlyAdoptersAlertsPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/sign-in')
  }

  if (!isAdminEmail(user.email)) {
    redirect('/')
  }

  const now = new Date()

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data: earlyAdopters } = await adminClient
    .from('profiles')
    .select('id, prenom, nom, email, telephone, early_adopter_trial_end_date')
    .eq('is_early_adopter', true)
    .not('early_adopter_trial_end_date', 'is', null)
    .order('early_adopter_trial_end_date', { ascending: true })

  const usersWithDaysLeft = earlyAdopters?.map(user => {
    const endDate = new Date(user.early_adopter_trial_end_date)
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      ...user,
      daysLeft,
      endDate: endDate.toLocaleDateString('fr-FR'),
      status: daysLeft < 0 ? 'expired' : daysLeft <= 7 ? 'urgent' : daysLeft <= 30 ? 'soon' : 'ok' as const
    }
  }) || []

  const urgentCount = usersWithDaysLeft.filter(u => u.status === 'urgent' || u.status === 'expired').length
  const soonCount = usersWithDaysLeft.filter(u => u.status === 'soon').length
  const okCount = usersWithDaysLeft.filter(u => u.status === 'ok').length

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B0E12]">Early Adopters</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Suivi des périodes d&apos;essai et alertes d&apos;expiration
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-200 shadow-sm bg-red-50/30">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Urgent / Expiré</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{urgentCount}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 shadow-sm bg-amber-50/30">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Expire bientôt</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{soonCount}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 shadow-sm bg-green-50/30">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">OK (30j+)</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{okCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent */}
      {urgentCount > 0 && (
        <Card className="border-red-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-red-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              À contacter maintenant ({urgentCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {usersWithDaysLeft
              .filter(u => u.status === 'urgent' || u.status === 'expired')
              .map(user => (
                <div key={user.id} className="rounded-xl border border-red-200 bg-white p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[#0B0E12]">{user.prenom} {user.nom}</p>
                      <p className="text-xs text-[#6B7280]">{user.email}</p>
                      {user.telephone && (
                        <p className="text-sm font-medium text-[#374151]">📞 {user.telephone}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <Badge
                        variant="outline"
                        className={
                          user.daysLeft < 0
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-amber-500 text-white border-amber-500'
                        }
                      >
                        {user.daysLeft < 0 ? 'EXPIRÉ' : `${user.daysLeft}j restants`}
                      </Badge>
                      <p className="text-[10px] text-[#9CA3AF]">Fin : {user.endDate}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-[#374151] mb-1">Script d&apos;appel :</p>
                    <p className="text-xs text-[#6B7280] italic leading-relaxed">
                      &quot;Bonjour {user.prenom}, c&apos;est [ton nom] de Nuply. Je t&apos;appelle car ton accès Early Adopter
                      {user.daysLeft < 0 ? ' a expiré' : ` expire dans ${user.daysLeft} jour${user.daysLeft > 1 ? 's' : ''}`}.
                      J&apos;aimerais discuter avec toi de ton expérience et des options d&apos;abonnement.&quot;
                    </p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Soon */}
      {soonCount > 0 && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-amber-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              À préparer — expire dans 8-30j ({soonCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {usersWithDaysLeft
                .filter(u => u.status === 'soon')
                .map(user => (
                  <div key={user.id} className="rounded-lg border border-gray-200 bg-white p-3 space-y-1">
                    <p className="font-medium text-sm text-[#0B0E12]">{user.prenom} {user.nom}</p>
                    <p className="text-xs text-[#6B7280]">{user.email}</p>
                    {user.telephone && <p className="text-xs text-[#6B7280]">📞 {user.telephone}</p>}
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {user.daysLeft}j restants
                      </Badge>
                      <span className="text-[10px] text-[#9CA3AF]">{user.endDate}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OK */}
      {okCount > 0 && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-green-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Tout va bien — 30j+ ({okCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#6B7280]">
              {okCount} prestataire{okCount > 1 ? 's' : ''} ont encore du temps sur leur période d&apos;essai.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
