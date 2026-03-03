import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendNewRequestEmail,
  sendRequestAcceptedEmail,
  sendRequestRejectedEmail,
  sendNewDevisEmail,
} from '@/lib/email/notifications'
import { logger } from '@/lib/logger'

type NotificationType =
  | 'new_request'
  | 'request_accepted'
  | 'request_rejected'
  | 'new_devis'

interface NotificationPayload {
  type: NotificationType
  providerId?: string
  coupleId?: string
  requestId?: string
  devisId?: string
  message?: string
  amount?: number
}

/**
 * POST /api/notifications
 * Point d'entrée server-side unique pour tous les emails transactionnels.
 * Le client ne transmet que le type et les IDs — la logique email reste serveur.
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est authentifié
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json() as NotificationPayload
    const { type, providerId, coupleId, requestId, devisId, message, amount } = body

    if (!type) {
      return NextResponse.json({ error: 'type requis' }, { status: 400 })
    }

    let result: { success: boolean; error?: string }

    switch (type) {
      case 'new_request': {
        if (!providerId || !coupleId || !requestId) {
          return NextResponse.json({ error: 'providerId, coupleId, requestId requis' }, { status: 400 })
        }
        // Seul le couple authentifié peut déclencher cet email
        if (user.id !== coupleId) {
          return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 })
        }
        result = await sendNewRequestEmail(providerId, coupleId, requestId, message)
        break
      }

      case 'request_accepted': {
        if (!coupleId || !providerId || !requestId) {
          return NextResponse.json({ error: 'coupleId, providerId, requestId requis' }, { status: 400 })
        }
        // Seul le prestataire authentifié peut déclencher cet email
        if (user.id !== providerId) {
          return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 })
        }
        result = await sendRequestAcceptedEmail(coupleId, providerId, requestId)
        break
      }

      case 'request_rejected': {
        if (!coupleId || !providerId || !requestId) {
          return NextResponse.json({ error: 'coupleId, providerId, requestId requis' }, { status: 400 })
        }
        // Seul le prestataire authentifié peut déclencher cet email
        if (user.id !== providerId) {
          return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 })
        }
        result = await sendRequestRejectedEmail(coupleId, providerId, requestId)
        break
      }

      case 'new_devis': {
        if (!coupleId || !providerId || !devisId) {
          return NextResponse.json({ error: 'coupleId, providerId, devisId requis' }, { status: 400 })
        }
        // Seul le prestataire authentifié peut déclencher cet email
        if (user.id !== providerId) {
          return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 })
        }
        result = await sendNewDevisEmail(coupleId, providerId, devisId, amount)
        break
      }

      default:
        return NextResponse.json({ error: `Type inconnu: ${type}` }, { status: 400 })
    }

    if (!result.success) {
      logger.warn('Notification email non envoyée', { type, error: result.error })
      // On retourne 200 pour ne pas bloquer le flux utilisateur côté client
      return NextResponse.json({ success: false, error: result.error })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    logger.error('Erreur API notifications:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
