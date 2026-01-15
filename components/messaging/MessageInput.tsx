'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'
import { toast } from 'sonner'

interface MessageInputProps {
  conversationId: string
  senderId: string
  onMessageSent?: () => void
}

export function MessageInput({ conversationId, senderId, onMessageSent }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
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
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: messageContent,
        })

      if (error) {
        throw error
      }

      onMessageSent?.()
    } catch (error: any) {
      console.error('Erreur envoi message:', error)
      toast.error('Erreur lors de l\'envoi du message')
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

  return (
    <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 safe-area-bottom">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-end gap-1.5 sm:gap-2 bg-gray-100 rounded-3xl px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200/50 focus-within:bg-white focus-within:border-[#007AFF]/30 focus-within:shadow-sm transition-all">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            className="flex-1 bg-transparent border-0 resize-none outline-none text-sm sm:text-[15px] text-gray-900 placeholder:text-gray-400 min-h-[20px] max-h-[120px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            rows={1}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!content.trim() || isSending}
            className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              content.trim() && !isSending
                ? 'bg-[#007AFF] text-white shadow-md hover:bg-[#0051D5] active:scale-95'
                : 'bg-gray-300 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  )
}
