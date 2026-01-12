import { z } from 'zod'

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100, 'Nom trop long'),
  email: z.string().email('Email invalide').max(255, 'Email trop long'),
  subject: z.string().min(5, 'Le sujet doit contenir au moins 5 caractères').max(200, 'Sujet trop long'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères').max(2000, 'Message trop long'),
})

export type ContactFormInput = z.infer<typeof contactFormSchema>
