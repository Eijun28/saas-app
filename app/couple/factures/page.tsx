'use client'

// app/couple/factures/page.tsx
// Page de consultation des factures reçues par le couple + paiement en ligne

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  ExternalLink,
  CreditCard,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTitle } from '@/components/couple/shared/PageTitle'
import { PayInvoiceButton } from '@/components/payments/PayInvoiceButton'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import type { Facture } from '@/types/billing'

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  draft:     { label: 'Brouillon',  className: 'bg-gray-100 text-gray-600',          icon: Clock },
  sent:      { label: 'À payer',    className: 'bg-blue-50 text-blue-700',            icon: Clock },
  paid:      { label: 'Payée',      className: 'bg-green-50 text-green-700',          icon: CheckCircle },
  overdue:   { label: 'En retard',  className: 'bg-red-50 text-red-600',              icon: AlertCircle },
  cancelled: { label: 'Annulée',    className: 'bg-gray-100 text-gray-500',           icon: Clock },
}

const formatEur = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export default function CoupleFacturesPage() {
  const { user }                    = useUser()
  const searchParams                = useSearchParams()
  const [factures, setFactures]     = useState<Facture[]>([])
  const [loading, setLoading]       = useState(true)
  const supabase                    = createClient()

  // Notification après retour du paiement Stripe
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const factureId     = searchParams.get('facture')
    if (paymentStatus === 'success' && factureId) {
      toast.success('Paiement confirmé ! Vous recevrez un reçu par email.')
    } else if (paymentStatus === 'cancelled') {
      toast.info('Paiement annulé. Votre facture reste en attente.')
    }
  }, [searchParams])

  const loadFactures = useCallback(async () => {
    if (!user) return
    try {
      // Récupérer le couple de l'utilisateur
      const { data: couple } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!couple) { setLoading(false); return }

      // Récupérer les factures du couple avec infos prestataire
      const { data, error } = await supabase
        .from('factures')
        .select(`
          *,
          profiles!factures_prestataire_id_fkey (
            id,
            prenom,
            nom,
            business_name,
            avatar_url
          )
        `)
        .eq('couple_id', couple.id)
        .in('status', ['sent', 'paid', 'overdue'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setFactures(data || [])
    } catch {
      toast.error('Impossible de charger les factures')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    loadFactures()
  }, [loadFactures])

  const totalDu = factures
    .filter(f => ['sent', 'overdue'].includes(f.status))
    .reduce((sum, f) => sum + Number(f.amount_ttc), 0)

  const totalPaye = factures
    .filter(f => f.status === 'paid')
    .reduce((sum, f) => sum + Number(f.amount_ttc), 0)

  return (
    <div className="w-full space-y-6">

      {/* En-tête */}
      <PageTitle
        title="Mes factures"
        description="Consultez et réglez les factures de vos prestataires"
      />

      {/* KPIs */}
      {!loading && factures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Reste à régler</p>
              <p className="text-lg sm:text-xl font-bold text-[#823F91] truncate">{formatEur(totalDu)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Déjà payé</p>
              <p className="text-lg sm:text-xl font-bold text-green-600 truncate">{formatEur(totalPaye)}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Liste des factures */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-3"
      >
        {loading ? (
          [1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : factures.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-3">
              <Receipt className="h-12 w-12 text-gray-300" />
              <p className="text-muted-foreground text-center">
                Aucune facture pour le moment.<br />
                Elles apparaîtront ici quand vos prestataires vous en enverront.
              </p>
            </CardContent>
          </Card>
        ) : (
          factures.map(facture => {
            const statusCfg = STATUS_CONFIG[facture.status] ?? STATUS_CONFIG.sent
            const StatusIcon = statusCfg.icon
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const prestataire = (facture as any).profiles as {
              prenom?: string; nom?: string; business_name?: string
            } | null
            const prestataireName = prestataire?.business_name ||
              `${prestataire?.prenom || ''} ${prestataire?.nom || ''}`.trim() ||
              'Prestataire'

            return (
              <motion.div
                key={facture.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                      {/* Infos facture */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{facture.facture_number}</span>
                          <Badge className={statusCfg.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                          {facture.online_payment_enabled && facture.status !== 'paid' && (
                            <Badge className="bg-[#823F91]/10 text-[#823F91] gap-1">
                              <CreditCard className="h-3 w-3" />
                              Paiement en ligne
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium truncate">{facture.title}</p>
                        <p className="text-sm text-muted-foreground">{prestataireName}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Émise le {formatDate(facture.issue_date)}</span>
                          {facture.due_date && (
                            <span className={facture.status === 'overdue' ? 'text-red-500 font-medium' : ''}>
                              Échéance {formatDate(facture.due_date)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Montant + actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${facture.status === 'paid' ? 'text-green-600' : 'text-gray-900'}`}>
                            {formatEur(Number(facture.amount_ttc))}
                          </p>
                          {facture.tva_rate > 0 && (
                            <p className="text-xs text-muted-foreground">dont TVA {formatEur(Number(facture.amount_tva))}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <PayInvoiceButton facture={facture} onPaymentInitiated={loadFactures} />

                          {facture.pdf_url && (
                            <Button variant="outline" size="sm" asChild className="gap-1 text-xs">
                              <a href={facture.pdf_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3" />
                                PDF
                              </a>
                            </Button>
                          )}

                          {facture.status === 'paid' && facture.online_payment_url && (
                            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-muted-foreground">
                              <a href={facture.online_payment_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                                Reçu
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </motion.div>
    </div>
  )
}
