import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendProviderIncompleteProfileReminder,
  sendCoupleIncompleteProfileReminder,
  sendPendingRequestsReminder,
  sendInactivityReminder,
  sendProviderLowCompletionReminder,
} from '@/lib/email/sequences'
import { getProviderProfileCompletion } from '@/lib/profile/completion'
import { logger } from '@/lib/logger'

const CRON_SECRET = process.env.CRON_SECRET

const LOW_COMPLETION_DELAYS_DAYS: Record<1 | 2 | 3, number> = {
  1: 0,
  2: 2,
  3: 3,
}

/**
 * API Cron pour envoyer les séquences d'emails automatiques
 * Doit être appelé quotidiennement (via Vercel Cron, GitHub Actions, etc.)
 *
 * Séquences gérées:
 * - Relance profil incomplet prestataires (J+1, J+3, J+7)
 * - Relance profil incomplet couples (J+1, J+3, J+7)
 * - Rappel demandes en attente (prestataires)
 * - Relance inactivité (14 jours)
 * - Séquence profil < 70% prestataires (J+2, J+4, J+7)
 */
export async function POST(request: NextRequest) {
  // Vérification du secret
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const now = new Date()
  const stats = {
    providerIncomplete: 0,
    coupleIncomplete: 0,
    pendingRequests: 0,
    inactivity: 0,
    providerLowCompletion: 0,
    errors: 0,
  }

  try {
    // ========================================================================
    // 1. RELANCES PROFILS INCOMPLETS - PRESTATAIRES
    // ========================================================================
    const { data: incompleteProviders } = await adminClient
      .from('profiles')
      .select(`
        id, email, prenom, created_at,
        prestataire_profiles!inner(nom_entreprise, type_prestation, description)
      `)
      .eq('role', 'prestataire')
      .eq('onboarding_completed', false)

    for (const provider of incompleteProviders || []) {
      const daysSinceCreation = Math.floor(
        (now.getTime() - new Date(provider.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Déterminer quel rappel envoyer
      let reminderToSend: 1 | 2 | 3 | null = null
      if (daysSinceCreation === 1) reminderToSend = 1
      else if (daysSinceCreation === 3) reminderToSend = 2
      else if (daysSinceCreation === 7) reminderToSend = 3

      if (reminderToSend) {
        // Vérifier si on n'a pas déjà envoyé ce rappel
        const { data: existingLog } = await adminClient
          .from('email_logs')
          .select('id')
          .eq('user_id', provider.id)
          .eq('email_type', 'provider_incomplete_profile')
          .eq('reminder_number', reminderToSend)
          .single()

        if (!existingLog) {
          const result = await sendProviderIncompleteProfileReminder(provider.id, reminderToSend)
          if (result.success) stats.providerIncomplete++
          else stats.errors++
        }
      }
    }

    // ========================================================================
    // 2. RELANCES PROFILS INCOMPLETS - COUPLES
    // ========================================================================
    const { data: incompleteCouples } = await adminClient
      .from('profiles')
      .select(`
        id, email, prenom, created_at,
        couple_profiles!inner(date_marriage, ville_marriage, budget_min)
      `)
      .eq('role', 'couple')
      .eq('onboarding_completed', false)

    for (const couple of incompleteCouples || []) {
      const daysSinceCreation = Math.floor(
        (now.getTime() - new Date(couple.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      let reminderToSend: 1 | 2 | 3 | null = null
      if (daysSinceCreation === 1) reminderToSend = 1
      else if (daysSinceCreation === 3) reminderToSend = 2
      else if (daysSinceCreation === 7) reminderToSend = 3

      if (reminderToSend) {
        const { data: existingLog } = await adminClient
          .from('email_logs')
          .select('id')
          .eq('user_id', couple.id)
          .eq('email_type', 'couple_incomplete_profile')
          .eq('reminder_number', reminderToSend)
          .single()

        if (!existingLog) {
          const result = await sendCoupleIncompleteProfileReminder(couple.id, reminderToSend)
          if (result.success) stats.coupleIncomplete++
          else stats.errors++
        }
      }
    }

    // ========================================================================
    // 3. RAPPEL DEMANDES EN ATTENTE (prestataires)
    // ========================================================================
    const { data: providersWithPendingRequests } = await adminClient
      .from('requests')
      .select('provider_id')
      .eq('status', 'pending')
      .gte('created_at', new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()) // 48h max

    // Grouper par prestataire et compter
    const pendingByProvider: Record<string, number> = {}
    for (const req of providersWithPendingRequests || []) {
      pendingByProvider[req.provider_id] = (pendingByProvider[req.provider_id] || 0) + 1
    }

    for (const [providerId, count] of Object.entries(pendingByProvider)) {
      // Vérifier si on n'a pas envoyé de rappel dans les dernières 24h
      const { data: recentLog } = await adminClient
        .from('email_logs')
        .select('id')
        .eq('user_id', providerId)
        .eq('email_type', 'pending_requests_reminder')
        .gte('sent_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .single()

      if (!recentLog) {
        const result = await sendPendingRequestsReminder(providerId, count)
        if (result.success) stats.pendingRequests++
        else stats.errors++
      }
    }

    // ========================================================================
    // 4. RELANCE INACTIVITÉ (14 jours sans connexion)
    // ========================================================================
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: inactiveUsers } = await adminClient
      .from('profiles')
      .select('id, role, prenom, updated_at')
      .lt('updated_at', fourteenDaysAgo)
      .gt('updated_at', thirtyDaysAgo) // Pas plus de 30 jours (probablement abandonné)
      .eq('onboarding_completed', true)

    for (const user of inactiveUsers || []) {
      // Vérifier si on n'a pas envoyé de rappel dans les 7 derniers jours
      const { data: recentLog } = await adminClient
        .from('email_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('email_type', 'inactivity_reminder')
        .gte('sent_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single()

      if (!recentLog && user.role) {
        const result = await sendInactivityReminder(
          user.id,
          user.role as 'couple' | 'prestataire',
          14
        )
        if (result.success) stats.inactivity++
        else stats.errors++
      }
    }

    // ========================================================================
    // 5. SÉQUENCE PROFIL < 70% - PRESTATAIRES (profil faible, tous inscrits)
    // ========================================================================
    // Cible : prestataires onboarding terminé, profil < 70%.
    // Séquence régulière: J+2, J+4, J+7 (basée sur la dernière relance envoyée).
    const { data: onboardedProviders } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'prestataire')
      .eq('onboarding_completed', true)

    for (const provider of onboardedProviders || []) {
      // Calculer la complétion réelle du profil
      const completion = await getProviderProfileCompletion(adminClient, provider.id)
      if (!completion || completion.percentage >= 70) continue

      const { data: lastLog } = await adminClient
        .from('email_logs')
        .select('reminder_number, sent_at')
        .eq('user_id', provider.id)
        .eq('email_type', 'provider_low_completion')
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const lastReminderNumber = (lastLog?.reminder_number || 0) as 0 | 1 | 2 | 3
      if (lastReminderNumber >= 3) continue

      const nextReminderNumber = (lastReminderNumber + 1) as 1 | 2 | 3
      const delayDays = LOW_COMPLETION_DELAYS_DAYS[nextReminderNumber]

      if (lastLog?.sent_at) {
        const daysSinceLast = Math.floor(
          (now.getTime() - new Date(lastLog.sent_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceLast < delayDays) continue
      }

      const result = await sendProviderLowCompletionReminder(
        provider.id,
        nextReminderNumber,
        completion.percentage,
        completion.missingItems
      )
      if (result.success) stats.providerLowCompletion++
      else stats.errors++
    }

    logger.info('Cron email sequences terminé', stats)

    return NextResponse.json({
      success: true,
      stats,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    logger.error('Erreur cron email sequences:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Permettre aussi GET pour tests manuels (en dev uniquement)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 })
  }
  return POST(request)
}
