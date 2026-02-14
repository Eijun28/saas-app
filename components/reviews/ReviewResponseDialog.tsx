'use client'

import { useState } from 'react'
import { CornerDownRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ReviewResponseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewId: string
  coupleName: string
  existingResponse?: string | null
  onSubmitted?: () => void
}

export function ReviewResponseDialog({
  open,
  onOpenChange,
  reviewId,
  coupleName,
  existingResponse,
  onSubmitted,
}: ReviewResponseDialogProps) {
  const [response, setResponse] = useState(existingResponse || '')
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!existingResponse

  async function handleSubmit() {
    if (!response.trim()) {
      toast.error('Veuillez ecrire une reponse')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/prestataire/reviews/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, response: response.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }

      toast.success(isEditing ? 'Reponse modifiee' : 'Reponse publiee')
      onOpenChange(false)
      onSubmitted?.()
    } catch (error: any) {
      console.error('Response error:', error)
      toast.error(error?.message || 'Erreur lors de la publication')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CornerDownRight className="h-4 w-4 text-[#823F91]" />
            {isEditing ? 'Modifier votre reponse' : 'Repondre a l\'avis'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Avis de {coupleName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Textarea
            placeholder="Ecrivez votre reponse professionnelle..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            className="resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {response.length}/500
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !response.trim()}
              className="flex-1 bg-[#823F91] hover:bg-[#6D3478]"
            >
              {isSaving ? 'Publication...' : isEditing ? 'Modifier' : 'Publier'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
