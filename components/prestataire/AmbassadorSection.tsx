'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Users, TrendingUp, Wallet, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { AmbassadorDashboard, AmbassadorEarningType } from '@/types/ambassador'

const EARNING_TYPE_LABEL: Record<AmbassadorEarningType, string> = {
  signup: '+5 € inscription',
  conversion: '+10 € conversion',
  milestone: '+2 € milestone',
}

const EARNING_TYPE_COLOR: Record<AmbassadorEarningType, string> = {
  signup: 'text-blue-700 bg-blue-50',
  conversion: 'text-green-700 bg-green-50',
  milestone: 'text-amber-700 bg-amber-50',
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-gray-50 rounded-xl p-4">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

export default function AmbassadorSection() {
  const [data, setData] = useState<AmbassadorDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/prestataire/ambassador')
      if (!res.ok) return
      const json = await res.json()
      if (json.is_ambassador) {
        setData(json as AmbassadorDashboard)
      }
    } catch {
      // silencieux
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (isLoading || !data) return null

  const cardClass = "bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] border border-gray-100 rounded-2xl"
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/sign-up?ref=${data.referral_code}`

  function copyCode() {
    navigator.clipboard.writeText(data!.referral_code)
    setCopied(true)
    toast.success('Code copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink)
    toast.success('Lien copié !')
  }

  const milestoneReached = data.total_referrals >= 20
  const milestoneProgress = Math.min(data.total_referrals, 20)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 }}
    >
    <Card className={cardClass}>
    <div className="p-5 sm:p-7">
    <div className="space-y-6">
      {/* En-tête ambassadeur */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-[#823F91]/10 mt-0.5">
          <Star className="h-5 w-5 text-[#823F91]" />
        </div>
        <div>
          <h3 className="font-semibold text-base sm:text-lg text-gray-900">Espace Ambassadeur</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Parrainez des prestataires pros et gagnez des commissions
          </p>
        </div>
      </div>

      {!data.ambassador_active && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-700">
          Votre accès ambassadeur est temporairement désactivé. Contactez le support pour plus d&apos;informations.
        </div>
      )}

      {/* Code de parrainage */}
      <div className="rounded-2xl border border-[#823F91]/20 bg-gradient-to-br from-purple-50/60 to-white p-5 space-y-3">
        <p className="text-sm font-medium text-gray-700">Votre code ambassadeur</p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl font-bold tracking-widest text-[#823F91]">
            {data.referral_code}
          </span>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 text-sm font-medium text-[#823F91] hover:text-[#6D3478] px-3 py-1.5 rounded-lg border border-[#823F91]/30 hover:bg-purple-50 transition-colors"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-gray-400 truncate">{referralLink}</span>
          <button
            onClick={copyLink}
            className="text-xs text-[#823F91] hover:underline whitespace-nowrap"
          >
            Copier le lien
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Filleuls inscrits"
          value={String(data.total_referrals)}
          sub={milestoneReached ? '★ Milestone actif' : undefined}
        />
        <StatCard
          label="Convertis"
          value={String(data.total_converted)}
          sub="abonnement payant"
        />
        <StatCard
          label="Gains totaux"
          value={`${data.earnings.total.toFixed(2)} €`}
        />
        <StatCard
          label="En attente"
          value={`${(data.earnings.pending + data.earnings.validated).toFixed(2)} €`}
          sub={`${data.earnings.paid.toFixed(2)} € versé`}
        />
      </div>

      {/* Barre de progression milestone */}
      {!milestoneReached && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Bonus milestone (+2 € dès le 20ème filleul)
            </span>
            <span>{milestoneProgress}/20</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#823F91] to-[#B855D6] rounded-full transition-all duration-500"
              style={{ width: `${(milestoneProgress / 20) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            Plus que {20 - milestoneProgress} filleul{20 - milestoneProgress > 1 ? 's' : ''} pour débloquer +2 € par inscription
          </p>
        </div>
      )}

      {milestoneReached && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <Star className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            Milestone atteint ! Vous gagnez +2 € bonus sur chaque nouvelle inscription.
          </p>
        </div>
      )}

      {/* Règles du programme */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-gray-500" />
          Règles du programme
        </p>
        <ul className="space-y-1.5 text-sm text-gray-500">
          <li className="flex items-start gap-2">
            <span className="text-[#823F91] font-bold mt-px">+5 €</span>
            <span>par prestataire pro inscrit avec votre code</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-px">+10 €</span>
            <span>supplémentaires si ce filleul prend un abonnement payant</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold mt-px">+2 €</span>
            <span>bonus par inscription à partir de votre 20ème filleul</span>
          </li>
        </ul>
        <p className="text-xs text-gray-400 pt-1">Les gains sont versés manuellement par l&apos;équipe Nuply.</p>
      </div>

      {/* Historique des gains */}
      {data.recent_earnings.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#823F91] transition-colors"
          >
            <Users className="h-4 w-4" />
            Historique des gains ({data.recent_earnings.length})
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {data.recent_earnings.map(e => (
                <div
                  key={e.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl border bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${EARNING_TYPE_COLOR[e.type]}`}>
                      {EARNING_TYPE_LABEL[e.type]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(e.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{Number(e.amount).toFixed(2)} €</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      e.status === 'paid'
                        ? 'bg-green-50 text-green-700'
                        : e.status === 'validated'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {e.status === 'paid' ? 'Versé' : e.status === 'validated' ? 'Validé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </div>
    </Card>
    </motion.div>
  )
}
