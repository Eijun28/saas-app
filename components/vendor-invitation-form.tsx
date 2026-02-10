'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Copy, Check, Mail, Link2, QrCode, Send, Loader2 } from 'lucide-react'

interface InvitationResult {
  id: string
  email: string
  invitationUrl: string
  emailSent: boolean
  channel: string
}

export default function VendorInvitationForm() {
  const [email, setEmail] = useState('')
  const [nomEntreprise, setNomEntreprise] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [message, setMessage] = useState('')
  const [channel, setChannel] = useState<'email' | 'link'>('email')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InvitationResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/vendor-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          nom_entreprise: nomEntreprise || undefined,
          prenom: prenom || undefined,
          nom: nom || undefined,
          message: message || undefined,
          channel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      setResult(data.invitation)

      if (channel === 'email' && data.invitation.emailSent) {
        toast.success(`Invitation envoyée par email à ${email}`)
      } else {
        toast.success('Lien d\'invitation créé')
      }

      // Reset form
      setEmail('')
      setNomEntreprise('')
      setPrenom('')
      setNom('')
      setMessage('')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création de l\'invitation')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (!result?.invitationUrl) return
    try {
      await navigator.clipboard.writeText(result.invitationUrl)
      setCopied(true)
      toast.success('Lien copié !')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

  const shareWhatsApp = () => {
    if (!result?.invitationUrl) return
    const text = encodeURIComponent(
      `Rejoignez Nuply pour développer votre activité de prestataire mariage : ${result.invitationUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inviter un prestataire</CardTitle>
          <CardDescription>
            Envoyez une invitation par email ou générez un lien à partager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Canal d'envoi */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={channel === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChannel('email')}
                className={channel === 'email' ? 'bg-[#823F91] hover:bg-[#6D3478]' : ''}
              >
                <Mail className="h-4 w-4 mr-1" />
                Par email
              </Button>
              <Button
                type="button"
                variant={channel === 'link' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChannel('link')}
                className={channel === 'link' ? 'bg-[#823F91] hover:bg-[#6D3478]' : ''}
              >
                <Link2 className="h-4 w-4 mr-1" />
                Générer un lien
              </Button>
            </div>

            {/* Email (toujours requis pour tracking) */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email du prestataire *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prestataire@exemple.com"
                required
              />
            </div>

            {/* Infos optionnelles pour pré-remplir */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Marie"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nomEntreprise">Nom de l'entreprise</Label>
              <Input
                id="nomEntreprise"
                value={nomEntreprise}
                onChange={(e) => setNomEntreprise(e.target.value)}
                placeholder="Studio Photo Express"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message personnel (optionnel)</Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Bonjour, nous aimerions vous inviter sur notre plateforme..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-none"
                maxLength={1000}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {channel === 'email' ? 'Envoyer l\'invitation' : 'Générer le lien'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Résultat : lien d'invitation */}
      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-green-800">
              {result.emailSent
                ? `Invitation envoyée à ${result.email}`
                : 'Lien d\'invitation créé'}
            </p>

            {/* Lien copiable */}
            <div className="flex gap-2">
              <Input
                value={result.invitationUrl}
                readOnly
                className="text-xs bg-white"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Actions de partage */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={shareWhatsApp}
              >
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQr(!showQr)}
              >
                <QrCode className="h-4 w-4 mr-1" />
                QR Code
              </Button>
            </div>

            {/* QR Code (via API Google Charts - pas de dépendance) */}
            {showQr && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.invitationUrl)}`}
                  alt="QR Code d'invitation"
                  width={200}
                  height={200}
                  className="rounded"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
