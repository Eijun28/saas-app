'use client'

// components/devis/SignatureModal.tsx
// Modal de signature électronique d'un devis par OTP email

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CheckCircle, FileText, Loader2, Mail, ShieldCheck, PenLine } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SignatureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  devisId: string
  devisTitle: string
  devisAmount: number
  prestataireName: string
  onSigned: () => void
}

type Step = 'consent' | 'otp' | 'success'

export function SignatureModal({
  open,
  onOpenChange,
  devisId,
  devisTitle,
  devisAmount,
  prestataireName,
  onSigned,
}: SignatureModalProps) {
  const [step, setStep] = useState<Step>('consent')
  const [agreed, setAgreed] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState(3)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setStep('consent')
      setAgreed(false)
      setOtp(['', '', '', '', '', ''])
      setAttemptsRemaining(3)
      setExpiresAt(null)
    }
  }, [open])

  const amountFormatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(devisAmount)

  async function sendOtp() {
    setLoading(true)
    try {
      const res = await fetch(`/api/devis/${devisId}/sign`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de l\'envoi du code')
        return
      }

      setExpiresAt(new Date(data.expiresAt))
      setStep('otp')
      toast.success('Code envoyé par email !')
      // Focus sur le premier champ
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch {
      toast.error('Erreur réseau, veuillez réessayer')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    const code = otp.join('')
    if (code.length !== 6) {
      toast.error('Entrez les 6 chiffres du code')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/devis/${devisId}/verify-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Code incorrect')
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining)
        }
        // Vider les champs et redonner le focus au premier
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
        return
      }

      setStep('success')
      onSigned()
    } catch {
      toast.error('Erreur réseau, veuillez réessayer')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(index: number, value: string) {
    // Accepter uniquement les chiffres
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]

    if (value.length > 1) {
      // Coller plusieurs chiffres d'un coup (ex: copier-coller)
      const digits = value.slice(0, 6 - index).split('')
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d
      })
      setOtp(newOtp)
      const nextFocus = Math.min(index + digits.length, 5)
      inputRefs.current[nextFocus]?.focus()
      return
    }

    newOtp[index] = value
    setOtp(newOtp)

    // Avancer automatiquement au champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0B0E12]">
            <PenLine className="h-5 w-5 text-[#823F91]" />
            Signer le devis
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ÉTAPE 1 — Résumé et consentement */}
          {step === 'consent' && (
            <motion.div
              key="consent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Résumé du devis */}
              <div className="rounded-xl border border-[#823F91]/20 bg-[#823F91]/[0.03] p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-[#823F91] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{devisTitle}</p>
                    <p className="text-xs text-gray-500">De {prestataireName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#823F91]/10">
                  <span className="text-xs text-gray-500">Montant total HT</span>
                  <span className="text-lg font-bold text-[#823F91]">{amountFormatted}</span>
                </div>
              </div>

              {/* Explication du processus */}
              <div className="flex gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Un code à 6 chiffres vous sera envoyé par email. Saisissez-le pour confirmer votre
                  accord électronique.
                </p>
              </div>

              {/* Case à cocher consentement */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                      agreed
                        ? 'bg-[#823F91] border-[#823F91]'
                        : 'border-gray-300 group-hover:border-[#823F91]/50'
                    )}
                  >
                    {agreed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700 leading-snug">
                  J&apos;accepte les termes de ce devis et je reconnais que ma signature électronique a
                  la même valeur juridique qu&apos;une signature manuscrite.
                </span>
              </label>

              <Button
                className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white"
                disabled={!agreed || loading}
                onClick={sendOtp}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi du code...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Recevoir le code par email
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* ÉTAPE 2 — Saisie OTP */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-gray-900">Code envoyé par email</p>
                <p className="text-xs text-gray-500">
                  Entrez le code à 6 chiffres reçu dans votre boîte mail
                  {expiresAt && (
                    <span className="block text-amber-600 mt-1">
                      Valable jusqu&apos;à {expiresAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </p>
              </div>

              {/* Champs OTP */}
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={cn(
                      'w-11 h-14 text-center text-xl font-bold rounded-lg border-2 transition-colors outline-none',
                      'focus:border-[#823F91] focus:ring-2 focus:ring-[#823F91]/20',
                      digit ? 'border-[#823F91] bg-[#823F91]/[0.04]' : 'border-gray-200'
                    )}
                  />
                ))}
              </div>

              {attemptsRemaining < 3 && (
                <p className="text-xs text-red-600 text-center">
                  {attemptsRemaining} tentative{attemptsRemaining > 1 ? 's' : ''} restante{attemptsRemaining > 1 ? 's' : ''}
                </p>
              )}

              <Button
                className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white"
                disabled={otp.join('').length !== 6 || loading}
                onClick={verifyOtp}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Confirmer ma signature
                  </>
                )}
              </Button>

              <button
                className="w-full text-xs text-gray-500 hover:text-[#823F91] transition-colors"
                onClick={sendOtp}
                disabled={loading}
              >
                Renvoyer le code
              </button>
            </motion.div>
          )}

          {/* ÉTAPE 3 — Succès */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-9 w-9 text-green-600" />
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-gray-900">Devis signé !</h3>
                <p className="text-sm text-gray-500">
                  Votre accord a été enregistré électroniquement.
                </p>
              </div>

              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-left space-y-1">
                <p className="text-xs font-medium text-green-800">Ce qu&apos;il se passe maintenant :</p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• {prestataireName} reçoit une notification par email</li>
                  <li>• Le PDF signé est disponible dans vos échanges</li>
                  <li>• Vous pouvez discuter des prochaines étapes en messagerie</li>
                </ul>
              </div>

              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                ✓ Signature électronique conforme à l&apos;art. 1366 du Code civil
              </Badge>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Fermer
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
