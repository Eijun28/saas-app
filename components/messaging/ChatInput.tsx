'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Smile, Paperclip, Image, FileText, Camera } from 'lucide-react'
import { toast } from 'sonner'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ChatInputProps {
  conversationId: string
  senderId: string
  onMessageSent?: () => void
}

// Emojis populaires pour le picker simple
const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
  '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
  '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏',
]

export function ChatInput({
  conversationId,
  senderId,
  onMessageSent,
}: ChatInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`
    }
  }, [content])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!content.trim() || isSending) return

    const messageContent = content.trim()
    setIsSending(true)
    setContent('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: messageContent,
      })

      if (error) {
        throw error
      }

      onMessageSent?.()
    } catch (err) {
      console.error('Erreur envoi message:', err)
      toast.error("Erreur lors de l'envoi du message")
      setContent(messageContent) // Restore content on error
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const handleFileSelect = (type: 'image' | 'document' | 'camera') => {
    if (type === 'camera') {
      // Ouvrir la caméra native sur mobile via l'attribut capture
      if (fileInputRef.current) {
        fileInputRef.current.accept = 'image/*'
        fileInputRef.current.setAttribute('capture', 'environment')
        fileInputRef.current.click()
        setTimeout(() => {
          fileInputRef.current?.removeAttribute('capture')
          if (fileInputRef.current) fileInputRef.current.accept = 'image/*,video/*,.pdf,.doc,.docx'
        }, 100)
      }
      return
    }

    if (type === 'image' && fileInputRef.current) {
      fileInputRef.current.accept = 'image/*,video/*'
    } else if (type === 'document' && fileInputRef.current) {
      fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt'
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_SIZE = 10 * 1024 * 1024 // 10 Mo
    if (file.size > MAX_SIZE) {
      toast.error('Le fichier ne doit pas dépasser 10 Mo')
      e.target.value = ''
      return
    }

    setIsSending(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${conversationId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(uploadData.path)

      const isImage = file.type.startsWith('image/')
      const messageContent = isImage
        ? `[Image] ${urlData.publicUrl}`
        : `[Fichier: ${file.name}] ${urlData.publicUrl}`

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: messageContent,
      })

      if (error) throw error

      onMessageSent?.()
      toast.success('Fichier envoyé')
    } catch (err) {
      console.error('Erreur upload fichier:', err)
      toast.error("Erreur lors de l'envoi du fichier")
    } finally {
      setIsSending(false)
      e.target.value = ''
      if (fileInputRef.current) {
        fileInputRef.current.accept = 'image/*,video/*,.pdf,.doc,.docx'
      }
    }
  }

  const hasContent = content.trim().length > 0

  return (
    <div className="bg-white border-t border-gray-100 safe-area-bottom">
      <form onSubmit={handleSubmit} className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-1.5 sm:gap-2 bg-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-gray-300 focus-within:border-gray-300 transition-all">
            {/* Bouton emoji */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/50 active:bg-white/70 transition-colors"
                    aria-label="Emoji"
                  >
                    <Smile className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] sm:w-80 p-2 sm:p-3" align="start">
                <div className="grid grid-cols-8 gap-0.5 sm:gap-1">
                  {EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-[#FBF8F3] active:bg-[#F5F0E8] transition-colors text-lg sm:text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              className="flex-1 bg-transparent border-0 resize-none outline-none text-sm sm:text-[15px] md:text-[16px] text-gray-900 placeholder:text-gray-400 min-h-[20px] sm:min-h-[22px] max-h-[120px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] leading-relaxed"
              rows={1}
              disabled={isSending}
            />

            {/* Bouton pièce jointe */}
            {!hasContent && (
              <div className="flex-shrink-0 flex items-center gap-0.5 sm:gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/60 active:bg-white/80 transition-colors"
                      aria-label="Pièces jointes"
                    >
                      <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 text-[#8B7866]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 sm:w-48 p-2" align="end">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => handleFileSelect('image')}
                        className="w-full flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-[#FBF8F3] transition-colors text-xs sm:text-sm text-[#2C1810]"
                      >
                        <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFileSelect('document')}
                        className="w-full flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-[#FBF8F3] transition-colors text-xs sm:text-sm text-[#2C1810]"
                      >
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Document
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFileSelect('camera')}
                        className="w-full flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-[#FBF8F3] transition-colors text-xs sm:text-sm text-[#2C1810]"
                      >
                        <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Caméra
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Input fichier caché */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Bouton envoyer */}
            <button
              type="submit"
              disabled={!content.trim() || isSending}
              className="flex-shrink-0 bg-gray-800 text-white rounded-full w-7 h-7 sm:w-9 sm:h-9 hover:bg-gray-700 active:scale-95 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Envoyer"
            >
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
