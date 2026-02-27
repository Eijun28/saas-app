'use client'

import { useEffect, useState } from 'react'
import { Star, MessageSquare, ThumbsUp, CornerDownRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  couple_prenom: string | null
  provider_response: string | null
  provider_response_at: string | null
  helpful_count: number
  is_verified: boolean
  rating_quality: number | null
  rating_communication: number | null
  rating_value: number | null
  rating_punctuality: number | null
}

interface ReviewsListProps {
  providerId: string
  className?: string
  limit?: number
}

type SortMode = 'recent' | 'rating_high' | 'rating_low' | 'helpful'
type FilterMode = 'all' | '5' | '4' | '3' | '2' | '1'

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'xs' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-3 w-3',
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
          )}
        />
      ))}
    </div>
  )
}

function SubRatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-gray-500 w-28 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-gray-600 font-medium w-4 text-right">{value}</span>
    </div>
  )
}

function RatingDistribution({ reviews }: { reviews: Review[] }) {
  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
  }))
  const maxCount = Math.max(...distribution.map(d => d.count), 1)

  return (
    <div className="space-y-1">
      {distribution.map(({ stars, count }) => (
        <div key={stars} className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 w-3 text-right">{stars}</span>
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
          </div>
          <span className="text-gray-400 w-5 text-right">{count}</span>
        </div>
      ))}
    </div>
  )
}

