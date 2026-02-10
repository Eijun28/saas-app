'use client'

import { useEffect, useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  couple_prenom: string | null
}

interface ReviewsListProps {
  providerId: string
  className?: string
  limit?: number
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-3.5 w-3.5',
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
          )}
        />
      ))}
    </div>
  )
}

export function ReviewsList({ providerId, className, limit }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<{ average: number; count: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [reviewsResult, statsResult] = await Promise.all([
        supabase
          .from('reviews')
          .select('id, rating, comment, created_at, couple_id')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false })
          .limit(limit || 50),
        supabase
          .from('prestataire_public_profiles')
          .select('rating, total_reviews')
          .eq('profile_id', providerId)
          .maybeSingle(),
      ])

      if (reviewsResult.data && reviewsResult.data.length > 0) {
        // Charger les prénoms des couples
        const coupleIds = reviewsResult.data.map(r => r.couple_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, prenom')
          .in('id', coupleIds)

        const profileMap = new Map(profiles?.map(p => [p.id, p.prenom]) || [])

        setReviews(reviewsResult.data.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          couple_prenom: profileMap.get(r.couple_id) || null,
        })))
      }

      if (statsResult.data) {
        setStats({
          average: Number(statsResult.data.rating) || 0,
          count: statsResult.data.total_reviews || 0,
        })
      }

      setLoading(false)
    }

    load()
  }, [providerId, limit])

  if (loading) {
    return (
      <div className={cn('animate-pulse space-y-3', className)}>
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-16 bg-gray-100 rounded-xl" />
        <div className="h-16 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!stats || stats.count === 0) {
    return (
      <div className={cn('text-center py-6', className)}>
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <MessageSquare className="h-5 w-5 text-gray-300" />
        </div>
        <p className="text-sm text-gray-500">Aucun avis pour le moment</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Résumé */}
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-gray-900">{stats.average.toFixed(1)}</span>
          <span className="text-sm text-gray-400">/5</span>
        </div>
        <div>
          <StarRating rating={Math.round(stats.average)} />
          <p className="text-xs text-gray-500 mt-0.5">{stats.count} avis</p>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-[#823F91]/10 text-[#823F91] text-xs font-semibold">
                    {(review.couple_prenom || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">
                  {review.couple_prenom || 'Anonyme'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} />
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
