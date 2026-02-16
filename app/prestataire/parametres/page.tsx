'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  Bell,
  Shield,
  Trash2,
  Download,
  Mail,
  MessageSquare,
  Calendar,
  Newspaper,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { toast } from 'sonner'

// ─── Password schema ───────────────────────────────────────
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Veuillez entrer votre mot de passe actuel'),
  newPassword: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Le nouveau mot de passe doit être différent de l\'actuel',
  path: ['newPassword'],
})

type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// ─── Notification preferences ───────────────────────────────
interface NotificationPrefs {
  newRequests: boolean
  messages: boolean
  calendarReminders: boolean
  newsletter: boolean
}

// ─── Section header ─────────────────────────────────────────
function SectionHeader({ icon: Icon, title, description }: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="p-2 rounded-xl bg-[#823F91]/10 mt-0.5">
        <Icon className="h-5 w-5 text-[#823F91]" />
      </div>
      <div>
        <h3 className="font-semibold text-base sm:text-lg text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────
export default function ParametresPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    newRequests: true,
    messages: true,
    calendarReminders: true,
    newsletter: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  const newPassword = watch('newPassword', '')

  // Fetch user email on mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user?.email) {
        setUserEmail(data.user.email)
      }
    }
    fetchUser()
  }, [])

  // ─── Password submit ─────────────────────────────────────
  const onSubmitPassword = async (data: ChangePasswordInput) => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.email) {
        toast.error('Impossible de récupérer votre email. Veuillez vous reconnecter.')
        setIsLoading(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: data.currentPassword,
      })

      if (signInError) {
        toast.error('Le mot de passe actuel est incorrect.')
        setIsLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      })

      if (updateError) {
        toast.error('Erreur lors de la modification du mot de passe. Veuillez réessayer.')
        setIsLoading(false)
        return
      }

      toast.success('Mot de passe modifié avec succès !')
      reset()
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Notification toggle ──────────────────────────────────
  const handleNotifToggle = (key: keyof NotificationPrefs) => {
    setNotifPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      toast.success('Préférences de notification mises à jour')
      return updated
    })
  }

  // ─── Delete account ───────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return

    setIsDeletingAccount(true)
    try {
      toast.error('La suppression de compte sera bientôt disponible. Contactez le support pour toute demande.')
    } finally {
      setIsDeletingAccount(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  const cardClass = "bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)] border border-gray-100 rounded-2xl"

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-12">
      <PageTitle
        title="Paramètres"
        description="Gérez votre compte et vos préférences"
      />

      {/* ═══════════════════════════════════════════
          SECTION 1 : SÉCURITÉ
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={cardClass}>
          <div className="p-5 sm:p-7">
            <SectionHeader
              icon={Shield}
              title="Sécurité"
              description="Gérez votre mot de passe et la sécurité de votre compte"
            />

            <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-5">
              {/* Current password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                  Mot de passe actuel
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 transition-colors group-focus-within:text-[#823F91]" />
                  <Input
                    id="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Votre mot de passe actuel"
                    {...register('currentPassword')}
                    className="h-12 pl-11 pr-12 border-gray-200 bg-gray-50 rounded-xl text-[15px] placeholder:text-gray-400 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#823F91]/20 focus-visible:border-[#823F91] focus-visible:bg-white hover:border-gray-300"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={showCurrent ? 'Masquer' : 'Afficher'}
                  >
                    {showCurrent ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-red-500 pl-1">{errors.currentPassword.message}</p>
                )}
              </div>

              {/* New password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 transition-colors group-focus-within:text-[#823F91]" />
                  <Input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    placeholder="Minimum 8 caractères"
                    {...register('newPassword')}
                    className="h-12 pl-11 pr-12 border-gray-200 bg-gray-50 rounded-xl text-[15px] placeholder:text-gray-400 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#823F91]/20 focus-visible:border-[#823F91] focus-visible:bg-white hover:border-gray-300"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={showNew ? 'Masquer' : 'Afficher'}
                  >
                    {showNew ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-500 pl-1">{errors.newPassword.message}</p>
                )}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-neutral-600 font-medium">Prérequis :</p>
                    <ul className="text-xs text-neutral-500 space-y-0.5 ml-2">
                      <li className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                        <span>{newPassword.length >= 8 ? '\u2713' : '\u25CB'}</span>
                        <span>Au moins 8 caractères</span>
                      </li>
                      <li className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                        <span>{/[A-Z]/.test(newPassword) ? '\u2713' : '\u25CB'}</span>
                        <span>Au moins une majuscule</span>
                      </li>
                      <li className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                        <span>{/[0-9]/.test(newPassword) ? '\u2713' : '\u25CB'}</span>
                        <span>Au moins un chiffre</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmer le nouveau mot de passe
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 transition-colors group-focus-within:text-[#823F91]" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirmez votre nouveau mot de passe"
                    {...register('confirmPassword')}
                    className="h-12 pl-11 pr-12 border-gray-200 bg-gray-50 rounded-xl text-[15px] placeholder:text-gray-400 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#823F91]/20 focus-visible:border-[#823F91] focus-visible:bg-white hover:border-gray-300"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                  >
                    {showConfirm ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 pl-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit */}
              <div className="pt-2">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Modification en cours...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Modifier le mot de passe
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════
          SECTION 2 : NOTIFICATIONS
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className={cardClass}>
          <div className="p-5 sm:p-7">
            <SectionHeader
              icon={Bell}
              title="Notifications"
              description="Choisissez les notifications que vous souhaitez recevoir"
            />

            <div className="space-y-1">
              {/* New requests */}
              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-50">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Nouvelles demandes</p>
                    <p className="text-xs text-gray-500">Recevez un email quand un couple vous envoie une demande</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.newRequests}
                  onCheckedChange={() => handleNotifToggle('newRequests')}
                  className="data-[state=checked]:bg-[#823F91]"
                />
              </div>

              <div className="mx-4 border-t border-gray-100" />

              {/* Messages */}
              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-50">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Messages</p>
                    <p className="text-xs text-gray-500">Soyez notifié quand vous recevez un nouveau message</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.messages}
                  onCheckedChange={() => handleNotifToggle('messages')}
                  className="data-[state=checked]:bg-[#823F91]"
                />
              </div>

              <div className="mx-4 border-t border-gray-100" />

              {/* Calendar reminders */}
              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-green-50">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Rappels d&apos;agenda</p>
                    <p className="text-xs text-gray-500">Recevez des rappels pour vos événements à venir</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.calendarReminders}
                  onCheckedChange={() => handleNotifToggle('calendarReminders')}
                  className="data-[state=checked]:bg-[#823F91]"
                />
              </div>

              <div className="mx-4 border-t border-gray-100" />

              {/* Newsletter */}
              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-50">
                    <Newspaper className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Newsletter & conseils</p>
                    <p className="text-xs text-gray-500">Conseils pour développer votre activité sur Nuply</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.newsletter}
                  onCheckedChange={() => handleNotifToggle('newsletter')}
                  className="data-[state=checked]:bg-[#823F91]"
                />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════
          SECTION 3 : GESTION DU COMPTE
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={cardClass}>
          <div className="p-5 sm:p-7">
            <SectionHeader
              icon={Lock}
              title="Gestion du compte"
              description="Exportez vos données ou supprimez votre compte"
            />

            {/* Export data */}
            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-gray-50/80 transition-colors mb-1">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gray-100">
                  <Download className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Exporter mes données</p>
                  <p className="text-xs text-gray-500">Téléchargez une copie de toutes vos données (profil, demandes, messages)</p>
                </div>
              </div>
              <button
                onClick={() => toast.success('L\'export de données sera bientôt disponible.')}
                className="flex items-center gap-1.5 text-sm font-medium text-[#823F91] hover:text-[#6D3478] transition-colors px-3 py-2 rounded-lg hover:bg-[#823F91]/5"
              >
                Exporter
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mx-4 border-t border-gray-100 my-2" />

            {/* Delete account */}
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 rounded-lg bg-red-50">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Supprimer mon compte</p>
                  <p className="text-xs text-gray-500">Cette action est irréversible. Toutes vos données seront définitivement supprimées.</p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm font-medium text-red-600 hover:text-red-700 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Supprimer mon compte
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50/50 border border-red-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      Tapez <span className="font-mono font-bold">SUPPRIMER</span> pour confirmer la suppression définitive de votre compte.
                    </p>
                  </div>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Tapez SUPPRIMER"
                    className="h-10 border-red-200 bg-white rounded-lg text-sm focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-red-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'SUPPRIMER' || isDeletingAccount}
                      className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isDeletingAccount ? 'Suppression...' : 'Confirmer la suppression'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText('')
                      }}
                      className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════
          FOOTER: SUPPORT
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-center py-4"
      >
        <p className="text-sm text-gray-400">
          Besoin d&apos;aide ? Contactez notre{' '}
          <button
            onClick={() => toast.info('Le support sera disponible prochainement.')}
            className="text-[#823F91] hover:text-[#6D3478] font-medium transition-colors underline underline-offset-2"
          >
            équipe support
          </button>
        </p>
      </motion.div>
    </div>
  )
}
