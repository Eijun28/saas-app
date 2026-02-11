'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import VendorInvitationForm from '@/components/vendor-invitation-form'
import { useUser } from '@/hooks/use-user'
import { Loader2 } from 'lucide-react'

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
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accept&eacute;e</Badge>
    case 'expired':
      return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">Expir&eacute;e</Badge>
    case 'revoked':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">R&eacute;voqu&eacute;e</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function InviterPrestatairePage() {
  const { user } = useUser()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  const loadInvitations = async () => {
    try {
      const response = await fetch('/api/vendor-invitations')
      const data = await response.json()
      if (response.ok && data.invitations) {
        setInvitations(data.invitations)
      }
    } catch (error) {
      console.error('Erreur chargement invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadInvitations()
    }
  }, [user])

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto space-y-8 py-6 px-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Inviter un prestataire</h1>
          <p className="text-[#6B7280] mt-1">
            Invitez un prestataire que vous connaissez par email, lien direct, WhatsApp ou QR code
          </p>
        </div>

        <VendorInvitationForm />

        {/* Liste des invitations envoy&eacute;es */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Mes invitations envoy&eacute;es {!loading && `(${invitations.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#823F91]" />
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-sm text-[#6B7280] text-center py-8">Aucune invitation envoy&eacute;e</p>
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
    </div>
  )
}
