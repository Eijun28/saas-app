'use client'

import { useState } from 'react'
import Image from 'next/image'
import { File, Download, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { Attachment } from '@/types/messages'

interface AttachmentPreviewProps {
  attachments: Attachment[]
  onRemove?: (index: number) => void
  canRemove?: boolean
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function AttachmentPreview({ 
  attachments, 
  onRemove, 
  canRemove = false 
}: AttachmentPreviewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDownload = async (attachment: Attachment) => {
    setLoading(attachment.url)
    try {
      const response = await fetch(attachment.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur téléchargement:', error)
    } finally {
      setLoading(null)
    }
  }

  if (attachments.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((attachment, index) => {
          const isImage = ALLOWED_IMAGE_TYPES.includes(attachment.type)
          
          return (
            <div
              key={index}
              className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:border-[#823F91] transition-colors"
            >
              {isImage ? (
                <div 
                  className="relative w-24 h-24 cursor-pointer"
                  onClick={() => setSelectedImage(attachment.url)}
                >
                  <Image
                    src={attachment.url}
                    alt={attachment.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="h-5 w-5 text-white drop-shadow-lg" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 flex items-center gap-2 min-w-[140px] max-w-[200px]">
                  <File className="h-6 w-6 text-[#823F91] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate" title={attachment.name}>
                      {attachment.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => handleDownload(attachment)}
                    disabled={loading === attachment.url}
                  >
                    {loading === attachment.url ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
              
              {canRemove && onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  aria-label="Retirer le fichier"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Dialog pour afficher l'image en grand */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedImage && (
            <div className="relative w-full h-[80vh]">
              <Image
                src={selectedImage}
                alt="Aperçu"
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
