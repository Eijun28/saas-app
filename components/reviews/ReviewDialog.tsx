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

interface SubRatings {
  rating_quality: number
  rating_communication: number
  rating_value: number
  rating_punctuality: number
}

interface ExistingReview {
  rating: number
  comment: string | null
  rating_quality?: number | null
  rating_communication?: number | null
  rating_value?: number | null
  rating_punctuality?: number | null
}

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerId: string
  providerName: string
  coupleId: string
  requestId?: string
  existingReview?: ExistingReview
  onSubmitted?: () => void
}

const SUB_CRITERIA = [
  { key: 'rating_quality' as const, label: 'Qualite du service', emoji: '✨' },
  { key: 'rating_communication' as const, label: 'Communication', emoji: '💬' },
  { key: 'rating_value' as const, label: 'Rapport qualite-prix', emoji: '💰' },
  { key: 'rating_punctuality' as const, label: 'Ponctualite', emoji: '⏰' },
]

function MiniStarRating({
  value,
  onChange,
  label,
  emoji,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  emoji: string
}) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-600 flex items-center gap-1.5">
        <span>{emoji}</span>
        {label}
      </span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'h-5 w-5 transition-colors',
                s <= display ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
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
  const [subRatings, setSubRatings] = useState<SubRatings>({
    rating_quality: existingReview?.rating_quality || 0,
    rating_communication: existingReview?.rating_communication || 0,
    rating_value: existingReview?.rating_value || 0,
    rating_punctuality: existingReview?.rating_punctuality || 0,
  })
  const [showSubRatings, setShowSubRatings] = useState(
    !!(existingReview?.rating_quality || existingReview?.rating_communication || existingReview?.rating_value || existingReview?.rating_punctuality)
  )
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = !!existingReview

  const updateSubRating = (key: keyof SubRatings, value: number) => {
    setSubRatings(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (rating === 0) {
      toast.error('Veuillez selectionner une note')
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()

      const reviewData: Record<string, unknown> = {
        couple_id: coupleId,
        provider_id: providerId,
        request_id: requestId || null,
        rating,
        comment: comment.trim() || null,
      }

      // Add sub-ratings only if the user expanded and filled them
      if (showSubRatings) {
        if (subRatings.rating_quality > 0) reviewData.rating_quality = subRatings.rating_quality
        if (subRatings.rating_communication > 0) reviewData.rating_communication = subRatings.rating_communication
        if (subRatings.rating_value > 0) reviewData.rating_value = subRatings.rating_value
        if (subRatings.rating_punctuality > 0) reviewData.rating_punctuality = subRatings.rating_punctuality
      }

      const { error } = await supabase
        .from('reviews')
        .upsert(reviewData, { onConflict: 'couple_id,provider_id' })

      if (error) throw error

      toast.success(isEditing ? 'Avis modifie' : 'Avis publie, merci !')
      onOpenChange(false)
      onSubmitted?.()
    } catch (error: any) {
      console.error('Erreur publication avis:', error)
      toast.error(error?.message || 'Erreur lors de la publication')
    } finally {
      setIsSaving(false)
    }
  }

  const ratingLabels = ['', 'Decevant', 'Moyen', 'Bien', 'Tres bien', 'Excellent']
  const displayRating = hoveredRating || rating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier votre avis' : 'Laisser un avis'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {providerName}
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Note globale */}
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Note globale</p>
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

          {/* Sous-notes par critère */}
          <div>
            {!showSubRatings ? (
              <button
                type="button"
                onClick={() => setShowSubRatings(true)}
                className="w-full text-center text-xs font-medium text-[#823F91] hover:text-[#6D3478] transition-colors py-2 rounded-lg hover:bg-[#823F91]/5"
              >
                + Noter par critere (facultatif)
              </button>
            ) : (
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Notes detaillees (facultatif)
                </p>
                {SUB_CRITERIA.map((criterion) => (
                  <MiniStarRating
                    key={criterion.key}
                    value={subRatings[criterion.key]}
                    onChange={(v) => updateSubRating(criterion.key, v)}
                    label={criterion.label}
                    emoji={criterion.emoji}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Textarea
              placeholder="Partagez votre experience (facultatif)..."
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
