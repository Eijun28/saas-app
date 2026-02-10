'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerId: string
  providerName: string
  coupleId: string
  requestId?: string
  existingReview?: { rating: number; comment: string | null }
  onSubmitted?: () => void
}

export function ReviewDialog({
  open,
  onOpenChange,
  providerId,
  providerName,
  coupleId,
  requestId,
  existingReview,
  onSubmitted,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!existingReview

  async function handleSubmit() {
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note')
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()

      const reviewData = {
        couple_id: coupleId,
        provider_id: providerId,
        request_id: requestId || null,
        rating,
        comment: comment.trim() || null,
      }

      const { error } = await supabase
        .from('reviews')
        .upsert(reviewData, { onConflict: 'couple_id,provider_id' })

      if (error) throw error

      toast.success(isEditing ? 'Avis modifié' : 'Avis publié, merci !')
      onOpenChange(false)
      onSubmitted?.()
    } catch (error: any) {
      console.error('Erreur publication avis:', error)
      toast.error(error?.message || 'Erreur lors de la publication')
    } finally {
      setIsSaving(false)
    }
  }

  const ratingLabels = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent']
  const displayRating = hoveredRating || rating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier votre avis' : 'Laisser un avis'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {providerName}
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Étoiles */}
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      star <= displayRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <p className="text-sm font-medium text-amber-600">
                {ratingLabels[displayRating]}
              </p>
            )}
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Textarea
              placeholder="Partagez votre expérience (facultatif)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Actions */}
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
              disabled={isSaving || rating === 0}
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
