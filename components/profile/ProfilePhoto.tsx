'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { uploadProfilePhoto } from '@/lib/actions/profile'
import { Camera, Loader2 } from 'lucide-react'

type ProfilePhotoProps = {
  photoUrl?: string | null
  name?: string
  onUpdate: () => void
}

export function ProfilePhoto({ photoUrl, name, onUpdate }: ProfilePhotoProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier la taille (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Le fichier est trop volumineux (max 5MB)')
      return
    }

    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Format non supporté (JPG, PNG, WEBP uniquement)')
      return
    }

    // Créer une preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    const formData = new FormData()
    formData.append('photo', file)

    const result = await uploadProfilePhoto(formData)
    setUploading(false)

    if (result.error) {
      // Afficher un message d'erreur plus détaillé
      const errorMessage = result.error.includes('bucket') 
        ? `${result.error}\n\nConsultez SUPABASE_STORAGE_SETUP.md pour les instructions détaillées.`
        : `Erreur: ${result.error}`
      
      alert(errorMessage)
      setPreview(null)
    } else {
      setPreview(null)
      onUpdate()
    }
  }

  const displayPhoto = preview || photoUrl

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
          {displayPhoto && <AvatarImage src={displayPhoto} />}
          <AvatarFallback>{name || 'U'}</AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Modifier la photo
            </>
          )}
        </Button>
        <p className="text-xs text-[#6B7280] text-center max-w-xs">
          JPG, PNG ou WEBP • Max 5MB
        </p>
      </div>
    </div>
  )
}

