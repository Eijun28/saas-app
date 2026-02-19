'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { AmbassadorWithStats } from '@/types/ambassador'

interface Props {
  ambassadeurs: AmbassadorWithStats[]
}

function StatusBadge({ isAmb, active }: { isAmb: boolean; active: boolean }) {
  if (!isAmb) return <Badge variant="outline" className="text-gray-500 border-gray-200">Prestataire</Badge>
  if (!active) return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Désactivé</Badge>
  return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ambassadeur actif</Badge>
}

export default function AmbassadeursClient({ ambassadeurs: initial }: Props) {
  const [ambassadeurs, setAmbassadeurs] = useState(initial)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'ambassadors'>('ambassadors')

  const displayed = filter === 'ambassadors'
    ? ambassadeurs.filter(a => a.is_ambassador)
    : ambassadeurs

  const activeCount = ambassadeurs.filter(a => a.is_ambassador && a.ambassador_active).length
  const totalPending = ambassadeurs.reduce((s, a) => s + a.pending_earnings, 0)

  async function toggle(amb: AmbassadorWithStats) {
    setLoadingId(amb.provider_id)
    const action = !amb.is_ambassador || !amb.ambassador_active ? 'activate' : 'deactivate'

    try {
      const res = await fetch('/api/admin/ambassadeurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: amb.provider_id, action }),
      })

      if (!res.ok) throw new Error()

      setAmbassadeurs(prev =>
        prev.map(a =>
          a.provider_id === amb.provider_id
            ? {
                ...a,
                is_ambassador: action === 'activate' ? true : a.is_ambassador,
                ambassador_active: action === 'activate',
                ambassador_since: action === 'activate' ? new Date().toISOString() : a.ambassador_since,
              }
            : a
        )
      )
      toast.success(action === 'activate' ? 'Ambassadeur activé' : 'Ambassadeur désactivé')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D0D0D]">Programme Ambassadeur</h1>
        <p className="text-[#6B7280] mt-1">
          Gérez les prestataires ambassadeurs et leurs gains
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-[#6B7280]">Ambassadeurs actifs</p>
            <p className="text-3xl font-bold text-[#0D0D0D] mt-1">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-[#6B7280]">Gains en attente</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{totalPending.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-[#6B7280]">Total prestataires</p>
            <p className="text-3xl font-bold text-[#0D0D0D] mt-1">{ambassadeurs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Prestataires</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('ambassadors')}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'ambassadors'
                  ? 'bg-[#823F91] text-white'
                  : 'text-[#6B7280] hover:bg-gray-100'
              }`}
            >
              Ambassadeurs ({activeCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-[#823F91] text-white'
                  : 'text-[#6B7280] hover:bg-gray-100'
              }`}
            >
              Tous ({ambassadeurs.length})
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {displayed.length === 0 ? (
            <p className="text-sm text-[#6B7280] text-center py-8">
              {filter === 'ambassadors' ? 'Aucun ambassadeur actif' : 'Aucun prestataire'}
            </p>
          ) : (
            <div className="space-y-2">
              {/* En-tête */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-3 py-2 text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
                <span>Prestataire</span>
                <span>Code</span>
                <span className="text-right">Filleuls</span>
                <span className="text-right">Convertis</span>
                <span className="text-right">Gains (€)</span>
                <span></span>
              </div>

              {displayed.map(amb => (
                <div
                  key={amb.provider_id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-3 py-3 rounded-xl border bg-white hover:bg-gray-50/60 transition-colors"
                >
                  {/* Identité */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-[#0D0D0D]">
                        {amb.nom_entreprise || `${amb.prenom ?? ''} ${amb.nom ?? ''}`.trim() || amb.email}
                      </span>
                      <StatusBadge isAmb={amb.is_ambassador} active={amb.ambassador_active} />
                    </div>
                    <p className="text-xs text-[#9CA3AF]">{amb.email}</p>
                    {amb.ambassador_since && (
                      <p className="text-xs text-[#9CA3AF]">
                        Depuis le {new Date(amb.ambassador_since).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>

                  {/* Code */}
                  <span className="font-mono text-xs text-[#823F91] bg-purple-50 px-2 py-1 rounded-md w-fit">
                    {amb.referral_code}
                  </span>

                  {/* Stats */}
                  <div className="text-sm font-semibold text-right text-[#0D0D0D]">
                    {amb.total_referrals}
                    {amb.total_referrals >= 20 && (
                      <span className="ml-1 text-xs text-amber-600" title="Milestone +2€ actif">★</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-right text-green-700">
                    {amb.total_converted}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#0D0D0D]">{amb.total_earnings.toFixed(2)} €</p>
                    {amb.pending_earnings > 0 && (
                      <p className="text-xs text-amber-600">{amb.pending_earnings.toFixed(2)} € en attente</p>
                    )}
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => toggle(amb)}
                    disabled={loadingId === amb.provider_id}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 ${
                      amb.is_ambassador && amb.ambassador_active
                        ? 'text-red-600 border border-red-200 hover:bg-red-50'
                        : 'text-white bg-[#823F91] hover:bg-[#6D3478]'
                    }`}
                  >
                    {loadingId === amb.provider_id
                      ? '...'
                      : amb.is_ambassador && amb.ambassador_active
                      ? 'Désactiver'
                      : 'Activer'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Légende */}
      <div className="text-xs text-[#9CA3AF] space-y-1 px-1">
        <p>★ = milestone atteint (≥ 20 filleuls) — +2 € par inscription supplémentaire</p>
        <p>Règles : +5 € par filleul inscrit · +10 € si abonnement payant · +2 € bonus dès le 20ème filleul</p>
      </div>
    </div>
  )
}
