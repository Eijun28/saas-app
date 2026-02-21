'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload, X, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CouplePayment, PaymentCategory, PaymentMethod } from '@/types/couple-payments'
import { CATEGORY_LABELS } from '@/types/couple-payments'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CsvRow {
  provider_name: string
  label: string
  category: PaymentCategory
  amount_total: number
  amount_paid: number
  due_date: string | null
  method: PaymentMethod
  _error?: string
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

const VALID_CATEGORIES = Object.keys(CATEGORY_LABELS) as PaymentCategory[]
const VALID_METHODS: PaymentMethod[] = ['virement', 'cheque', 'carte', 'especes', 'autre']
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function parseCSV(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return []

  // Skip header if present
  const firstLine = lines[0].toLowerCase()
  const isHeader = firstLine.includes('prestataire') || firstLine.includes('libelle') || firstLine.includes('montant')
  const dataLines = isHeader ? lines.slice(1) : lines

  return dataLines.map((line, i) => {
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
    // Expected: prestataire,libelle,categorie,montant_total,montant_paye,echeance,mode
    const [rawProvider, rawLabel, rawCategory, rawTotal, rawPaid, rawDate, rawMode] = parts

    const errors: string[] = []

    const provider_name = rawProvider ?? ''
    if (!provider_name) errors.push('prestataire manquant')

    const label = rawLabel ?? ''
    if (!label) errors.push('libellé manquant')

    const category: PaymentCategory = VALID_CATEGORIES.includes(rawCategory as PaymentCategory)
      ? (rawCategory as PaymentCategory)
      : 'autre'

    const amount_total = parseFloat(rawTotal?.replace(',', '.') ?? '')
    if (isNaN(amount_total) || amount_total < 0) errors.push('montant_total invalide')

    const amount_paid = rawPaid ? parseFloat(rawPaid.replace(',', '.')) : 0
    if (isNaN(amount_paid) || amount_paid < 0) errors.push('montant_paye invalide')

    const due_date = rawDate && DATE_REGEX.test(rawDate) ? rawDate : null
    if (rawDate && !DATE_REGEX.test(rawDate)) errors.push('date invalide (attendu YYYY-MM-DD)')

    const method: PaymentMethod = VALID_METHODS.includes(rawMode as PaymentMethod)
      ? (rawMode as PaymentMethod)
      : 'autre'

    return {
      provider_name,
      label,
      category,
      amount_total: isNaN(amount_total) ? 0 : amount_total,
      amount_paid: isNaN(amount_paid) ? 0 : amount_paid,
      due_date,
      method,
      _error: errors.length > 0 ? `Ligne ${i + 1} : ${errors.join(', ')}` : undefined,
    }
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PaymentCsvImportProps {
  open: boolean
  onClose: () => void
  onImported: (payments: CouplePayment[]) => void
}

export function PaymentCsvImport({ open, onClose, onImported }: PaymentCsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)

  const validRows = rows.filter(r => !r._error)
  const errorRows = rows.filter(r => r._error)

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Veuillez sélectionner un fichier CSV')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setRows(parseCSV(text))
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function reset() {
    setRows([])
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleImport() {
    if (validRows.length === 0) return
    setImporting(true)
    try {
      const res = await fetch('/api/couple-payments/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de l\'import')
        return
      }
      const serverErrors: string[] = data.errors ?? []
      const imported: number = data.imported ?? 0
      if (imported > 0) {
        toast.success(
          `${imported} paiement${imported > 1 ? 's' : ''} importé${imported > 1 ? 's' : ''}` +
          (serverErrors.length > 0 ? `, ${serverErrors.length} erreur${serverErrors.length > 1 ? 's' : ''}` : '')
        )
        // Reload full list
        const listRes = await fetch('/api/couple-payments')
        if (listRes.ok) {
          const listData = await listRes.json()
          onImported(listData.payments ?? [])
        }
      } else {
        toast.error('Aucun paiement importé' + (serverErrors.length > 0 ? ` — ${serverErrors.length} erreur(s)` : ''))
      }
      onClose()
      reset()
    } catch {
      toast.error('Erreur lors de l\'import')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset() } }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des paiements (CSV)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format hint */}
          <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 font-mono">
            prestataire,libelle,categorie,montant_total,montant_paye,echeance,mode
          </div>

          {/* Drop zone */}
          {!fileName ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                dragging ? 'border-[#823F91] bg-purple-50' : 'border-gray-200 hover:border-[#823F91]/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              <Upload className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Glissez votre fichier CSV ici</p>
              <p className="text-xs text-gray-400 mt-1">ou cliquez pour parcourir</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <FileText className="h-5 w-5 text-[#823F91] flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 flex-1 truncate">{fileName}</span>
              <button onClick={reset} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <div className="space-y-2">
              {/* Summary */}
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-green-700 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {validRows.length} valide{validRows.length > 1 ? 's' : ''}
                </span>
                {errorRows.length > 0 && (
                  <span className="flex items-center gap-1 text-red-600 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errorRows.length} erreur{errorRows.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Table preview */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-semibold text-gray-600">Prestataire</th>
                      <th className="text-left p-2 font-semibold text-gray-600">Libellé</th>
                      <th className="text-right p-2 font-semibold text-gray-600">Total</th>
                      <th className="text-right p-2 font-semibold text-gray-600">Payé</th>
                      <th className="text-left p-2 font-semibold text-gray-600">Échéance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={`border-t border-gray-50 ${row._error ? 'bg-red-50' : ''}`}>
                        <td className="p-2 text-gray-900 max-w-[120px] truncate">
                          {row._error ? (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{row._error}</span>
                            </span>
                          ) : row.provider_name}
                        </td>
                        <td className="p-2 text-gray-600 max-w-[100px] truncate">{!row._error && row.label}</td>
                        <td className="p-2 text-right text-gray-900">{!row._error && `${row.amount_total}€`}</td>
                        <td className="p-2 text-right text-gray-500">{!row._error && `${row.amount_paid}€`}</td>
                        <td className="p-2 text-gray-500">{!row._error && (row.due_date ?? '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { onClose(); reset() }} className="rounded-xl">
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={validRows.length === 0 || importing}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white rounded-xl"
            >
              {importing ? 'Import en cours…' : `Importer ${validRows.length} paiement${validRows.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