export function ReviewsList({ providerId, className, limit }: ReviewsListProps) {
  const { user } = useUser()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<{ average: number; count: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [votedReviews, setVotedReviews] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [reviewsResult, statsResult] = await Promise.all([
        supabase
          .from('reviews')
          .select('id, rating, comment, created_at, couple_id, provider_response, provider_response_at, helpful_count, is_verified, rating_quality, rating_communication, rating_value, rating_punctuality')
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
        const coupleIds = reviewsResult.data.map((r: any) => r.couple_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, prenom')
          .in('id', coupleIds)

        const profileMap = new Map(profiles?.map((p: any) => [p.id, p.prenom]) || [])

        setReviews(reviewsResult.data.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          couple_prenom: profileMap.get(r.couple_id) || null,
          provider_response: r.provider_response || null,
          provider_response_at: r.provider_response_at || null,
          helpful_count: r.helpful_count || 0,
          is_verified: r.is_verified || false,
          rating_quality: r.rating_quality,
          rating_communication: r.rating_communication,
          rating_value: r.rating_value,
          rating_punctuality: r.rating_punctuality,
        })))

        // Check which reviews user has already voted helpful
        if (user) {
          const reviewIds = reviewsResult.data.map((r: any) => r.id)
          const { data: votes } = await supabase
            .from('review_helpful_votes')
            .select('review_id')
            .eq('user_id', user.id)
            .in('review_id', reviewIds)
          if (votes) {
            setVotedReviews(new Set(votes.map((v: any) => v.review_id)))
          }
        }
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
  }, [providerId, limit, user])

  const toggleHelpful = async (reviewId: string) => {
    if (!user) return
    const supabase = createClient()
    const hasVoted = votedReviews.has(reviewId)

    try {
      if (hasVoted) {
        await supabase
          .from('review_helpful_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id)
        setVotedReviews(prev => {
          const next = new Set(prev)
          next.delete(reviewId)
          return next
        })
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful_count: Math.max(0, r.helpful_count - 1) } : r))
      } else {
        await supabase
          .from('review_helpful_votes')
          .insert({ review_id: reviewId, user_id: user.id })
        setVotedReviews(prev => new Set([...prev, reviewId]))
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r))
      }
    } catch (err) {
      console.error('Vote helpful error:', err)
    }
  }

  // Apply sort and filter
  const filteredReviews = reviews
    .filter(r => filterMode === 'all' || r.rating === Number(filterMode))
    .sort((a, b) => {
      if (sortMode === 'rating_high') return b.rating - a.rating
      if (sortMode === 'rating_low') return a.rating - b.rating
      if (sortMode === 'helpful') return b.helpful_count - a.helpful_count
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Compute average sub-ratings
  const subRatingAverages = (() => {
    const withQuality = reviews.filter(r => r.rating_quality)
    const withComm = reviews.filter(r => r.rating_communication)
    const withValue = reviews.filter(r => r.rating_value)
    const withPunct = reviews.filter(r => r.rating_punctuality)
    return {
      quality: withQuality.length > 0 ? Math.round(withQuality.reduce((s, r) => s + (r.rating_quality || 0), 0) / withQuality.length * 10) / 10 : 0,
      communication: withComm.length > 0 ? Math.round(withComm.reduce((s, r) => s + (r.rating_communication || 0), 0) / withComm.length * 10) / 10 : 0,
      value: withValue.length > 0 ? Math.round(withValue.reduce((s, r) => s + (r.rating_value || 0), 0) / withValue.length * 10) / 10 : 0,
      punctuality: withPunct.length > 0 ? Math.round(withPunct.reduce((s, r) => s + (r.rating_punctuality || 0), 0) / withPunct.length * 10) / 10 : 0,
    }
  })()
  const hasSubRatings = subRatingAverages.quality > 0 || subRatingAverages.communication > 0

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
      {/* Summary header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
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

        {/* Rating distribution */}
        <div className="flex-1 max-w-[220px]">
          <RatingDistribution reviews={reviews} />
        </div>
      </div>

      {/* Sub-ratings averages */}
      {hasSubRatings && (
        <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1.5">
          {subRatingAverages.quality > 0 && <SubRatingBar label="Qualite" value={subRatingAverages.quality} />}
          {subRatingAverages.communication > 0 && <SubRatingBar label="Communication" value={subRatingAverages.communication} />}
          {subRatingAverages.value > 0 && <SubRatingBar label="Rapport Q/P" value={subRatingAverages.value} />}
          {subRatingAverages.punctuality > 0 && <SubRatingBar label="Ponctualite" value={subRatingAverages.punctuality} />}
        </div>
      )}

      {/* Sort and filter controls */}
      {reviews.length > 2 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter by rating */}
          <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-full">
            {(['all', '5', '4', '3', '2', '1'] as FilterMode[]).map(f => (
              <button
                key={f}
                onClick={() => setFilterMode(f)}
                className={cn(
                  'px-2 py-1 rounded-full text-[11px] font-medium transition-all',
                  filterMode === f
                    ? 'bg-[#823F91] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {f === 'all' ? 'Tous' : `${f}\u2605`}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="text-[11px] text-gray-500 bg-transparent border border-gray-200 rounded-full px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#823F91]/30"
          >
            <option value="recent">Plus recents</option>
            <option value="rating_high">Meilleure note</option>
            <option value="rating_low">Note la plus basse</option>
            <option value="helpful">Plus utiles</option>
          </select>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun avis avec ce filtre</p>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
              {/* Review header */}
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
                  {review.is_verified && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                      Verifie
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Sub-ratings inline */}
              {(review.rating_quality || review.rating_communication || review.rating_value || review.rating_punctuality) && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {review.rating_quality && (
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      Qualite {review.rating_quality}/5
                    </span>
                  )}
                  {review.rating_communication && (
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      Communication {review.rating_communication}/5
                    </span>
                  )}
                  {review.rating_value && (
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      Rapport Q/P {review.rating_value}/5
                    </span>
                  )}
                  {review.rating_punctuality && (
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      Ponctualite {review.rating_punctuality}/5
                    </span>
                  )}
                </div>
              )}

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
              )}

              {/* Provider response */}
              {review.provider_response && (
                <div className="mt-2.5 ml-4 p-2.5 bg-[#823F91]/5 rounded-lg border border-[#823F91]/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CornerDownRight className="h-3 w-3 text-[#823F91]" />
                    <span className="text-[11px] font-semibold text-[#823F91]">Reponse du prestataire</span>
                    {review.provider_response_at && (
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {new Date(review.provider_response_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{review.provider_response}</p>
                </div>
              )}

              {/* Helpful button */}
              <div className="mt-2 flex items-center">
                <button
                  onClick={() => toggleHelpful(review.id)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all',
                    votedReviews.has(review.id)
                      ? 'bg-[#823F91]/10 text-[#823F91]'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <ThumbsUp className={cn('h-3 w-3', votedReviews.has(review.id) && 'fill-current')} />
                  Utile{review.helpful_count > 0 && ` (${review.helpful_count})`}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
