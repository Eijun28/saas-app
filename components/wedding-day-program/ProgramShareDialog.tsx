'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Share2, Copy, Check, Trash2, QrCode, ExternalLink, Send, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'

interface LinkedProvider {
  id: string
  nom_entreprise: string
  avatar_url: string | null
  conversationId: string | null
}

interface ProgramShareDialogProps {
  open: boolean
  onClose: () => void
}

export function ProgramShareDialog({ open, onClose }: ProgramShareDialogProps) {
  const { user } = useUser()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [providers, setProviders] = useState<LinkedProvider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [sendingTo, setSendingTo] = useState<Set<string>>(new Set())
  const [sentTo, setSentTo] = useState<Set<string>>(new Set())

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

  // Fetch linked providers (accepted requests)
  useEffect(() => {
    if (!open || !user) return
    setLoadingProviders(true)

    const supabase = createClient()

    async function fetchProviders() {
      // Get couple id
      const { data: couple } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user!.id)
        .single()

      if (!couple) { setLoadingProviders(false); return }

      // Get accepted requests with provider info
      const { data: requests } = await supabase
        .from('requests')
        .select('provider_id')
        .eq('couple_id', couple.id)
        .eq('status', 'accepted')

      if (!requests || requests.length === 0) { setLoadingProviders(false); return }

      const providerIds = requests.map(r => r.provider_id)

      // Get provider profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nom_entreprise, avatar_url')
        .in('id', providerIds)

      // Get conversations for each provider
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, provider_id')
        .eq('couple_id', couple.id)
        .in('provider_id', providerIds)

      const convMap = new Map(conversations?.map(c => [c.provider_id, c.id]) ?? [])

      setProviders(
        (profiles ?? []).map(p => ({
          id: p.id,
          nom_entreprise: p.nom_entreprise ?? 'Prestataire',
          avatar_url: p.avatar_url,
          conversationId: convMap.get(p.id) ?? null,
        }))
      )
      setLoadingProviders(false)
    }

    fetchProviders()
  }, [open, user])

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

  async function handleSendToProvider(provider: LinkedProvider) {
    if (!shareUrl || !provider.conversationId) return

    setSendingTo(prev => new Set(prev).add(provider.id))
    try {
      const supabase = createClient()
      const message = `Voici le programme de notre Jour J : ${shareUrl}`

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: provider.conversationId,
          sender_id: user!.id,
          content: message,
        })

      if (error) throw error

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', provider.conversationId)

      setSentTo(prev => new Set(prev).add(provider.id))
      toast.success(`Lien envoyé à ${provider.nom_entreprise}`)
    } catch {
      toast.error(`Erreur lors de l'envoi à ${provider.nom_entreprise}`)
    } finally {
      setSendingTo(prev => {
        const next = new Set(prev)
        next.delete(provider.id)
        return next
      })
    }
  }

  async function handleSendToAll() {
    if (!shareUrl) return
    const toSend = providers.filter(p => p.conversationId && !sentTo.has(p.id))
    for (const provider of toSend) {
      await handleSendToProvider(provider)
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

  const sendableProviders = providers.filter(p => p.conversationId)
  const allSent = sendableProviders.length > 0 && sendableProviders.every(p => sentTo.has(p.id))

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#823F91]" />
            Partager le programme
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Partagez ce lien avec vos prestataires ou témoins pour qu&apos;ils puissent consulter votre programme en lecture seule.
          </p>

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

              {/* Send to providers */}
              {loadingProviders ? (
                <div className="flex items-center gap-2 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-400">Chargement des prestataires…</span>
                </div>
              ) : providers.length > 0 ? (
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Envoyer aux prestataires</p>
                    {sendableProviders.length > 1 && !allSent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSendToAll}
                        className="text-[#823F91] hover:bg-[#823F91]/10 gap-1.5 text-xs rounded-lg"
                      >
                        <Send className="h-3 w-3" />
                        Envoyer à tous
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {providers.map(provider => (
                      <div
                        key={provider.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="h-8 w-8 rounded-full bg-[#823F91]/10 flex items-center justify-center flex-shrink-0">
                          {provider.avatar_url ? (
                            <img
                              src={provider.avatar_url}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-[#823F91]" />
                          )}
                        </div>
                        <span className="flex-1 text-sm text-gray-700 truncate">
                          {provider.nom_entreprise}
                        </span>
                        {sentTo.has(provider.id) ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Envoyé
                          </span>
                        ) : provider.conversationId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendToProvider(provider)}
                            disabled={sendingTo.has(provider.id)}
                            className="h-7 text-xs text-[#823F91] hover:bg-[#823F91]/10 gap-1 rounded-lg"
                          >
                            {sendingTo.has(provider.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Envoyer
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">Pas de conversation</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

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
