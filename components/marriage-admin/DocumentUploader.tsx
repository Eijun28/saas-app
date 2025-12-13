'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react'

interface DocumentUploaderProps {
  document: {
    id: string
    label: string
    description: string
  }
  marriageFileId: string
  onSuccess: () => void
  onClose: () => void
}

export function DocumentUploader({ 
  document, 
  marriageFileId, 
  onSuccess, 
  onClose 
}: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Vérifications
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (selectedFile.size > maxSize) {
        setError('Fichier trop volumineux (max 10MB)')
        return
      }

      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ]
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Format non supporté (PDF, JPG, PNG uniquement)')
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // Récupère l'utilisateur
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Prépare le FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('marriageFileId', marriageFileId)
      formData.append('documentType', document.id)
      formData.append('userId', user.id)

      // Appelle l'API
      const response = await fetch('/api/marriage-admin/upload-document', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur upload')
      }

      console.log('✅ Document uploadé:', result.data)

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1500)

    } catch (err: any) {
      console.error('❌ Erreur upload:', err)
      setError(err.message || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Uploader un document</DialogTitle>
          <DialogDescription>
            {document.label} - {document.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zone de drop */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-rose-600 transition-colors">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={uploading || success}
            />

            <label 
              htmlFor="file-upload" 
              className="cursor-pointer block"
            >
              {file ? (
                <div className="space-y-2">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {!success && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        setFile(null)
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Changer
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="font-medium">Cliquez ou glissez un fichier</p>
                  <p className="text-sm text-muted-foreground">
                    PDF, JPG, PNG (max 10MB)
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Succès */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Document uploadé avec succès !
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={uploading}
            >
              Annuler
            </Button>

            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700"
              onClick={handleUpload}
              disabled={!file || uploading || success}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Upload...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Uploadé
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

