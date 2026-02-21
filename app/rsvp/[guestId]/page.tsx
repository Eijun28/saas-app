'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Check,
  X,
  HelpCircle,
  Calendar,
  MapPin,
  Loader2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type RsvpStatus = 'confirmed' | 'declined' | 'maybe'

interface GuestData {
  id: string
  first_name: string
  last_name: string
  rsvp_status: string
  couples: {
    partner_1_name: string
    partner_2_name: string
    wedding_date: string | null
    wedding_city: string | null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  })
}

const STATUS_CONFIG = {
  confirmed: {
    label:       'Je serai présent(e)',
    sublabel:    "J'ai hâte de fêter ça avec vous !",
    border:      'border-green-200',
    bg:          'bg-green-50',
    hover:       'hover:bg-green-100 hover:border-green-300',
    iconBg:      'bg-green-100 group-hover:bg-green-200',
    iconColor:   'text-green-600',
    Icon:        Check,
    doneTitle:   'Merci, à très bientôt !',
    doneBg:      'bg-green-100',
    doneIcon:    'text-green-600',
  },
  maybe: {
    label:       'Je ne suis pas encore sûr(e)',
    sublabel:    'Je confirme dès que possible',
    border:      'border-amber-200',
    bg:          'bg-amber-50',
    hover:       'hover:bg-amber-100 hover:border-amber-300',
    iconBg:      'bg-amber-100 group-hover:bg-amber-200',
    iconColor:   'text-amber-600',
    Icon:        HelpCircle,
    doneTitle:   'Pas de problème !',
    doneBg:      'bg-amber-100',
    doneIcon:    'text-amber-600',
  },
  declined: {
    label:       'Je ne pourrai pas être présent(e)',
    sublabel:    "Merci de l'invitation",
    border:      'border-red-100',
    bg:          'bg-red-50/50',
    hover:       'hover:bg-red-50 hover:border-red-200',
    iconBg:      'bg-red-100/60 group-hover:bg-red-100',
    iconColor:   'text-red-500',
    Icon:        X,
    doneTitle:   'Message bien reçu',
    doneBg:      'bg-red-100',
    doneIcon:    'text-red-500',
  },
} as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RsvpPage() {
  const params  = useParams()
  const guestId = params.guestId as string

  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [guest, setGuest]         = useState<GuestData | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [selected, setSelected]   = useState<RsvpStatus | null>(null)
  const [done, setDone]           = useState(false)

  useEffect(() => {
    if (!guestId) return
    fetch(`/api/rsvp/${guestId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setError(d.error)
        } else {
          setGuest(d.guest)
          // L'invité a déjà répondu → afficher sa réponse actuelle
          if (d.guest.rsvp_status !== 'pending') {
            setSelected(d.guest.rsvp_status as RsvpStatus)
            setDone(true)
          }
        }
      })
      .catch(() => setError('Erreur de connexion. Veuillez réessayer.'))
      .finally(() => setLoading(false))
  }, [guestId])

  async function handleRsvp(status: RsvpStatus) {
    if (submitting) return
    setSubmitting(true)
    setSelected(status)
    try {
      const res = await fetch(`/api/rsvp/${guestId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rsvp_status: status }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch {
      setError('Erreur lors de la mise à jour. Veuillez réessayer.')
      setSelected(null)
    } finally {
      setSubmitting(false)
    }
  }

  const couple     = guest?.couples
  const weddingDate = couple?.wedding_date ? formatDate(couple.wedding_date) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] mb-3 shadow-lg shadow-purple-200">
            <Heart className="h-7 w-7 text-white fill-white" />
          </div>
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Nuply · Invitation</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100/80 overflow-hidden">
          {/* Bande décorative */}
          <div className="h-1.5 bg-gradient-to-r from-[#823F91] via-[#B87FC0] to-[#D49FFD]" />

          <div className="p-8">
            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="h-8 w-8 text-[#823F91] animate-spin" />
                <p className="text-sm text-gray-400">Chargement de votre invitation...</p>
              </div>
            )}

            {/* Erreur */}
            {!loading && error && (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <X className="h-7 w-7 text-red-400" />
                </div>
                <p className="font-medium text-gray-700">{error}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Ce lien est peut-être invalide ou a expiré.
                </p>
              </div>
            )}

            {/* Contenu */}
            {!loading && !error && guest && (
              <AnimatePresence mode="wait">

                {/* Formulaire RSVP */}
                {!done && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      Bonjour {guest.first_name}&nbsp;!
                    </h1>
                    <p className="text-gray-500 text-sm mb-6">
                      Vous êtes cordialement invité(e) au mariage de
                    </p>

                    {/* Noms des mariés */}
                    <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 mb-6">
                      <p className="text-xl font-bold text-[#823F91]">
                        {couple?.partner_1_name} & {couple?.partner_2_name}
                      </p>
                      <div className="flex flex-col items-center gap-1.5 mt-3 text-sm text-gray-500">
                        {weddingDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#823F91]/60" />
                            <span className="capitalize">{weddingDate}</span>
                          </div>
                        )}
                        {couple?.wedding_city && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#823F91]/60" />
                            <span>{couple.wedding_city}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Boutons RSVP */}
                    <div className="border-t border-gray-100 pt-6">
                      <p className="text-sm font-semibold text-gray-700 text-center mb-4">
                        Serez-vous présent(e) ?
                      </p>
                      <div className="space-y-3">
                        {(['confirmed', 'maybe', 'declined'] as const).map(status => {
                          const cfg = STATUS_CONFIG[status]
                          return (
                            <button
                              key={status}
                              onClick={() => handleRsvp(status)}
                              disabled={submitting}
                              className={`
                                w-full flex items-center gap-3 p-4 rounded-2xl border-2
                                ${cfg.border} ${cfg.bg} ${cfg.hover}
                                transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed
                              `}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${cfg.iconBg}`}>
                                {submitting && selected === status
                                  ? <Loader2 className={`h-5 w-5 animate-spin ${cfg.iconColor}`} />
                                  : <cfg.Icon className={`h-5 w-5 ${cfg.iconColor}`} />
                                }
                              </div>
                              <div>
                                <p className={`font-semibold ${cfg.iconColor}`}>{cfg.label}</p>
                                <p className={`text-xs opacity-70 ${cfg.iconColor}`}>{cfg.sublabel}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Confirmation */}
                {done && selected && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, type: 'spring', bounce: 0.2 }}
                    className="text-center py-6"
                  >
                    {(() => {
                      const cfg = STATUS_CONFIG[selected]
                      return (
                        <>
                          <div className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center ${cfg.doneBg}`}>
                            <cfg.Icon className={`h-8 w-8 ${cfg.doneIcon}`} />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {cfg.doneTitle}
                          </h2>
                          <p className="text-gray-500 text-sm">
                            {selected === 'confirmed'
                              ? 'Votre présence est confirmée. Les mariés ont été informés !'
                              : selected === 'maybe'
                              ? 'Merci pour votre réponse. Vous pouvez la modifier à tout moment.'
                              : 'Merci pour votre réponse. Les mariés en ont été informés.'}
                          </p>
                          {selected === 'confirmed' && weddingDate && (
                            <p className="text-sm font-semibold text-[#823F91] mt-3">
                              Rendez-vous le {weddingDate} !
                            </p>
                          )}
                          <button
                            onClick={() => setDone(false)}
                            className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                          >
                            Modifier ma réponse
                          </button>
                        </>
                      )
                    })()}
                  </motion.div>
                )}

              </AnimatePresence>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Ce lien est personnel · Propulsé par Nuply
        </p>
      </div>
    </div>
  )
}
