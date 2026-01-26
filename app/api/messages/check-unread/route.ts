import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewMessageEmail } from '@/lib/email/notifications'
import { logger } from '@/lib/logger'

/**
 * Route API pour vérifier les messages non lus après 5 minutes
 * Appelée automatiquement par Vercel Cron toutes les 5 minutes
 */
export async function POST(request: NextRequest) {
  // Vérifier que la requête vient de Vercel Cron (sécurité)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // En production, vérifier le secret si configuré
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // En développement, on accepte aussi les appels locaux
    const isLocal = request.headers.get('host')?.includes('localhost')
    if (!isLocal) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }
  }

  try {
    const adminClient = createAdminClient()
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    // Récupérer les messages non lus créés il y a plus de 5 minutes
    const { data: unreadMessages, error } = await adminClient
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        read_at,
        conversations!inner (
          id,
          couple_id,
          provider_id,
          request_id
        )
      `)
      .is('read_at', null)
      .lt('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Erreur récupération messages non lus:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des messages' },
        { status: 500 }
      )
    }

    if (!unreadMessages || unreadMessages.length === 0) {
      return NextResponse.json({ 
        success: true, 
        checked: 0,
        sent: 0 
      })
    }

    // Vérifier qu'on n'a pas déjà envoyé d'email pour ces messages
    // (on peut utiliser une table de tracking ou vérifier dans les logs)
    let emailsSent = 0

    for (const message of unreadMessages) {
      const conversation = message.conversations as any
      if (!conversation) continue

      // Déterminer qui est le destinataire
      const recipientId = conversation.couple_id === message.sender_id
        ? conversation.provider_id
        : conversation.couple_id

      const isRecipientCouple = conversation.couple_id === recipientId

      // Vérifier si le message est toujours non lu
      const { data: currentMessage } = await adminClient
        .from('messages')
        .select('read_at')
        .eq('id', message.id)
        .single()

      if (currentMessage?.read_at) {
        // Message déjà lu, on skip
        continue
      }

      try {
        await sendNewMessageEmail(
          recipientId,
          message.sender_id,
          conversation.id,
          message.content,
          isRecipientCouple
        )
        emailsSent++
        logger.info('Email nouveau message envoyé', {
          messageId: message.id,
          recipientId,
          conversationId: conversation.id,
        })
      } catch (emailError) {
        logger.error('Erreur envoi email nouveau message:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      checked: unreadMessages.length,
      sent: emailsSent,
    })
  } catch (error: any) {
    logger.error('Erreur vérification messages non lus:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
