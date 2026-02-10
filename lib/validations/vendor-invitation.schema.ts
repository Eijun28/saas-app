import { z } from 'zod'

export const createVendorInvitationSchema = z.object({
  email: z.string().email('Email invalide').max(255, 'Email trop long'),
  nom_entreprise: z.string().max(200, 'Nom trop long').optional(),
  prenom: z.string().max(100, 'Prénom trop long').optional(),
  nom: z.string().max(100, 'Nom trop long').optional(),
  service_type: z.string().max(100).optional(),
  message: z.string().max(1000, 'Message trop long (max 1000 caractères)').optional(),
  channel: z.enum(['email', 'link', 'qr_code', 'whatsapp', 'sms']).default('email'),
})

export type CreateVendorInvitationInput = z.infer<typeof createVendorInvitationSchema>
