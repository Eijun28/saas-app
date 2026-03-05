'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Newsletter</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-[#823F91]">{stats.active}</p>
          <p className="text-sm text-gray-500">Abonnés actifs</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-400">{stats.unsubscribed}</p>
          <p className="text-sm text-gray-500">Désinscrits</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-700">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
      </div>

      {/* Composer */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Composer une newsletter</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Sujet
            </label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Les tendances mariage 2026"
              disabled={sending}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
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
            <p className="text-xs text-gray-400 mt-1">
              Le contenu sera automatiquement intégré dans le template email Nuply avec header, footer et lien de désinscription.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !content.trim()}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white"
            >
              {sending ? 'Envoi en cours...' : `Envoyer à ${stats.active} abonné(s)`}
            </Button>

            {result && (
              <p className="text-sm">
                <span className="text-green-600 font-medium">{result.sent} envoyé(s)</span>
                {result.errors > 0 && (
                  <span className="text-red-500 ml-2">{result.errors} erreur(s)</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Liste abonnés */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Abonnés</h2>

        {loading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : subscribers.length === 0 ? (
          <p className="text-gray-500">Aucun abonné pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-700">Email</th>
                  <th className="text-left py-2 font-medium text-gray-700">Statut</th>
                  <th className="text-left py-2 font-medium text-gray-700">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100">
                    <td className="py-2">{sub.email}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sub.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {sub.status === 'active' ? 'Actif' : 'Désinscrit'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(sub.subscribed_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
