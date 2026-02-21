'use client'

/**
 * GoogleCalendarSync.tsx
 *
 * Composant UI pour connecter / synchroniser Google Calendar.
 * Utilisé dans la page agenda prestataire (et potentiellement couple).
 *
 * Flow UX :
 * 1. Bouton "Connecter Google Calendar"
 *    → récupère session.provider_token (si login Google) ou affiche message
 *    → POST /api/google-calendar/connect → sauvegarde token
 * 2. Une fois connecté :
 *    → bouton "Synchroniser maintenant"
 *    → POST /api/google-calendar/sync { direction: 'both' }
 *    → affiche résultats (N events pushés, M dates importées)
 * 3. Bouton "Déconnecter"
 *    → DELETE /api/google-calendar → supprime tokens
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Unlink, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncStatus {
  connected:   boolean
  last_sync:   string | null
  calendar_id: string
}

interface SyncResult {
  pushed: number
  pulled: number
  errors: string[]
  last_sync: string
}

interface GoogleCalendarSyncProps {
  /** 'prestataire' affiche push + pull / 'couple' affiche seulement push */
  role?: 'prestataire' | 'couple'
  /** Callback après sync réussie (ex: recharger les events) */
  onSyncComplete?: (result: SyncResult) => void
  /** Classes CSS supplémentaires */
  className?: string
  /** Compact = juste le bouton de sync sans la carte */
  compact?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GoogleCalendarSync({
  role = 'prestataire',
  onSyncComplete,
  className,
  compact = false,
}: GoogleCalendarSyncProps) {
  const [status,      setStatus]      = useState<SyncStatus | null>(null)
  const [isLoading,   setIsLoading]   = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing,   setIsSyncing]   = useState(false)
  const [lastResult,  setLastResult]  = useState<SyncResult | null>(null)

  // ── Charger le statut actuel ──────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/google-calendar')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (err) {
      console.error('[GoogleCalendarSync] Erreur chargement statut:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  // ── Connexion ─────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const providerToken        = session?.provider_token
      const providerRefreshToken = session?.provider_refresh_token

      if (!providerToken) {
        toast.error(
          'Vous devez être connecté avec Google pour utiliser cette fonctionnalité. Déconnectez-vous et reconnectez-vous avec Google.',
          { duration: 6000 },
        )
        setIsConnecting(false)
        return
      }

      const res = await fetch('/api/google-calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_token:         providerToken,
          provider_refresh_token: providerRefreshToken,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la connexion')
        return
      }

      toast.success('Google Calendar connecté avec succès !')
      await loadStatus()
    } catch (err) {
      toast.error('Erreur lors de la connexion à Google Calendar')
      console.error(err)
    } finally {
      setIsConnecting(false)
    }
  }

  // ── Synchronisation ───────────────────────────────────────────────────────
  const handleSync = async (direction: 'push' | 'pull' | 'both' = 'both') => {
    setIsSyncing(true)
    setLastResult(null)
    try {
      const res = await fetch('/api/google-calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, months_ahead: 12 }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la synchronisation')
        return
      }

      setLastResult(data)

      // Message de résultat
      const parts = []
      if (data.pushed > 0) parts.push(`${data.pushed} événement${data.pushed > 1 ? 's' : ''} exporté${data.pushed > 1 ? 's' : ''}`)
      if (data.pulled > 0) parts.push(`${data.pulled} date${data.pulled > 1 ? 's' : ''} importée${data.pulled > 1 ? 's' : ''}`)
      if (parts.length === 0) parts.push('Tout est à jour')

      const errCount = data.errors?.length ?? 0
      if (errCount > 0) {
        toast.warning(`Synchronisation : ${parts.join(', ')} (${errCount} erreur${errCount > 1 ? 's' : ''})`)
      } else {
        toast.success(`Synchronisation : ${parts.join(', ')}`)
      }

      await loadStatus()
      onSyncComplete?.(data)
    } catch (err) {
      toast.error('Erreur lors de la synchronisation')
      console.error(err)
    } finally {
      setIsSyncing(false)
    }
  }

  // ── Déconnexion ───────────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/google-calendar', { method: 'DELETE' })
      if (res.ok) {
        toast.success('Google Calendar déconnecté')
        setStatus(prev => prev ? { ...prev, connected: false } : null)
        setLastResult(null)
      } else {
        toast.error('Erreur lors de la déconnexion')
      }
    } catch {
      toast.error('Erreur lors de la déconnexion')
    }
  }

  // ── Format date ───────────────────────────────────────────────────────────
  const formatLastSync = (isoDate: string | null) => {
    if (!isoDate) return 'Jamais synchronisé'
    const d = new Date(isoDate)
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diffMin < 1)  return 'À l\'instant'
    if (diffMin < 60) return `Il y a ${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24)   return `Il y a ${diffH}h`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) return null

  // ── Mode compact : juste le bouton sync ──────────────────────────────────
  if (compact) {
    if (!status?.connected) return null
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleSync('both')}
        disabled={isSyncing}
        className={cn('gap-2 text-xs', className)}
      >
        <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
        {isSyncing ? 'Sync...' : 'Sync Google'}
      </Button>
    )
  }

  // ── Mode carte complète ───────────────────────────────────────────────────
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-4 sm:p-5', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
          {/* Logo Google Calendar simplifié */}
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="#4285F4" />
            <rect x="3" y="3" width="18" height="7" rx="2" fill="#1A73E8" />
            <text x="12" y="17" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">31</text>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">Google Calendar</h3>
            {status?.connected && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Connecté
              </span>
            )}
          </div>
          {status?.connected && status.last_sync && (
            <p className="text-xs text-gray-500 mt-0.5">
              Dernière sync : {formatLastSync(status.last_sync)}
            </p>
          )}
        </div>
      </div>

      {/* Explication contextuelle */}
      {!status?.connected && (
        <div className="mb-4 text-xs text-gray-500 space-y-1">
          {role === 'prestataire' ? (
            <>
              <p>• Vos événements agenda sont exportés vers Google Calendar</p>
              <p>• Vos rendez-vous Google sont importés comme <strong>dates indisponibles</strong></p>
              <p>• Les couples ne vous verront pas proposé sur vos dates occupées</p>
            </>
          ) : (
            <>
              <p>• Vos jalons de planification sont exportés vers Google Calendar</p>
              <p>• Retrouvez vos événements de mariage dans votre agenda habituel</p>
            </>
          )}
        </div>
      )}

      {/* État connecté : résultat dernière sync */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs space-y-1">
              {lastResult.pushed > 0 && (
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {lastResult.pushed} événement{lastResult.pushed > 1 ? 's' : ''} exporté{lastResult.pushed > 1 ? 's' : ''} vers Google
                </div>
              )}
              {lastResult.pulled > 0 && (
                <div className="flex items-center gap-2 text-purple-700">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {lastResult.pulled} date{lastResult.pulled > 1 ? 's' : ''} importée{lastResult.pulled > 1 ? 's' : ''} comme indisponible{lastResult.pulled > 1 ? 's' : ''}
                </div>
              )}
              {lastResult.pushed === 0 && lastResult.pulled === 0 && (
                <div className="text-gray-500">Tout est à jour — aucune modification</div>
              )}
              {lastResult.errors?.length > 0 && (
                <div className="flex items-start gap-2 text-amber-700 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{lastResult.errors.length} erreur{lastResult.errors.length > 1 ? 's' : ''} (voir console)</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {!status?.connected ? (
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white gap-2 h-9 text-sm touch-manipulation"
        >
          <Calendar className="w-4 h-4" />
          {isConnecting ? 'Connexion...' : 'Connecter Google Calendar'}
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Boutons de sync */}
          <div className={cn('grid gap-2', role === 'prestataire' ? 'grid-cols-2' : 'grid-cols-1')}>
            {role === 'prestataire' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync('push')}
                  disabled={isSyncing}
                  className="gap-1.5 text-xs touch-manipulation"
                  title="Exporter vos événements vers Google Calendar"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
                  Exporter agenda
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync('pull')}
                  disabled={isSyncing}
                  className="gap-1.5 text-xs touch-manipulation"
                  title="Importer vos rendez-vous Google comme dates indisponibles"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
                  Importer Google
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={() => handleSync(role === 'couple' ? 'push' : 'both')}
              disabled={isSyncing}
              className={cn(
                'gap-1.5 text-xs touch-manipulation bg-[#823F91] hover:bg-[#6D3478] text-white',
                role === 'prestataire' && 'col-span-2',
              )}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
              {isSyncing ? 'Synchronisation...' : 'Tout synchroniser'}
            </Button>
          </div>

          {/* Déconnecter */}
          <button
            onClick={handleDisconnect}
            className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors py-1 touch-manipulation"
          >
            <Unlink className="w-3 h-3" />
            Déconnecter Google Calendar
          </button>
        </div>
      )}

      {/* Lien docs */}
      {!status?.connected && (
        <p className="mt-3 text-center">
          <a
            href="https://support.google.com/calendar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Comment ça marche ?
          </a>
        </p>
      )}
    </div>
  )
}
