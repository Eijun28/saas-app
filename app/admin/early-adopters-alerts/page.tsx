import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/config/admin'

// Force dynamic rendering to avoid static build with missing env vars
export const dynamic = 'force-dynamic'

export default async function EarlyAdoptersAlertsPage() {
  const supabase = await createClient()
  
  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/sign-in')
  }
  
  // Vérifier que l'email est autorisé (double vérification)
  if (!isAdminEmail(user.email)) {
    redirect('/')
  }
  
  const now = new Date()
  
  // Récupérer TOUS les early adopters avec le client admin pour bypass RLS
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()
  
  const { data: earlyAdopters } = await adminClient
    .from('profiles')
    .select('id, prenom, nom, email, telephone, early_adopter_trial_end_date')
    .eq('is_early_adopter', true)
    .not('early_adopter_trial_end_date', 'is', null)
    .order('early_adopter_trial_end_date', { ascending: true })
  
  // Calculer les jours restants pour chacun
  const usersWithDaysLeft = earlyAdopters?.map(user => {
    const endDate = new Date(user.early_adopter_trial_end_date)
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      ...user,
      daysLeft,
      endDate: endDate.toLocaleDateString('fr-FR'),
      status: daysLeft < 0 ? 'expired' : daysLeft <= 7 ? 'urgent' : daysLeft <= 30 ? 'soon' : 'ok'
    }
  }) || []
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">⚡ Alertes Early Adopters</h1>
      
      {/* Section URGENTE */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          🔴 À APPELER MAINTENANT ({usersWithDaysLeft.filter(u => u.status === 'urgent' || u.status === 'expired').length})
        </h2>
        <div className="space-y-3">
          {usersWithDaysLeft
            .filter(u => u.status === 'urgent' || u.status === 'expired')
            .map(user => (
              <div key={user.id} className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{user.prenom} {user.nom}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.telephone && (
                      <p className="text-sm font-medium">📞 {user.telephone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      user.daysLeft < 0 
                        ? 'bg-red-600 text-white' 
                        : 'bg-orange-500 text-white'
                    }`}>
                      {user.daysLeft < 0 ? '⚠️ EXPIRÉ' : `${user.daysLeft}j restants`}
                    </span>
                    <p className="text-xs mt-1">Fin : {user.endDate}</p>
                  </div>
                </div>
                
                {/* Template d'appel */}
                <div className="mt-3 p-3 bg-white rounded border">
                  <p className="text-sm font-medium mb-2">💬 Script d'appel :</p>
                  <p className="text-sm text-gray-700 italic">
                    "Bonjour {user.prenom}, c'est [ton nom] de Nuply. Je t'appelle car ton accès Early Adopter 
                    {user.daysLeft < 0 ? ' a expiré' : ` expire dans ${user.daysLeft} jour${user.daysLeft > 1 ? 's' : ''}`}. 
                    J'aimerais discuter avec toi de ton expérience et des options d'abonnement."
                  </p>
                </div>
                
                {/* Checkbox pour tracker */}
                <label className="mt-3 flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">✅ Appelé et discuté</span>
                </label>
              </div>
            ))}
        </div>
      </div>
      
      {/* Section BIENTÔT */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-orange-600 mb-4">
          🟡 À préparer (expire dans 8-30j) ({usersWithDaysLeft.filter(u => u.status === 'soon').length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usersWithDaysLeft
            .filter(u => u.status === 'soon')
            .map(user => (
              <div key={user.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="font-bold">{user.prenom} {user.nom}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                {user.telephone && (
                  <p className="text-sm text-gray-600">📞 {user.telephone}</p>
                )}
                <p className="text-sm mt-2">
                  <span className="bg-orange-200 px-2 py-1 rounded">{user.daysLeft}j restants</span>
                  <span className="text-xs ml-2">• {user.endDate}</span>
                </p>
              </div>
            ))}
        </div>
      </div>
      
      {/* Section OK */}
      <div>
        <h2 className="text-xl font-bold text-green-600 mb-4">
          🟢 Tout va bien (30j+) ({usersWithDaysLeft.filter(u => u.status === 'ok').length})
        </h2>
        <p className="text-sm text-gray-600">
          {usersWithDaysLeft.filter(u => u.status === 'ok').length} prestataires ont encore du temps
        </p>
      </div>
    </div>
  )
}
