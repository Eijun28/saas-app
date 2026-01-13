'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Paperclip, X, Image as ImageIcon, File, Send, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Attachment } from '@/types/messages'
import Image from 'next/image'

interface MessageInputProps {
  conversationId: string
  senderId: string
  onMessageSent: () => void
  placeholder?: string
}

export function MessageInput({ 
  conversationId, 
  senderId, 
  onMessageSent,
  placeholder = "Tapez votre message..." 
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ]

  const uploadFile = async (file: File): Promise<Attachment> => {
    const supabase = createClient()

    // Générer un nom unique
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `messages/${senderId}/${fileName}`

    // Upload vers Supabase Storage (bucket: attachments)
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      // Si le bucket n'existe pas, essayer de le créer ou utiliser un bucket alternatif
      if (error.message?.includes('Bucket not found')) {
        // Essayer avec un autre bucket ou créer une erreur explicite
        throw new Error('Le bucket de stockage n\'est pas configuré. Veuillez contacter le support.')
      }
      throw error
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath)

    return {
      name: file.name,
      url: publicUrl,
      size: file.size,
      type: file.type,
    }
  }

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newAttachments: Attachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Vérifier la taille
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Le fichier "${file.name}" est trop volumineux (max 10MB)`)
        continue
      }

      // Vérifier le type
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
      const isFile = ALLOWED_FILE_TYPES.includes(file.type)

      if (!isImage && !isFile) {
        toast.error(`Le format "${file.type}" n'est pas supporté`)
        continue
      }

      setIsUploading(true)
      try {
        const attachment = await uploadFile(file)
        newAttachments.push(attachment)
      } catch (error: any) {
        console.error('Erreur upload:', error)
        toast.error(`Erreur lors de l'upload de "${file.name}"`)
      } finally {
        setIsUploading(false)
      }
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments])
    }
  }, [])

  const handleImageClick = () => {
    imageInputRef.current?.click()
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || isSending) return

    if (!conversationId || !senderId) {
      toast.error('Informations de conversation manquantes')
      return
    }

    setIsSending(true)
    const supabase = createClient()

    try {
      // Vérifier d'abord que la conversation existe et que l'utilisateur y a accès
      // Essayer d'abord avec une requête simple (ne pas inclure provider_id qui n'existe pas)
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, couple_id, prestataire_id, status')
        .eq('id', conversationId)
        .maybeSingle()

      // Log détaillé pour diagnostiquer le problème
      if (convError) {
        console.error('Erreur lors de la récupération de la conversation:', {
          conversationId,
          senderId,
          error: convError,
          errorCode: convError.code,
          errorMessage: convError.message,
          errorDetails: convError.details,
          errorHint: convError.hint,
          // Essayer de sérialiser l'erreur complète
          errorJSON: JSON.stringify(convError, Object.getOwnPropertyNames(convError)),
        })
      }

      if (!conversation) {
        // Si la conversation n'existe pas, vérifier si c'est un problème de RLS
        // en essayant une requête différente
        const { data: allConversations, error: listError } = await supabase
          .from('conversations')
          .select('id')
          .limit(1)

        console.error('Conversation introuvable:', {
          conversationId,
          senderId,
          convError,
          conversation,
          canAccessConversationsTable: !listError,
          listError: listError ? {
            code: listError.code,
            message: listError.message,
          } : null,
        })

        // Message d'erreur plus informatif
        if (convError?.code === 'PGRST301' || convError?.code === '42501') {
          toast.error('Vous n\'avez pas la permission d\'accéder à cette conversation. Veuillez vous reconnecter.')
        } else if (convError?.code === 'PGRST116') {
          toast.error('La table conversations n\'existe pas encore. Veuillez contacter le support.')
        } else {
          toast.error('Conversation introuvable. Veuillez rafraîchir la page ou sélectionner une autre conversation.')
        }
        return
      }

      // Vérifier que la conversation est active
      if (conversation.status && conversation.status !== 'active') {
        console.warn('Conversation non active:', {
          conversationId,
          status: conversation.status,
        })
        toast.error('Cette conversation n\'est plus active.')
        return
      }

      // Vérifier que l'utilisateur a accès à cette conversation
      // Pour un couple, vérifier via couples.user_id
      // Pour un prestataire, vérifier directement prestataire_id
      let hasAccess = false
      let accessCheckError = null
      
      if (conversation.couple_id) {
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('user_id')
          .eq('id', conversation.couple_id)
          .maybeSingle()
        
        if (coupleError) {
          accessCheckError = coupleError
          console.warn('Erreur lors de la vérification du couple:', {
            conversationId,
            couple_id: conversation.couple_id,
            error: coupleError,
          })
        } else if (coupleData?.user_id === senderId) {
          hasAccess = true
        }
      }
      
      // Vérifier si c'est un prestataire
      if (!hasAccess && conversation.prestataire_id === senderId) {
        hasAccess = true
      }

      if (!hasAccess) {
        console.error('Accès refusé à la conversation:', {
          conversationId,
          senderId,
          conversation,
          accessCheckError,
          couple_id: conversation.couple_id,
          prestataire_id: conversation.prestataire_id,
        })
        
        // Message d'erreur plus spécifique
        if (accessCheckError) {
          if (accessCheckError.code === 'PGRST301' || accessCheckError.code === '42501') {
            toast.error('Erreur de permission. Veuillez vous reconnecter.')
          } else {
            toast.error('Impossible de vérifier votre accès à cette conversation.')
          }
        } else {
          toast.error('Vous n\'avez pas accès à cette conversation.')
        }
        return
      }

      // Construire le contenu du message
      let messageContent = message.trim()
      
      // Si on a des attachments, stocker en JSON
      if (attachments.length > 0) {
        const messageData = {
          text: messageContent || '📎 Fichier joint',
          attachments: attachments,
        }
        messageContent = JSON.stringify(messageData)
      }

      // Insérer le message
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: messageContent,
        })
        .select()
        .single()

      if (insertError) {
        // Vérifier d'abord que la conversation existe et que l'utilisateur y a accès
        const { data: convCheck, error: convError } = await supabase
          .from('conversations')
          .select('id, couple_id, prestataire_id')
          .eq('id', conversationId)
          .maybeSingle()
        
        // Vérifier aussi le couple_id depuis couples si c'est un couple
        let coupleCheck = null
        if (convCheck?.couple_id) {
          const { data: coupleData } = await supabase
            .from('couples')
            .select('id, user_id')
            .eq('id', convCheck.couple_id)
            .maybeSingle()
          coupleCheck = coupleData
        }
        
        console.error('Erreur insertion message:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          conversationId,
          senderId,
          contentLength: messageContent.length,
          conversationExists: !!convCheck,
          conversationError: convError,
          conversationData: convCheck,
          coupleCheck,
          userIsCouple: coupleCheck?.user_id === senderId,
          userIsPrestataire: convCheck?.prestataire_id === senderId,
          // Log complet pour debug
          fullError: JSON.stringify(insertError, Object.getOwnPropertyNames(insertError)),
        })
        
        throw insertError
      }

      if (!insertedMessage) {
        throw new Error('Le message n\'a pas été créé')
      }

      // Mettre à jour last_message_at
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)

      if (updateError) {
        console.warn('Erreur mise à jour conversation:', updateError)
        // Ne pas bloquer si cette mise à jour échoue
      }

      // Réinitialiser
      setMessage('')
      setAttachments([])
      onMessageSent()
      toast.success('Message envoyé')
    } catch (error: any) {
      // Améliorer le logging pour capturer toutes les informations possibles
      const errorInfo: any = {
        error,
        errorType: typeof error,
        errorString: String(error),
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        stack: error?.stack,
        conversationId,
        senderId,
      }

      // Essayer de sérialiser l'erreur complète
      try {
        errorInfo.errorJSON = JSON.stringify(error, Object.getOwnPropertyNames(error))
      } catch (e) {
        errorInfo.errorSerializationFailed = true
      }

      // Vérifier si l'erreur est vide (problème courant avec RLS)
      const isEmptyError = error && typeof error === 'object' && Object.keys(error).length === 0
      
      console.error('Erreur envoi message:', errorInfo)
      
      let errorMessage = 'Erreur lors de l\'envoi du message'
      
      // Messages d'erreur spécifiques selon le code
      if (isEmptyError) {
        // Erreur vide (peut arriver avec RLS qui bloque silencieusement)
        errorMessage = 'Erreur de permission. Vérifiez que vous avez accès à cette conversation et que vous êtes bien connecté. Si le problème persiste, rafraîchissez la page.'
      } else if (error?.code === '409' || error?.code === '23505') {
        errorMessage = 'Conflit lors de l\'envoi. Vérifiez que vous avez accès à cette conversation.'
      } else if (error?.code === '42501' || error?.code === 'PGRST301') {
        errorMessage = 'Vous n\'avez pas la permission d\'envoyer ce message. Vérifiez que vous êtes bien connecté et que vous avez accès à cette conversation.'
      } else if (error?.code === '23503') {
        errorMessage = 'La conversation ou l\'utilisateur n\'existe pas. Veuillez rafraîchir la page.'
      } else if (error?.code === 'PGRST116') {
        errorMessage = 'La table messages n\'existe pas encore. Veuillez contacter le support.'
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.code) {
        errorMessage = `Erreur ${error.code}: ${error.message || 'Erreur inconnue'}`
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.details) {
        errorMessage = error.details
      } else if (error?.hint) {
        errorMessage = error.hint
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-purple-100 bg-gradient-to-br from-white to-purple-50/30 p-4 space-y-3 shadow-sm">
      {/* Aperçu des fichiers attachés */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {attachments.map((attachment, index) => {
            const isImage = ALLOWED_IMAGE_TYPES.includes(attachment.type)
            
            return (
              <div
                key={index}
                className="relative group border-2 border-purple-200 rounded-lg overflow-hidden bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                {isImage ? (
                  <div className="relative w-20 h-20">
                    <Image
                      src={attachment.url}
                      alt={attachment.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div className="p-3 flex items-center gap-2 min-w-[120px] bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
                    <div className="p-1.5 rounded-md bg-purple-100">
                      <File className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-purple-600 font-medium">
                        {(attachment.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
                  aria-label="Retirer le fichier"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Zone de saisie */}
      <div className="flex gap-2 items-end">
        {/* Boutons d'attachement */}
        <div className="flex gap-1">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleImageClick}
            disabled={isUploading || isSending}
            className="border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 hover:border-purple-400 text-purple-600 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Ajouter une photo"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            ) : (
              <ImageIcon className="h-4 w-4 text-purple-600" />
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleFileClick}
            disabled={isUploading || isSending}
            className="border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 hover:border-purple-400 text-purple-600 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Joindre un fichier"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            ) : (
              <Paperclip className="h-4 w-4 text-purple-600" />
            )}
          </Button>
        </div>

        {/* Textarea */}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 resize-none min-h-[44px] max-h-32 border-purple-200 bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 placeholder:text-gray-400 text-gray-900 shadow-sm transition-all duration-200"
          rows={1}
          disabled={isSending}
        />

        {/* Bouton d'envoi */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || isSending || isUploading}
          className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white shadow-lg shadow-[#823F91]/30 disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
