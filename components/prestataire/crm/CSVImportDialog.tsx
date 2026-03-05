'use client'

import { useState, useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CSVImportDialogProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

export function CSVImportDialog({ open, onClose, onImported }: CSVImportDialogProps) {
  const [csvText, setCsvText] = useState('')
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; total: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setCsvText(text || '')
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!csvText.trim()) {
      toast.error('Aucun fichier selectionne')
      return
    }

    setImporting(true)
    setResult(null)
    try {
      const res = await fetch('/api/prestataire/crm-contacts/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Erreur import')
        return
      }
      setResult({ imported: json.imported, total: json.total })
      toast.success(`${json.imported} contact(s) importe(s)`)
      onImported()
    } catch {
      toast.error('Erreur reseau')
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setCsvText('')
    setFileName('')
    setResult(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && handleClose()}>
      <DialogContent size="default">
        <DialogHeader>
          <DialogTitle>Importer des contacts (CSV)</DialogTitle>
          <DialogDescription>
            Importez vos contacts depuis un fichier CSV. Colonnes reconnues : prenom, nom, email, telephone, date_mariage, lieu, budget, notes, statut, tags
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File upload area */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#823F91]/40 hover:bg-[#823F91]/[0.02] transition-colors"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileName ? (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <FileText className="h-5 w-5 text-[#823F91]" />
                <span className="font-medium">{fileName}</span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Cliquez pour choisir un fichier CSV</p>
                <p className="text-xs text-gray-400 mt-1">Separateur : virgule ou point-virgule</p>
              </>
            )}
          </div>

          {/* Preview */}
          {csvText && !result && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Apercu :</p>
              <pre className="text-[11px] text-gray-600 whitespace-pre-wrap overflow-hidden max-h-24 font-mono">
                {csvText.split('\n').slice(0, 4).join('\n')}
                {csvText.split('\n').length > 4 && '\n...'}
              </pre>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">{result.imported} contact(s) importe(s)</p>
                <p className="text-xs text-emerald-600">sur {result.total} ligne(s) dans le fichier</p>
              </div>
            </div>
          )}

          {/* Example format */}
          <details className="text-xs text-gray-400">
            <summary className="cursor-pointer hover:text-gray-600">Exemple de format CSV</summary>
            <pre className="mt-2 bg-gray-50 rounded-lg p-3 font-mono text-[11px] overflow-x-auto">
              {`prenom;nom;email;telephone;lieu;budget;statut
Marie;Dupont;marie@mail.com;0612345678;Paris;5000;lead
Jean;Martin;jean@mail.com;0698765432;Lyon;3000;contacted`}
            </pre>
          </details>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose} className="h-9">
            {result ? 'Fermer' : 'Annuler'}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!csvText || importing}
              className="h-9 bg-[#823F91] hover:bg-[#6D3478]"
            >
              {importing ? 'Import...' : 'Importer'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
