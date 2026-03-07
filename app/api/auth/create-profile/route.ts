import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { role } = await request.json()

    if (role !== 'couple' && role !== 'prestataire') {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    if (role === 'couple') {
      const fullName = [
        user.user_metadata?.full_name,
        user.user_metadata?.name,
      ].find(Boolean) || ''

      const { error } = await adminClient
        .from('couples')
        .upsert({
          id: user.id,
          user_id: user.id,
          email: user.email || '',
          partner_1_name: fullName || null,
          partner_2_name: null,
        }, { onConflict: 'user_id' })

      if (error) {
        logger.error('Erreur création profil couple (onboarding):', error)
        return NextResponse.json({ error: 'Erreur lors de la création du profil' }, { status: 500 })
      }

      await adminClient
        .from('couple_preferences')
        .upsert({
          couple_id: user.id,
          languages: ['français'],
          essential_services: [],
          optional_services: [],
          cultural_preferences: {},
          service_priorities: {},
          budget_breakdown: {},
          profile_completed: false,
          completion_percentage: 0,
          onboarding_step: 0,
        }, { onConflict: 'couple_id' })

      logger.info('✅ Profil couple créé (onboarding/role)', { userId: user.id })
    } else {
      const nameParts = (user.user_metadata?.full_name || user.user_metadata?.name || '').split(' ')
      const prenom = nameParts[0] || null
      const nom = nameParts.slice(1).join(' ') || null

      const { error } = await adminClient
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          role: 'prestataire',
          prenom,
          nom,
          nom_entreprise: null,
        }, { onConflict: 'id' })

      if (error) {
        logger.error('Erreur création profil prestataire (onboarding):', error)
        return NextResponse.json({ error: 'Erreur lors de la création du profil' }, { status: 500 })
      }

      logger.info('✅ Profil prestataire créé (onboarding/role)', { userId: user.id })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    logger.error('Erreur inattendue create-profile:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
