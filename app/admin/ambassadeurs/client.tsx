'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { AmbassadorWithStats } from '@/types/ambassador'

interface Props {
  ambassadeurs: AmbassadorWithStats[]
}

function StatusBadge({ isAmb, active }: { isAmb: boolean; active: boolean }) {
  if (!isAmb) return <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50">Prestataire</Badge>
  if (!active) return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Désactivé</Badge>
  return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Actif</Badge>
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
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B0E12]">Programme Ambassadeur</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Gérez les prestataires ambassadeurs et leurs gains
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Ambassadeurs actifs</p>
            <p className="text-2xl font-bold text-[#823F91] mt-1">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Gains en attente</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{totalPending.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Total prestataires</p>
            <p className="text-2xl font-bold text-[#0B0E12] mt-1">{ambassadeurs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Prestataires</CardTitle>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setFilter('ambassadors')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                filter === 'ambassadors'
                  ? 'bg-white text-[#0B0E12] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Ambassadeurs ({activeCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white text-[#0B0E12] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#374151]'
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
              {/* Header */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-3 py-2 text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                <span>Prestataire</span>
                <span>Code</span>
                <span className="text-right">Filleuls</span>
                <span className="text-right">Convertis</span>
                <span className="text-right">Gains</span>
                <span />
              </div>

              {displayed.map(amb => (
                <div
                  key={amb.provider_id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-3 py-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/60 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-[#0B0E12]">
                        {amb.nom_entreprise || `${amb.prenom ?? ''} ${amb.nom ?? ''}`.trim() || amb.email}
                      </span>
                      <StatusBadge isAmb={amb.is_ambassador} active={amb.ambassador_active} />
                    </div>
                    <p className="text-xs text-[#9CA3AF]">{amb.email}</p>
                    {amb.ambassador_since && (
                      <p className="text-[10px] text-[#9CA3AF]">
                        Depuis le {new Date(amb.ambassador_since).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>

                  <span className="font-mono text-xs text-[#823F91] bg-[#F5F0F7] px-2 py-1 rounded-md w-fit">
                    {amb.referral_code}
                  </span>

                  <div className="text-sm font-semibold text-right text-[#0B0E12]">
                    {amb.total_referrals}
                    {amb.total_referrals >= 20 && (
                      <span className="ml-1 text-xs text-amber-500" title="Milestone +2€ actif">★</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-right text-green-700">
                    {amb.total_converted}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#0B0E12]">{amb.total_earnings.toFixed(2)} €</p>
                    {amb.pending_earnings > 0 && (
                      <p className="text-[10px] text-amber-600">{amb.pending_earnings.toFixed(2)} € en attente</p>
                    )}
                  </div>

                  <Button
                    onClick={() => toggle(amb)}
                    disabled={loadingId === amb.provider_id}
                    variant={amb.is_ambassador && amb.ambassador_active ? 'outline' : 'default'}
                    size="sm"
                    className={
                      amb.is_ambassador && amb.ambassador_active
                        ? 'text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs'
                        : 'bg-[#823F91] hover:bg-[#6D3478] text-white h-8 text-xs'
                    }
                  >
                    {loadingId === amb.provider_id
                      ? '...'
                      : amb.is_ambassador && amb.ambassador_active
                      ? 'Désactiver'
                      : 'Activer'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="text-[10px] text-[#9CA3AF] space-y-0.5 px-1">
        <p>★ = milestone atteint (≥ 20 filleuls) — +2 € par inscription supplémentaire</p>
        <p>Règles : +5 € par filleul inscrit · +10 € si abonnement payant · +2 € bonus dès le 20ème filleul</p>
      </div>
    </div>
  )
}
