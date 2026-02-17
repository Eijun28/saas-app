'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  const roleBadge = (role: string) => {
    switch (role) {
      case 'couple':
        return <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">Couple</Badge>
      case 'prestataire':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Prestataire</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D0D0D]">Bypass confirmation email</h1>
        <p className="text-[#6B7280] mt-1">
          Generez un lien de connexion directe pour un utilisateur inscrit dont l&apos;email n&apos;est pas encore confirme.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generer un lien</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-1">
                Email de l&apos;utilisateur
              </label>
              <Input
                id="email"
                type="email"
                placeholder="utilisateur@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? 'Generation en cours...' : 'Generer le lien de bypass'}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-700">Lien genere avec succes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info utilisateur */}
            <div className="p-3 rounded-lg bg-gray-50 border space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{userInfo.prenom} {userInfo.nom}</span>
                {roleBadge(userInfo.role)}
              </div>
              <div className="text-xs text-[#6B7280]">
                {userInfo.email} — inscrit le {new Date(userInfo.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>

            {/* Lien */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">
                Lien de bypass (a envoyer a l&apos;utilisateur)
              </label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={bypassUrl}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  onClick={handleCopy}
                  variant="outline"
                  className="shrink-0"
                >
                  {copied ? 'Copie !' : 'Copier'}
                </Button>
              </div>
            </div>

            {/* Avertissement */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <strong>Attention :</strong> Ce lien est a usage unique. Quand l&apos;utilisateur cliquera dessus, son email sera automatiquement confirme et il sera connecte.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
