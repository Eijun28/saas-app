'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import VendorInvitationForm from '@/components/vendor-invitation-form'

interface Invitation {
  id: string
  email: string
  nom_entreprise?: string
  prenom?: string
  nom?: string
  service_type?: string
  status: string
  channel: string
  created_at: string
  accepted_at?: string
  viewed_at?: string
  viewed_count: number
  invitation_expires_at: string
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En attente</Badge>
    case 'accepted':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Acceptée</Badge>
    case 'expired':
      return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">Expirée</Badge>
    case 'revoked':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Révoquée</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function InvitationsPrestatairesClient({ invitations }: { invitations: Invitation[] }) {
  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D0D0D]">Invitations prestataires</h1>
        <p className="text-[#6B7280] mt-1">Invitez des prestataires sur Nuply par email, lien ou QR code</p>
      </div>

      {/* Formulaire */}
      <VendorInvitationForm />

      {/* Liste des invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invitations envoyées ({invitations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-sm text-[#6B7280] text-center py-8">Aucune invitation envoyée</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{inv.email}</span>
                      {statusBadge(inv.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                      {inv.nom_entreprise && <span>{inv.nom_entreprise}</span>}
                      {inv.service_type && <span>{inv.service_type}</span>}
                      <span>via {inv.channel}</span>
                      {inv.viewed_count > 0 && (
                        <span>{inv.viewed_count} vue{inv.viewed_count > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-[#9CA3AF]">
                    {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
