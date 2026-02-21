'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  MapPin,
  Calendar,
  CreditCard,
  Hash,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { PaymentStatusBadge } from './PaymentStatusBadge'
import { PaymentForm } from './PaymentForm'
import type { CouplePayment } from '@/types/couple-payments'
import {
  formatEuro,
  formatDate,
  remaining,
  CATEGORY_LABELS,
  METHOD_LABELS,
} from '@/types/couple-payments'
import { cn } from '@/lib/utils'

interface PaymentListProps {
  payments:  CouplePayment[]
  onUpdated: (payment: CouplePayment) => void
  onDeleted: (id: string) => void
}

export function PaymentList({ payments, onUpdated, onDeleted }: PaymentListProps) {
  const [editingPayment, setEditingPayment] = useState<CouplePayment | null>(null)
  const [deletingId, setDeletingId]         = useState<string | null>(null)

  async function handleDelete(payment: CouplePayment) {
    if (!confirm(`Supprimer "${payment.label}" (${payment.provider_name}) ?`)) return
    setDeletingId(payment.id)
    try {
      const res = await fetch(`/api/couple-payments/${payment.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onDeleted(payment.id)
      toast.success('Paiement supprimé')
    } catch {
      toast.error('Impossible de supprimer ce paiement')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleMarkPaid(payment: CouplePayment) {
    try {
      const res = await fetch(`/api/couple-payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: payment.amount_total,
          paid_date:   new Date().toISOString().slice(0, 10),
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      onUpdated(data.payment)
      toast.success('Marqué comme payé')
    } catch {
      toast.error('Impossible de mettre à jour le paiement')
    }
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
          <CreditCard className="h-7 w-7 text-[#823F91]/50" />
        </div>
        <p className="text-gray-500 font-medium">Aucun paiement enregistré</p>
        <p className="text-sm text-gray-400 mt-1">
          Ajoutez vos acomptes et soldes pour ne plus rien oublier
        </p>
      </div>
    )
  }

  // Grouper par prestataire
  const byProvider = payments.reduce<Record<string, CouplePayment[]>>((acc, p) => {
    ;(acc[p.provider_name] ??= []).push(p)
    return acc
  }, {})

  return (
    <>
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {Object.entries(byProvider).map(([providerName, provPayments]) => (
            <motion.div
              key={providerName}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
            >
              {/* En-tête prestataire */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">{providerName}</p>
                  <p className="text-[11px] text-gray-400">
                    {CATEGORY_LABELS[provPayments[0].category]}
                    {' · '}
                    {formatEuro(provPayments.reduce((s, p) => s + p.amount_total, 0))} engagé
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-gray-700">
                    {formatEuro(provPayments.reduce((s, p) => s + p.amount_paid, 0))} réglé
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {formatEuro(provPayments.reduce((s, p) => s + remaining(p), 0))} restant
                  </p>
                </div>
              </div>

              {/* Jalons */}
              <div className="divide-y divide-gray-50">
                {provPayments.map(payment => {
                  const rest = remaining(payment)
                  const pct  = payment.amount_total > 0
                    ? Math.round((payment.amount_paid / payment.amount_total) * 100)
                    : 0

                  return (
                    <div key={payment.id} className="px-4 py-3 group hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Ligne principale */}
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[13px] font-medium text-gray-800">{payment.label}</span>
                            <PaymentStatusBadge status={payment.status} />
                          </div>

                          {/* Montants + barre */}
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className="text-[15px] font-bold text-gray-900">
                              {formatEuro(payment.amount_total)}
                            </span>
                            {payment.amount_paid > 0 && (
                              <span className="text-[12px] text-green-600 font-medium">
                                {formatEuro(payment.amount_paid)} réglé
                              </span>
                            )}
                            {rest > 0 && (
                              <span className="text-[12px] text-gray-400">
                                {formatEuro(rest)} restant
                              </span>
                            )}
                          </div>

                          {/* Mini barre de progression */}
                          {payment.amount_total > 0 && (
                            <div className="h-1 bg-gray-100 rounded-full w-32 mb-2">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  pct === 100 ? 'bg-green-500' : 'bg-[#823F91]'
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}

                          {/* Métadonnées */}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                            {payment.due_date && (
                              <span className={cn(
                                'flex items-center gap-1',
                                payment.status === 'overdue' ? 'text-red-500 font-medium' : ''
                              )}>
                                <Calendar className="h-3 w-3" />
                                Échéance : {formatDate(payment.due_date)}
                              </span>
                            )}
                            {payment.paid_date && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                Payé le {formatDate(payment.paid_date)}
                              </span>
                            )}
                            {payment.method !== 'autre' && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {METHOD_LABELS[payment.method]}
                              </span>
                            )}
                            {payment.reference && (
                              <span className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                {payment.reference}
                              </span>
                            )}
                          </div>

                          {payment.notes && (
                            <p className="text-[12px] text-gray-400 mt-1.5 italic">{payment.notes}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {payment.status !== 'paid' && (
                              <DropdownMenuItem
                                onClick={() => handleMarkPaid(payment)}
                                className="text-[13px] gap-2 text-green-600 focus:text-green-600 focus:bg-green-50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Marquer payé
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setEditingPayment(payment)}
                              className="text-[13px] gap-2"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(payment)}
                              disabled={deletingId === payment.id}
                              className="text-[13px] gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingId === payment.id ? 'Suppression...' : 'Supprimer'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <PaymentForm
        open={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        onSaved={updated => { onUpdated(updated); setEditingPayment(null) }}
        existing={editingPayment}
      />
    </>
  )
}
