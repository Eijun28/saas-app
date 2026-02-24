'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Share2, Copy, Check, Trash2, QrCode, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QRCodeSVG } from 'qrcode.react'

interface ProgramShareDialogProps {
  open: boolean
  onClose: () => void
}

export function ProgramShareDialog({ open, onClose }: ProgramShareDialogProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)

  // Generate (or retrieve) share link when dialog opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/wedding-day-program/share', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.url) setShareUrl(data.url)
        else toast.error(data.error ?? 'Erreur lors de la génération du lien')
      })
      .catch(() => toast.error('Erreur réseau'))
      .finally(() => setLoading(false))
  }, [open])

  async function handleCopy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Lien copié dans le presse-papiers')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

  async function handleRevoke() {
    if (!confirm('Révoquer le lien de partage ? Les personnes qui ont ce lien ne pourront plus y accéder.')) return
    setRevoking(true)
    try {
      const res = await fetch('/api/wedding-day-program/share', { method: 'DELETE' })
      if (res.ok) {
        setShareUrl(null)
        toast.success('Lien de partage révoqué')
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Erreur lors de la révocation')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#823F91]" />
            Partager le programme
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-sm text-gray-500">
          Partagez ce lien avec vos prestataires ou témoins pour qu'ils puissent consulter votre programme en lecture seule.
        </DialogDescription>

        <div className="space-y-4">

          {loading ? (
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
          ) : shareUrl ? (
            <>
              {/* URL display */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-700 truncate font-mono">{shareUrl}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCopy}
                  className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white rounded-xl gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copié !' : 'Copier le lien'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowQr(p => !p)}
                  className="h-10 w-10 rounded-xl"
                  title="Afficher le QR code"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>

              {/* QR Code */}
              {showQr && (
                <div className="flex flex-col items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl">
                  <QRCodeSVG
                    value={shareUrl}
                    size={180}
                    level="M"
                    includeMargin
                    fgColor="#823F91"
                  />
                  <p className="text-xs text-gray-400">Scannez pour accéder au programme</p>
                </div>
              )}

              {/* Revoke */}
              <div className="pt-2 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 rounded-xl text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {revoking ? 'Révocation…' : 'Révoquer le lien de partage'}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-500">Impossible de générer le lien.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
