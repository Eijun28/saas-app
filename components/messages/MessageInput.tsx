'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { sendMessage, uploadAttachment, validateFile } from '@/lib/supabase/messages'
import type { MessageInputProps, Attachment } from '@/types/messages'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

export function MessageInput({
  conversationId,
  senderId,
  senderType,
  onMessageSent,
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<Array<{ file: File; preview: string }>>([])
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  // Générer les previews pour les images
  useEffect(() => {
    const newPreviews: Array<{ file: File; preview: string }> = []
    
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          newPreviews.push({
            file,
            preview: e.target?.result as string,
          })
          if (newPreviews.length === files.filter(f => f.type.startsWith('image/')).length) {
            setPreviews(newPreviews)
          }
        }
        reader.readAsDataURL(file)
      }
    })

    if (files.filter(f => f.type.startsWith('image/')).length === 0) {
      setPreviews([])
    }
  }, [files])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    selectedFiles.forEach((file) => {
      const validation = validateFile(file)
      if (!validation.valid) {
        toast({
          title: 'Erreur',
          description: validation.error,
          variant: 'destructive',
        })
        return
      }
    })

    setFiles((prev) => [...prev, ...selectedFiles])
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if ((!message.trim() && files.length === 0) || isSending) return

    setIsSending(true)

    try {
      // Upload fichiers si présents
      let attachments: Attachment[] = []
      if (files.length > 0) {
        const uploadPromises = files.map((file) => uploadAttachment(file))
        attachments = await Promise.all(uploadPromises)
      }

      // Envoyer le message
      await sendMessage(
        conversationId,
        senderId,
        senderType,
        message.trim() || '📎 Fichier joint',
        attachments.length > 0 ? attachments : undefined
      )

      // Réinitialiser
      setMessage('')
      setFiles([])
      setPreviews([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      onMessageSent()
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer le message',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Previews des fichiers */}
      {previews.length > 0 && (
        <div className="mb-3 flex gap-2 flex-wrap">
          {previews.map((preview, idx) => (
            <div key={idx} className="relative group">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={preview.preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Liste des fichiers non-images */}
      {files.filter(f => !f.type.startsWith('image/')).length > 0 && (
        <div className="mb-3 flex gap-2 flex-wrap">
          {files
            .filter((f) => !f.type.startsWith('image/'))
            .map((file, idx) => {
              const fileIndex = files.indexOf(file)
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                >
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 truncate max-w-[150px]">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(fileIndex)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
        </div>
      )}

      {/* Input zone */}
      <div className="flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tapez votre message... (Shift+Enter pour une nouvelle ligne)"
          className="resize-none min-h-[44px] max-h-[120px]"
          disabled={isSending}
        />

        <Button
          onClick={handleSend}
          disabled={(!message.trim() && files.length === 0) || isSending}
          className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] hover:from-[#6D3478] hover:to-[#823F91] text-white flex-shrink-0"
        >
          {isSending ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}

