'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface Subscriber {
  id: string
  email: string
  status: string
  subscribed_at: string
  unsubscribed_at: string | null
}

interface Stats {
  total: number
  active: number
  unsubscribed: number
}

export default function AdminNewsletterPage() {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; errors: number } | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, unsubscribed: 0 })
  const [loading, setLoading] = useState(true)

  const fetchSubscribers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/newsletter/subscribers')
      if (res.ok) {
        const data = await res.json()
        setSubscribers(data.subscribers)
        setStats(data.stats)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) return

    const confirmed = window.confirm(
      `Envoyer cette newsletter à ${stats.active} abonné(s) actif(s) ?`
    )
    if (!confirmed) return

    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ sent: data.stats.sent, errors: data.stats.errors })
        setSubject('')
        setContent('')
      } else {
        alert(data.error || 'Erreur lors de l\'envoi')
      }
    } catch {
      alert('Erreur réseau')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B0E12]">Newsletter</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Composez et envoyez votre newsletter aux abonnés
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Abonnés actifs</p>
            <p className="text-2xl font-bold text-[#823F91] mt-1">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Désinscrits</p>
            <p className="text-2xl font-bold text-[#9CA3AF] mt-1">{stats.unsubscribed}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-[#0B0E12] mt-1">{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Composer */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Composer une newsletter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-[#374151] mb-1.5">
              Sujet
            </label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Les tendances mariage 2026"
              disabled={sending}
              className="h-10"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-[#374151] mb-1.5">
              Contenu (HTML autorisé)
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<p>Bonjour,</p><p>Voici notre newsletter...</p>"
              rows={12}
              disabled={sending}
              className="font-mono text-sm"
            />
            <p className="text-[10px] text-[#9CA3AF] mt-1.5">
              Le contenu sera intégré dans le template email Nuply avec header, footer et lien de désinscription.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !content.trim()}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white h-10"
            >
              {sending ? 'Envoi en cours...' : `Envoyer à ${stats.active} abonné(s)`}
            </Button>

            {result && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {result.sent} envoyé(s)
                </Badge>
                {result.errors > 0 && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {result.errors} erreur(s)
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscribers list */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Abonnés</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#6B7280]">Chargement...</p>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#6B7280]">Aucun abonné pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2.5 text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Email</th>
                    <th className="text-left py-2.5 text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Statut</th>
                    <th className="text-left py-2.5 text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Inscrit le</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 text-sm text-[#0B0E12]">{sub.email}</td>
                      <td className="py-2.5">
                        <Badge
                          variant="outline"
                          className={
                            sub.status === 'active'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }
                        >
                          {sub.status === 'active' ? 'Actif' : 'Désinscrit'}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-xs text-[#9CA3AF]">
                        {new Date(sub.subscribed_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
