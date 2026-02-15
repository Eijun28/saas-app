'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'
import { toast } from 'sonner'

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

export default function ParametresPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Verify current password by attempting to sign in
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

      // Update password
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <PageTitle
        title="Paramètres"
        description="Gérez les paramètres de votre compte"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(130,63,145,0.08)]">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 rounded-lg bg-[#823F91]/10">
                <Lock className="h-4 w-4 text-[#823F91]" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Changer le mot de passe</h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
    </div>
  )
}
