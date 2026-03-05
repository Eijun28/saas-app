'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface UserInfo {
  email: string
  prenom: string
  nom: string
  role: string
  createdAt: string
}

export default function BypassConfirmationPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bypassUrl, setBypassUrl] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setBypassUrl(null)
    setUserInfo(null)
    setCopied(false)

    try {
      const res = await fetch('/api/admin/bypass-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur inconnue')
        return
      }

      setBypassUrl(data.bypassUrl)
      setUserInfo(data.userInfo)
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!bypassUrl) return
    await navigator.clipboard.writeText(bypassUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B0E12]">Bypass confirmation email</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Générez un lien de connexion directe pour un utilisateur dont l&apos;email n&apos;est pas encore confirmé.
        </p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-1.5">
                Email de l&apos;utilisateur
              </label>
              <Input
                id="email"
                type="email"
                placeholder="utilisateur@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white h-10"
            >
              {loading ? 'Génération en cours...' : 'Générer le lien de bypass'}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {bypassUrl && userInfo && (
        <Card className="border-green-200 shadow-sm bg-green-50/30">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-700">Lien généré avec succès</span>
            </div>

            <div className="p-3 rounded-lg bg-white border border-gray-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[#0B0E12]">
                  {userInfo.prenom} {userInfo.nom}
                </span>
                <Badge
                  variant="outline"
                  className={
                    userInfo.role === 'couple'
                      ? 'bg-pink-50 text-pink-700 border-pink-200'
                      : 'bg-[#F5F0F7] text-[#6D3478] border-[#D4ADE0]'
                  }
                >
                  {userInfo.role === 'couple' ? 'Couple' : 'Prestataire'}
                </Badge>
              </div>
              <p className="text-xs text-[#6B7280]">
                {userInfo.email} — inscrit le {new Date(userInfo.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Lien de bypass
              </label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={bypassUrl}
                  className="font-mono text-xs h-10 bg-white"
                />
                <Button
                  type="button"
                  onClick={handleCopy}
                  variant="outline"
                  className="shrink-0 h-10"
                >
                  {copied ? 'Copié !' : 'Copier'}
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <strong>Attention :</strong> Ce lien est à usage unique. Quand l&apos;utilisateur cliquera dessus, son email sera automatiquement confirmé et il sera connecté.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
