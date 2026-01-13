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
        console.error('Erreur insertion message:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          conversationId,
          senderId,
          contentLength: messageContent.length,
          // Log complet pour debug
          fullError: JSON.stringify(insertError, null, 2),
        })
        
        // Si c'est une erreur 409, vérifier la conversation
        if (insertError.code === '409' || insertError.code === '23505') {
          // Vérifier que la conversation existe et que l'utilisateur y a accès
          const { data: convCheck, error: convError } = await supabase
            .from('conversations')
            .select('id, couple_id, prestataire_id, provider_id')
            .eq('id', conversationId)
            .single()
          
          console.error('Vérification conversation:', {
            convCheck,
            convError,
            senderId,
            userIsCouple: convCheck?.couple_id === senderId,
            userIsPrestataire: convCheck?.prestataire_id === senderId || convCheck?.provider_id === senderId,
          })
        }
        
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
      console.error('Erreur envoi message:', {
        error,
        errorType: typeof error,
        errorString: String(error),
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        stack: error?.stack,
      })
      
      let errorMessage = 'Erreur lors de l\'envoi du message'
      
      // Messages d'erreur spécifiques selon le code
      if (error?.code === '409' || error?.code === '23505') {
        errorMessage = 'Conflit lors de l\'envoi. Vérifiez que vous avez accès à cette conversation.'
      } else if (error?.code === '42501' || error?.code === 'PGRST301') {
        errorMessage = 'Vous n\'avez pas la permission d\'envoyer ce message.'
      } else if (error?.code === '23503') {
        errorMessage = 'La conversation ou l\'utilisateur n\'existe pas.'
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.code) {
        errorMessage = `Erreur ${error.code}: ${error.message || 'Erreur inconnue'}`
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.details) {
        errorMessage = error.details
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
    <div className="border-t border-gray-200 bg-white p-4 space-y-3">
      {/* Aperçu des fichiers attachés */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {attachments.map((attachment, index) => {
            const isImage = ALLOWED_IMAGE_TYPES.includes(attachment.type)
            
            return (
              <div
                key={index}
                className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
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
                  </div>
                ) : (
                  <div className="p-3 flex items-center gap-2 min-w-[120px]">
                    <File className="h-5 w-5 text-[#823F91]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(attachment.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
            className="border-[#823F91]/20 hover:bg-[#823F91]/10 hover:border-[#823F91]"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#823F91]" />
            ) : (
              <ImageIcon className="h-4 w-4 text-[#823F91]" />
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleFileClick}
            disabled={isUploading || isSending}
            className="border-[#823F91]/20 hover:bg-[#823F91]/10 hover:border-[#823F91]"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#823F91]" />
            ) : (
              <Paperclip className="h-4 w-4 text-[#823F91]" />
            )}
          </Button>
        </div>

        {/* Textarea */}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 resize-none min-h-[44px] max-h-32 border-[#823F91]/20 focus:border-[#823F91] focus:ring-[#823F91]/20"
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
