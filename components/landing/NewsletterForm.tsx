'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { newsletterSubscribeSchema } from '@/lib/validations/newsletter.schema'

type FormData = z.infer<typeof newsletterSubscribeSchema>

export function NewsletterForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(newsletterSubscribeSchema),
  })

  const onSubmit = async (data: FormData) => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Une erreur est survenue')
      }

      setStatus('success')
      reset()
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-[#E8D4EF] rounded-xl p-6 text-center max-w-md mx-auto">
        <p className="text-[#823F91] font-semibold text-lg">Merci pour votre inscription !</p>
        <p className="text-text-secondary text-sm mt-1">
          Vous recevrez bientôt nos conseils mariage.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="votre@email.com"
            {...register('email')}
            className="h-11 bg-white/90 backdrop-blur-sm border-[#E8D4EF] focus:border-[#823F91] focus:ring-[#823F91]"
            disabled={status === 'loading'}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={status === 'loading'}
          className="h-11 bg-[#823F91] hover:bg-[#6D3478] text-white px-6"
        >
          {status === 'loading' ? 'Envoi...' : "S'inscrire"}
        </Button>
      </form>
      {status === 'error' && (
        <p className="text-red-500 text-xs mt-2 text-center">{errorMessage}</p>
      )}
    </div>
  )
}
