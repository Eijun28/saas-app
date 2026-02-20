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
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

// ─── Schema noms + email ────────────────────────────────────
const coupleInfoSchema = z.object({
  partner1Name: z.string().min(1, 'Le prénom/nom du partenaire 1 est requis').max(100),
  partner2Name: z.string().min(1, 'Le prénom/nom du partenaire 2 est requis').max(100),
  email: z.string().email('Adresse email invalide'),
})

type CoupleInfoInput = z.infer<typeof coupleInfoSchema>

// ─── Schema mot de passe ────────────────────────────────────
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
export default function CoupleParametresPage() {
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    messages: true,
    calendarReminders: true,
    newsletter: false,
  })

  const {
    register: registerInfo,
    handleSubmit: handleSubmitInfo,
    formState: { errors: errorsInfo },
    reset: resetInfo,
  } = useForm<CoupleInfoInput>({
    resolver: zodResolver(coupleInfoSchema),
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

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      const provider = authData.user.app_metadata?.provider
      setIsGoogleUser(provider === 'google')

      const { data: coupleData } = await supabase
        .from('couples')
        .select('partner_1_name, partner_2_name')
        .eq('user_id', authData.user.id)
        .single()

      resetInfo({
        partner1Name: coupleData?.partner_1_name ?? '',
        partner2Name: coupleData?.partner_2_name ?? '',
        email: authData.user.email ?? '',
      })
    }
    fetchData()
  }, [])

  // ─── Submit couple info ───────────────────────────────────
  const onSubmitInfo = async (data: CoupleInfoInput) => {
    setIsSavingInfo(true)
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      // Update couple names
      const { error: coupleError } = await supabase
        .from('couples')
        .update({
          partner_1_name: data.partner1Name.trim(),
          partner_2_name: data.partner2Name.trim(),
        })
        .eq('user_id', authData.user.id)

      if (coupleError) {
        toast.error('Erreur lors de la mise à jour des noms.')
        return
      }

      // Update email if changed
      if (data.email !== authData.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: data.email })
        if (emailError) {
          toast.error('Erreur lors de la mise à jour de l\'email.')
          return
        }
        toast.success('Informations mises à jour. Un email de confirmation a été envoyé à ' + data.email + '. Cliquez sur le lien pour valider votre nouvelle adresse.')
      } else {
        toast.success('Informations mises à jour avec succès !')
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSavingInfo(false)
    }
  }

  // ─── Submit password ──────────────────────────────────────
  const onSubmitPassword = async (data: ChangePasswordInput) => {
    setIsLoadingPassword(true)
    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.email) {
        toast.error('Impossible de récupérer votre email. Veuillez vous reconnecter.')
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: data.currentPassword,
      })

      if (signInError) {
        toast.error('Le mot de passe actuel est incorrect.')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: data.newPassword })
      if (updateError) {
        toast.error('Erreur lors de la modification du mot de passe. Veuillez réessayer.')
        return
      }

      toast.success('Mot de passe modifié avec succès !')
      reset()
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoadingPassword(false)
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

  const cardClass = "card-section"

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-12 px-4 sm:px-0">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-foreground">Paramètres du compte</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez vos informations personnelles et préférences</p>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 1 : INFORMATIONS DU COUPLE
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className={cardClass}>
          <div className="p-5 sm:p-7">
            <SectionHeader
              icon={Users}
              title="Informations du compte"
              description="Modifiez les noms des partenaires et l'adresse email"
            />

            <form onSubmit={handleSubmitInfo(onSubmitInfo)} className="space-y-5">
              {/* Partner 1 */}
              <div className="space-y-2">
                <Label htmlFor="partner1Name" className="text-sm font-medium text-foreground/80">
                  Partenaire 1 — Prénom & Nom
                </Label>
                <Input
                  id="partner1Name"
                  placeholder="Ex : Marie Dupont"
                  {...registerInfo('partner1Name')}
                  className="h-11 border-border bg-muted/50 rounded-xl text-[15px] placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-card hover:border-border/80"
                  disabled={isSavingInfo}
                />
                {errorsInfo.partner1Name && (
                  <p className="text-sm text-red-500 pl-1">{errorsInfo.partner1Name.message}</p>
                )}
              </div>

              {/* Partner 2 */}
              <div className="space-y-2">
                <Label htmlFor="partner2Name" className="text-sm font-medium text-foreground/80">
                  Partenaire 2 — Prénom & Nom
                </Label>
                <Input
                  id="partner2Name"
                  placeholder="Ex : Thomas Martin"
                  {...registerInfo('partner2Name')}
                  className="h-11 border-border bg-muted/50 rounded-xl text-[15px] placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-card hover:border-border/80"
                  disabled={isSavingInfo}
                />
                {errorsInfo.partner2Name && (
                  <p className="text-sm text-red-500 pl-1">{errorsInfo.partner2Name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email-couple" className="text-sm font-medium text-foreground/80">
                  Adresse email
                </Label>
                {isGoogleUser && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Votre compte est lié à Google. Modifier l&apos;email ici enverra un lien de confirmation à la nouvelle adresse.
                  </p>
                )}
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email-couple"
                    type="email"
                    placeholder="votre@email.com"
                    {...registerInfo('email')}
                    className="h-11 pl-11 border-border bg-muted/50 rounded-xl text-[15px] placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-card hover:border-border/80"
                    disabled={isSavingInfo}
                  />
                </div>
                {errorsInfo.email && (
                  <p className="text-sm text-red-500 pl-1">{errorsInfo.email.message}</p>
                )}
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
          SECTION 2 : SÉCURITÉ (masquée pour Google)
          ═══════════════════════════════════════════ */}
      {!isGoogleUser && (
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
                description="Gérez votre mot de passe"
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
                      disabled={isLoadingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors p-1 rounded-md hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                      disabled={isLoadingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors p-1 rounded-md hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                          <span>{newPassword.length >= 8 ? '✓' : '○'}</span>
                          <span>Au moins 8 caractères</span>
                        </li>
                        <li className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                          <span>{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span>
                          <span>Au moins une majuscule</span>
                        </li>
                        <li className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                          <span>{/[0-9]/.test(newPassword) ? '✓' : '○'}</span>
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
                      disabled={isLoadingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors p-1 rounded-md hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {showConfirm ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 pl-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={isLoadingPassword}
                    whileHover={{ scale: isLoadingPassword ? 1 : 1.01 }}
                    whileTap={{ scale: isLoadingPassword ? 1 : 0.98 }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isLoadingPassword ? (
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
      )}

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

              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-green-50">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Rappels calendrier</p>
                    <p className="text-xs text-muted-foreground">Recevez des rappels pour vos échéances et événements</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.calendarReminders}
                  onCheckedChange={() => handleNotifToggle('calendarReminders')}
                  className="data-[state=checked]:bg-[#823F91]"
                />
              </div>

              <div className="mx-4 border-t border-border/50" />

              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-50">
                    <Newspaper className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Newsletter & conseils</p>
                    <p className="text-xs text-muted-foreground">Inspirations et conseils pour préparer votre mariage</p>
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

            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors mb-1">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Exporter mes données</p>
                  <p className="text-xs text-muted-foreground">Téléchargez une copie de toutes vos données</p>
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

            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 rounded-lg bg-red-50">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Supprimer mon compte</p>
                  <p className="text-xs text-muted-foreground">Cette action est irréversible. Toutes vos données seront supprimées.</p>
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
                      onClick={() => toast.error('La suppression de compte sera bientôt disponible. Contactez le support.')}
                      disabled={deleteConfirmText !== 'SUPPRIMER'}
                      className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Confirmer la suppression
                    </button>
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
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
