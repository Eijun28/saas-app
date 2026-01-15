import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Send, UserRound } from 'lucide-react'

export const revalidate = 0

type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

type RequestRow = {
  id: string
  couple_id: string
  provider_id: string
  status: RequestStatus
  initial_message: string
  created_at: string
  cancelled_at: string | null
  responded_at: string | null
}

type ProviderProfile = {
  id: string
  prenom: string | null
  nom: string | null
  nom_entreprise: string | null
  avatar_url: string | null
  service_type: string | null
}

const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  cancelled: 'Annulée',
}

const STATUS_BADGE_CLASS: Record<RequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
}

function getProviderDisplayName(p?: ProviderProfile): string {
  if (!p) return 'Prestataire'
  if (p.nom_entreprise) return p.nom_entreprise
  const full = [p.prenom, p.nom].filter(Boolean).join(' ').trim()
  return full || 'Prestataire'
}

export default async function DemandesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Le layout couple redirige déjà si non connecté, mais on reste safe
  if (!user) return null

  async function cancelRequest(formData: FormData) {
    'use server'
    const requestId = String(formData.get('requestId') || '')
    if (!requestId) return

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // RLS + trigger garantissent la sécurité (pending only)
    await supabase
      .from('requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('couple_id', user.id)
      .eq('status', 'pending')

    revalidatePath('/couple/demandes')
  }

  const { data: requests, error } = await supabase
    .from('requests')
    .select('id, couple_id, provider_id, status, initial_message, created_at, cancelled_at, responded_at')
    .eq('couple_id', user.id)
    .order('created_at', { ascending: false })
    .returns<RequestRow[]>()

  if (error) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Demandes</CardTitle>
          <CardDescription>Impossible de charger vos demandes pour le moment.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Détail technique : <code className="text-xs">{error.message}</code>
          </p>
        </CardContent>
      </Card>
    )
  }

  const providerIds = Array.from(new Set((requests || []).map((r) => r.provider_id)))
  const providerById = new Map<string, ProviderProfile>()

  if (providerIds.length > 0) {
    const { data: providers } = await supabase
      .from('profiles')
      .select('id, prenom, nom, nom_entreprise, avatar_url, service_type')
      .in('id', providerIds)
      .returns<ProviderProfile[]>()

    for (const p of providers || []) providerById.set(p.id, p)
  }

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-[#6B7280]">
            Vos demandes sont envoyées à des prestataires. Le chat s’active uniquement quand une demande est acceptée.
          </p>
        </div>

        {!requests || requests.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="pt-12 pb-12 text-center">
              <Send className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune demande envoyée</h3>
              <p className="text-gray-500">Quand vous contactez un prestataire, la demande apparaîtra ici.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const provider = providerById.get(r.provider_id)
              const name = getProviderDisplayName(provider)

              return (
                <Card key={r.id} className="border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {provider?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={provider.avatar_url}
                            alt={name}
                            className="h-11 w-11 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-gray-100 border flex items-center justify-center">
                            <UserRound className="h-5 w-5 text-gray-500" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{name}</CardTitle>
                          <CardDescription className="text-sm">
                            Envoyée le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                          </CardDescription>
                        </div>
                      </div>

                      <Badge variant="outline" className={STATUS_BADGE_CLASS[r.status]}>
                        {STATUS_LABEL[r.status]}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.initial_message}</p>

                    {r.status === 'pending' ? (
                      <form action={cancelRequest} className="flex justify-end">
                        <input type="hidden" name="requestId" value={r.id} />
                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                          Annuler la demande
                        </Button>
                      </form>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

