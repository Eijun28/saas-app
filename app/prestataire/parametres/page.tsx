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
  CreditCard,
  Bell,
  Shield,
  Trash2,
  Download,
  Sparkles,
  Mail,
  MessageSquare,
  Calendar,
  Newspaper,
  AlertTriangle,
  ChevronRight,
  User,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { toast } from 'sonner'
import AmbassadorSection from '@/components/prestataire/AmbassadorSection'
import { ConnectOnboardingCard } from '@/components/stripe/ConnectOnboardingCard'

// ─── Profile info schema ────────────────────────────────────
const profileInfoSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis').max(50),
  nom: z.string().min(1, 'Le nom est requis').max(50),
  email: z.string().email('Adresse email invalide'),
})

type ProfileInfoInput = z.infer<typeof profileInfoSchema>

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
        <h3 className="font-semibold text-base sm:text-lg text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
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
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    newRequests: true,
    messages: true,
    calendarReminders: true,
    newsletter: false,
  })

  const {
    register: registerInfo,
    handleSubmit: handleSubmitInfo,
    formState: { errors: errorsInfo },
    reset: resetInfo,
  } = useForm<ProfileInfoInput>({
    resolver: zodResolver(profileInfoSchema),
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

  // Fetch user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUserEmail(data.user.email ?? null)
        const provider = data.user.app_metadata?.provider
        setIsGoogleUser(provider === 'google')

        // Load existing profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('prenom, nom')
          .eq('id', data.user.id)
          .single()

        resetInfo({
          prenom: profile?.prenom ?? '',
          nom: profile?.nom ?? '',
          email: data.user.email ?? '',
        })
      }
    }
    fetchUser()
  }, [])

  // ─── Profile info submit ──────────────────────────────────
  const onSubmitInfo = async (data: ProfileInfoInput) => {
    setIsSavingInfo(true)
    try {
      const supabase = createClient()

      // Update name in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ prenom: data.prenom.trim(), nom: data.nom.trim() })
        .eq('id', (await supabase.auth.getUser()).data.user!.id)

      if (profileError) {
        toast.error('Erreur lors de la mise à jour du profil.')
        return
      }

      // Update email if changed
      const currentUser = (await supabase.auth.getUser()).data.user
      if (data.email !== currentUser?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: data.email })
        if (emailError) {
          toast.error('Erreur lors de la mise à jour de l\'email.')
          return
        }
        toast.success('Profil mis à jour. Un email de confirmation a été envoyé à ' + data.email + '. Cliquez sur le lien pour valider votre nouvelle adresse.')
      } else {
        toast.success('Informations mises à jour avec succès !')
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSavingInfo(false)
    }
  }

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

  const cardClass = "card-section"

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-12">
      <PageTitle
        title="Paramètres"
        description="Gérez votre compte, votre abonnement et vos préférences"
      />

      {/* ═══════════════════════════════════════════
          SECTION 0 : INFORMATIONS PERSONNELLES
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
      >
        <Card className={cardClass}>
          <div className="p-5 sm:p-7">
            <SectionHeader
              icon={User}
              title="Informations personnelles"
              description="Modifiez votre prénom, nom et adresse email"
            />

            <form onSubmit={handleSubmitInfo(onSubmitInfo)} className="space-y-5">
              {/* Prénom + Nom */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="prenom" className="text-sm font-medium text-foreground/80">Prénom</Label>
                  <Input
                    id="prenom"
                    placeholder="Votre prénom"
                    {...registerInfo('prenom')}
                    className="h-11 border-border bg-muted/50 rounded-xl text-[15px] placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-card hover:border-border/80"
                    disabled={isSavingInfo}
                  />
                  {errorsInfo.prenom && <p className="text-sm text-red-500 pl-1">{errorsInfo.prenom.message}</p>}
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="nom" className="text-sm font-medium text-foreground/80">Nom</Label>
                  <Input
                    id="nom"
                    placeholder="Votre nom"
                    {...registerInfo('nom')}
                    className="h-11 border-border bg-muted/50 rounded-xl text-[15px] placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-card hover:border-border/80"
                    disabled={isSavingInfo}
                  />
                  {errorsInfo.nom && <p className="text-sm text-red-500 pl-1">{errorsInfo.nom.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email-info" className="text-sm font-medium text-foreground/80">Adresse email</Label>
                {isGoogleUser && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Votre compte est lié à Google. Modifier l&apos;email ici enverra un lien de confirmation à la nouvelle adresse.
                  </p>
                )}
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email-info"
                    type="email"
                    placeholder="votre@email.com"
                    {...registerInfo('email')}
                    className="h-11 pl-11 border-border bg-muted/50 rounded-xl text-[15px] placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-card hover:border-border/80"
                    disabled={isSavingInfo}
                  />
                </div>
                {errorsInfo.email && <p className="text-sm text-red-500 pl-1">{errorsInfo.email.message}</p>}
              </div>

              <div className="pt-2">
                <motion.button
                  type="submit"
                  disabled={isSavingInfo}
                  whileHover={{ scale: isSavingInfo ? 1 : 1.01 }}
                  whileTap={{ scale: isSavingInfo ? 1 : 0.98 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSavingInfo ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════
          SECTION AMBASSADEUR (conditionnelle)
          ═══════════════════════════════════════════ */}
      <AmbassadorSection />

      {/* ═══════════════════════════════════════════
          SECTION 1 : ABONNEMENT
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className={cardClass}>
          <div className="p-5 sm:p-7">
            <SectionHeader
              icon={CreditCard}
              title="Abonnement"
              description="Votre forfait actuel"
            />

            <div className="space-y-4">
              {/* Current plan row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Forfait Discovery</p>
                  <p className="text-sm text-muted-foreground">Gratuit</p>
                </div>
                <button
                  onClick={() => toast.info('La gestion des abonnements sera disponible prochainement.')}
                  className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200"
                >
                  Modifier l&apos;abonnement
                </button>
              </div>

              {/* Launch offer info */}
              <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-4">
                <Sparkles className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  Vous beneficiez de l&apos;offre de lancement : toutes les fonctionnalites sont accessibles gratuitement.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════
          SECTION STRIPE CONNECT : PAIEMENTS EN LIGNE
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <ConnectOnboardingCard />
      </motion.div>

      {/* ═══════════════════════════════════════════
          SECTION 2 : SÉCURITÉ
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
                <Label htmlFor="currentPassword" className="text-sm font-medium text-foreground/80">
                  Mot de passe actuel
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Votre mot de passe actuel"
                    {...register('currentPassword')}
                    className="h-11 pl-11 pr-12 border-border bg-muted/50 rounded-xl text-[15px] placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-card hover:border-border/80"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors p-1 rounded-md hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                <Label htmlFor="newPassword" className="text-sm font-medium text-foreground/80">
                  Nouveau mot de passe
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    placeholder="Minimum 8 caractères"
                    {...register('newPassword')}
                    className="h-11 pl-11 pr-12 border-border bg-muted/50 rounded-xl text-[15px] placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-card hover:border-border/80"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors p-1 rounded-md hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/80">
                  Confirmer le nouveau mot de passe
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirmez votre nouveau mot de passe"
                    {...register('confirmPassword')}
                    className="h-11 pl-11 pr-12 border-border bg-muted/50 rounded-xl text-[15px] placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-card hover:border-border/80"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors p-1 rounded-md hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
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
          SECTION 3 : NOTIFICATIONS
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
              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-50">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Nouvelles demandes</p>
                    <p className="text-xs text-muted-foreground">Recevez un email quand un couple vous envoie une demande</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.newRequests}
                  onCheckedChange={() => handleNotifToggle('newRequests')}
                  className="data-[state=checked]:bg-[#823F91]"
                />
              </div>

              <div className="mx-4 border-t border-border/50" />

              {/* Messages */}
              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Messages</p>
                    <p className="text-xs text-muted-foreground">Soyez notifié quand vous recevez un nouveau message</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.messages}
                  onCheckedChange={() => handleNotifToggle('messages')}
                  className="data-[state=checked]:bg-[#823F91]"
                />
              </div>

              <div className="mx-4 border-t border-border/50" />

              {/* Calendar reminders */}
              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-green-50">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Rappels d&apos;agenda</p>
                    <p className="text-xs text-muted-foreground">Recevez des rappels pour vos événements à venir</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.calendarReminders}
                  onCheckedChange={() => handleNotifToggle('calendarReminders')}
                  className="data-[state=checked]:bg-[#823F91]"
                />
              </div>

              <div className="mx-4 border-t border-border/50" />

              {/* Newsletter */}
              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-50">
                    <Newspaper className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Newsletter & conseils</p>
                    <p className="text-xs text-muted-foreground">Conseils pour développer votre activité sur Nuply</p>
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
          SECTION 4 : GESTION DU COMPTE
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
            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors mb-1">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Exporter mes données</p>
                  <p className="text-xs text-muted-foreground">Téléchargez une copie de toutes vos données (profil, demandes, messages)</p>
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

            <div className="mx-4 border-t border-border/50 my-2" />

            {/* Delete account */}
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 rounded-lg bg-red-50">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Supprimer mon compte</p>
                  <p className="text-xs text-muted-foreground">Cette action est irréversible. Toutes vos données seront définitivement supprimées.</p>
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
                      className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors"
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
        <p className="text-sm text-muted-foreground">
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
