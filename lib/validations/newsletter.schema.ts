import { z } from 'zod'

export const newsletterSubscribeSchema = z.object({
  email: z.string().email('Email invalide').max(255, 'Email trop long'),
})

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>

export const newsletterSendSchema = z.object({
  subject: z.string().min(1, 'Le sujet est requis').max(200, 'Sujet trop long'),
  content: z.string().min(1, 'Le contenu est requis').max(50000, 'Contenu trop long'),
})

export type NewsletterSendInput = z.infer<typeof newsletterSendSchema>
