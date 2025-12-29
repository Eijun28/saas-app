import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { apiLimiter, getClientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req)
  if (!apiLimiter.check(ip)) {
    logger.warn('Rate limit dépassé pour signout', { ip })
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429, headers: { 'Retry-After': apiLimiter.getResetTime(ip).toString() } }
    )
  }

  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    logger.info('Déconnexion réussie', { ip })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur lors de la déconnexion', error)
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    )
  }
}

