'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Star,
  MessageSquare,
  TrendingUp,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageTitle } from '@/components/prestataire/shared/PageTitle'

interface Review {
  id: string
  couple_id: string
  provider_id: string
  demande_id: string | null
  rating: number
  comment: string | null
  rating_quality: number | null
  rating_communication: number | null
  rating_value: number | null
  rating_punctuality: number | null
  provider_response: string | null
  created_at: string
  couple_name?: string
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function MesAvisPage() {
  const { user } = useUser()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) loadReviews()
  }, [user])

  const loadReviews = async () => {
    if (!user) return
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement avis:', error)
      setLoading(false)
      return
    }

    if (!data?.length) {
      setReviews([])
      setLoading(false)
      return
    }

    // Fetch couple names
    const coupleIds = [...new Set(data.map(r => r.couple_id))]
    const { data: couples } = await supabase
      .from('couples')
      .select('user_id, partner_1_name, partner_2_name')
      .in('user_id', coupleIds)

    const coupleMap = new Map(
      couples?.map(c => {
        const name = [c.partner_1_name, c.partner_2_name].filter(Boolean).join(' & ') || 'Un couple'
        return [c.user_id, name]
      }) ?? []
    )

    setReviews(
      data.map(r => ({
        ...r,
        couple_name: coupleMap.get(r.couple_id) || 'Un couple',
      }))
    )
    setLoading(false)
  }

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim() || !user) return

    setSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('reviews')
      .update({ provider_response: responseText.trim() })
      .eq('id', reviewId)
      .eq('provider_id', user.id)

    if (error) {
      toast.error('Erreur lors de l\'envoi de la réponse')
      setSubmitting(false)
      return
    }

    toast.success('Réponse publiée')
    setRespondingTo(null)
    setResponseText('')
    setSubmitting(false)
    loadReviews()
  }

  // Stats
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100
      : 0,
  }))

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <PageTitle title="Mes avis" description="Consultez et répondez aux avis de vos clients" />

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <p className="text-xs font-medium text-gray-500 mb-1">Note moyenne</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-gray-900">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </p>
            {avgRating > 0 && <StarRating rating={Math.round(avgRating)} size="lg" />}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <p className="text-xs font-medium text-gray-500 mb-1">Total avis</p>
          <p className="text-3xl font-bold text-[#823F91]">{reviews.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <p className="text-xs font-medium text-gray-500 mb-2">Répartition</p>
          <div className="space-y-1">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-3">{star}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
              <Star className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium mb-1">Aucun avis pour le moment</p>
            <p className="text-sm text-gray-400">
              Les avis de vos clients apparaîtront ici une fois leurs prestations terminées.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="border-gray-100 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#823F91]/10 text-[#823F91] text-sm font-semibold">
                          {(review.couple_name || 'C').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{review.couple_name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>

                  {/* Sub-ratings */}
                  {(review.rating_quality || review.rating_communication || review.rating_value || review.rating_punctuality) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {review.rating_quality && (
                        <Badge variant="secondary" className="text-xs">Qualité: {review.rating_quality}/5</Badge>
                      )}
                      {review.rating_communication && (
                        <Badge variant="secondary" className="text-xs">Communication: {review.rating_communication}/5</Badge>
                      )}
                      {review.rating_value && (
                        <Badge variant="secondary" className="text-xs">Rapport qualité-prix: {review.rating_value}/5</Badge>
                      )}
                      {review.rating_punctuality && (
                        <Badge variant="secondary" className="text-xs">Ponctualité: {review.rating_punctuality}/5</Badge>
                      )}
                    </div>
                  )}

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {review.comment}
                    </p>
                  )}

                  {/* Provider response */}
                  {review.provider_response ? (
                    <div className="bg-[#823F91]/5 rounded-xl p-3 border border-[#823F91]/10">
                      <p className="text-xs font-semibold text-[#823F91] mb-1">Votre réponse</p>
                      <p className="text-sm text-gray-700">{review.provider_response}</p>
                    </div>
                  ) : respondingTo === review.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Rédigez votre réponse..."
                        className="min-h-[80px] text-sm"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setRespondingTo(null); setResponseText('') }}
                        >
                          Annuler
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitResponse(review.id)}
                          disabled={!responseText.trim() || submitting}
                          className="bg-[#823F91] hover:bg-[#6D3478] text-white gap-1.5"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Répondre
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRespondingTo(review.id)}
                      className="text-[#823F91] hover:bg-[#823F91]/5 gap-1.5 mt-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Répondre à cet avis
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
