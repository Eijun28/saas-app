import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message, Attachment, UserType } from '@/types/messages'

/**
 * Récupère toutes les conversations d'un utilisateur
 */
export async function getConversations(
  userId: string,
  userType: UserType
): Promise<Conversation[]> {
  const supabase = createClient()

  const column = userType === 'couple' ? 'couple_id' : 'prestataire_id'

  // Récupérer les conversations
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq(column, userId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  // Enrichir avec les profils
  const enrichedConversations = await Promise.all(
    (conversations || []).map(async (conv) => {
      const [coupleProfile, prestataireProfile] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, prenom, nom')
          .eq('id', conv.couple_id)
          .single(),
        supabase
          .from('profiles')
          .select('id, prenom, nom')
          .eq('id', conv.prestataire_id)
          .single(),
      ])

      return {
        ...conv,
        couple: coupleProfile.data ? {
          id: coupleProfile.data.id,
          user_metadata: {
            prenom: coupleProfile.data.prenom,
            nom: coupleProfile.data.nom,
          },
        } : undefined,
        prestataire: prestataireProfile.data ? {
          id: prestataireProfile.data.id,
          user_metadata: {
            prenom: prestataireProfile.data.prenom,
            nom: prestataireProfile.data.nom,
          },
        } : undefined,
      }
    })
  )

  if (error) {
    throw error
  }

  return enrichedConversations as Conversation[]
}

/**
 * Récupère les messages d'une conversation
 */
export async function getMessages(
  conversationId: string,
  limit = 50,
  offset = 0
): Promise<Message[]> {
  const supabase = createClient()

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    throw error
  }

  // Enrichir avec les profils des expéditeurs
  const enrichedMessages = await Promise.all(
    (messages || []).map(async (msg) => {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('id, prenom, nom')
        .eq('id', msg.sender_id)
        .single()

      // Parser le content si c'est du JSON (avec attachments)
      let parsedContent = msg.content
      let parsedAttachments: Attachment[] | undefined = undefined
      
      try {
        const parsed = JSON.parse(msg.content)
        if (parsed.attachments) {
          parsedContent = parsed.text || ''
          parsedAttachments = parsed.attachments
        }
      } catch {
        // Ce n'est pas du JSON, c'est du texte normal
        parsedContent = msg.content
      }

      // Déterminer le sender_type en vérifiant la conversation
      const { data: conversation } = await supabase
        .from('conversations')
        .select('couple_id, prestataire_id')
        .eq('id', msg.conversation_id)
        .single()

      const senderType: 'couple' | 'prestataire' = 
        conversation?.couple_id === msg.sender_id ? 'couple' : 'prestataire'

      return {
        ...msg,
        content: parsedContent,
        sender_type: senderType,
        content_type: parsedAttachments ? 'file' : 'text',
        attachments: parsedAttachments,
        sender: senderProfile ? {
          id: senderProfile.id,
          user_metadata: {
            prenom: senderProfile.prenom,
            nom: senderProfile.nom,
          },
        } : undefined,
      }
    })
  )

  if (error) {
    throw error
  }

  return enrichedMessages as Message[]
}

/**
 * Envoie un message dans une conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderType: UserType,
  content: string,
  attachments?: Attachment[]
): Promise<Message> {
  const supabase = createClient()

  // La table messages n'a que: id, conversation_id, sender_id, content, created_at, read_at
  // On stocke les attachments dans le content comme JSON si nécessaire
  const messageContent = attachments && attachments.length > 0
    ? JSON.stringify({ text: content || '📎 Fichier joint', attachments })
    : content

  const { data: newMessage, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: messageContent,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  // Enrichir avec le profil de l'expéditeur
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('id, prenom, nom')
    .eq('id', senderId)
    .single()

  // Parser le content si c'est du JSON (avec attachments)
  let parsedContent = content
  let parsedAttachments: Attachment[] | undefined = undefined
  
  try {
    const parsed = JSON.parse(newMessage.content)
    if (parsed.attachments) {
      parsedContent = parsed.text || ''
      parsedAttachments = parsed.attachments
    }
  } catch {
    // Ce n'est pas du JSON, c'est du texte normal
    parsedContent = newMessage.content
  }

  const enrichedMessage = {
    ...newMessage,
    content: parsedContent,
    sender_type: senderType,
    content_type: parsedAttachments ? 'file' : 'text',
    attachments: parsedAttachments,
    sender: senderProfile ? {
      id: senderProfile.id,
      user_metadata: {
        prenom: senderProfile.prenom,
        nom: senderProfile.nom,
      },
    } : undefined,
  }

  if (error) {
    throw error
  }

  return enrichedMessage as Message
}

/**
 * Marque les messages d'une conversation comme lus
 */
