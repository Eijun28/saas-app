import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await request.json()
    const { reviewId, response } = body as { reviewId: string; response: string }

    if (!reviewId || !response?.trim()) {
      return NextResponse.json({ error: 'reviewId et response requis' }, { status: 400 })
    }

    if (response.trim().length > 500) {
      return NextResponse.json({ error: 'Reponse trop longue (max 500 caracteres)' }, { status: 400 })
    }

    // Verify the review belongs to this provider
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('id, provider_id, provider_response')
      .eq('id', reviewId)
      .single()

    if (fetchError || !review) {
      return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 })
    }

    if (review.provider_id !== user.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
    }

    // Update the review with the provider's response
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        provider_response: response.trim(),
        provider_response_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Review respond error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
