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

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted: { label: 'Acceptée', className: 'bg-green-50 text-green-700 border-green-200' },
  expired: { label: 'Expirée', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  revoked: { label: 'Révoquée', className: 'bg-red-50 text-red-700 border-red-200' },
}

export default function InvitationsPrestatairesClient({ invitations }: { invitations: Invitation[] }) {
  const pending = invitations.filter(i => i.status === 'pending').length
  const accepted = invitations.filter(i => i.status === 'accepted').length

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B0E12]">Invitations prestataires</h1>
        <p className="text-sm text-[#6B7280] mt-1">Invitez des prestataires sur Nuply par email, lien ou QR code</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-[#0B0E12] mt-1">{invitations.length}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">En attente</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pending}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Acceptées</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{accepted}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <VendorInvitationForm />

      {/* List */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Invitations envoyées ({invitations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-sm text-[#6B7280] text-center py-8">Aucune invitation envoyée</p>
          ) : (
            <div className="space-y-2">
              {invitations.map((inv) => {
                const config = statusConfig[inv.status] ?? { label: inv.status, className: '' }
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[#0B0E12] truncate">{inv.email}</span>
                        <Badge variant="outline" className={config.className}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                        {inv.nom_entreprise && <span>{inv.nom_entreprise}</span>}
                        {inv.nom_entreprise && inv.service_type && <span>·</span>}
                        {inv.service_type && <span>{inv.service_type}</span>}
                        <span>· via {inv.channel}</span>
                        {inv.viewed_count > 0 && (
                          <span>· {inv.viewed_count} vue{inv.viewed_count > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[#9CA3AF] shrink-0 ml-4">
                      {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
