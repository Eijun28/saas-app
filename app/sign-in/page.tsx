'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema, type SignInInput } from '@/lib/validations/auth.schema'
import { signIn } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { FadeInOnScroll } from '@/components/landing/animations'

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn(data.email, data.password)
      if (result?.error) {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-24">
      <FadeInOnScroll>
        <Card className="w-full max-w-md border border-[#E5E7EB] shadow-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-semibold text-[#0F0F0F]">
              Se connecter
            </CardTitle>
            <CardDescription className="text-[#6B7280]">
              Accédez à votre compte NUPLY
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#374151]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    {...register('email')}
                    className="pl-10 border-[#E5E7EB] focus-visible:ring-[#823F91] focus-visible:border-[#823F91]"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#374151]">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    {...register('password')}
                    className="pl-10 pr-10 border-[#E5E7EB] focus-visible:ring-[#823F91] focus-visible:border-[#823F91]"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#0F0F0F] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/forgot-password"
                  className="text-[#823F91] hover:text-[#6D3478] transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white rounded-lg py-2.5 text-sm font-medium transition-colors duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>

              <p className="text-center text-sm text-[#6B7280]">
                Pas encore de compte ?{' '}
                <Link href="/sign-up" className="text-[#823F91] hover:text-[#6D3478] font-medium transition-colors">
                  Créer un compte
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </FadeInOnScroll>
    </div>
  )
}