export async function markAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .rpc('mark_messages_as_read', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    })

  if (error) {
    // Ne pas throw, car cette fonction peut échouer si la fonction SQL n'existe pas encore
  }
}

/**
 * Récupère le nombre de conversations non lues
 */
export async function getUnreadConversationsCount(
  userId: string
): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase
    .rpc('get_unread_conversations_count', {
      p_user_id: userId,
    })

  if (error) {
    // Si la fonction n'existe pas, on compte manuellement
    const { data: conversations, error: countError } = await supabase
      .from('conversations')
      .select('unread_count')
      .or(`couple_id.eq.${userId},prestataire_id.eq.${userId}`)
      .eq('status', 'active')

    if (countError) {
      return 0
    }

    return (conversations || []).reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
  }

  return data || 0
}

/**
 * Obtient ou crée une conversation entre un couple et un prestataire
 */
export async function getOrCreateConversation(
  coupleId: string,
  prestataireId: string,
  demandeType?: string,
  cultures?: string[],
  eventDate?: string,
  eventLocation?: string,
  estimatedBudget?: number,
  guestCount?: number
): Promise<string> {
  const supabase = createClient()

  // D'abord, vérifier si une conversation existe déjà
  const { data: existing, error: checkError } = await supabase
    .from('conversations')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('prestataire_id', prestataireId)
    .eq('status', 'active')
    .single()

  if (existing) {
    return existing.id
  }

  // Si la fonction RPC existe, l'utiliser
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_or_create_conversation', {
      p_couple_id: coupleId,
      p_prestataire_id: prestataireId,
      p_demande_type: demandeType || null,
      p_cultures: cultures || null,
      p_event_date: eventDate || null,
      p_event_location: eventLocation || null,
      p_estimated_budget: estimatedBudget || null,
      p_guest_count: guestCount || null,
    })

  if (!rpcError && rpcData) {
    return rpcData
  }

  // Sinon, créer manuellement
  const { data: newConversation, error: createError } = await supabase
    .from('conversations')
    .insert({
      couple_id: coupleId,
      prestataire_id: prestataireId,
      status: 'active',
    })
    .select('id')
    .single()

  if (createError) {
    throw createError
  }

  return newConversation.id
}

/**
 * Archive une conversation
 */
export async function archiveConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .rpc('archive_conversation', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    })

  if (error) {
    // Si la fonction n'existe pas, mettre à jour manuellement
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ status: 'archived' })
      .eq('id', conversationId)
      .or(`couple_id.eq.${userId},prestataire_id.eq.${userId}`)

    if (updateError) {
      throw updateError
    }
  }
}

/**
 * Upload un fichier dans Supabase Storage
 */
export async function uploadAttachment(file: File): Promise<Attachment> {
  const supabase = createClient()

  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const filePath = `messages/${fileName}`

  const { data, error } = await supabase
    .storage
    .from('attachments')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw error
  }

  const { data: { publicUrl } } = supabase
    .storage
    .from('attachments')
    .getPublicUrl(filePath)

  return {
    name: file.name,
    url: publicUrl,
    size: file.size,
    type: file.type,
  }
}

/**
 * Valide un fichier avant upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxImageSize = 5 * 1024 * 1024 // 5MB
  const maxPdfSize = 10 * 1024 * 1024 // 10MB

  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const pdfTypes = ['application/pdf']

  if (imageTypes.includes(file.type)) {
    if (file.size > maxImageSize) {
      return { valid: false, error: 'L\'image est trop volumineuse (max 5MB)' }
    }
  } else if (pdfTypes.includes(file.type)) {
    if (file.size > maxPdfSize) {
      return { valid: false, error: 'Le PDF est trop volumineux (max 10MB)' }
    }
  } else {
    return { valid: false, error: 'Type de fichier non supporté (images: JPG/PNG/WEBP, documents: PDF)' }
  }

  return { valid: true }
}

