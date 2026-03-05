import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { chatbotLimiter, getClientIp } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error-handler'
import { logger } from '@/lib/logger'
import { buildWeddingAdvisorSystemPrompt } from '@/lib/chatbot/wedding-advisor-prompt'
import type { CulturalPreferences } from '@/types/couples.types'
import { sanitizeChatMessages } from '@/lib/security'

const WeddingAdvisorResponseSchema = z.object({
  message: z.string().describe('La réponse du conseiller mariage (max 500 caractères)'),
  suggestions: z.array(z.string()).max(4).describe('2-4 suggestions de réponse rapide'),
})

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)

    if (!chatbotLimiter.check(clientIp)) {
      const resetTime = chatbotLimiter.getResetTime(clientIp)
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter.', retryAfter: resetTime },
        { status: 429, headers: { 'Retry-After': resetTime.toString() } }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible' },
        { status: 503 }
      )
    }

    let body: { messages: { role: string; content: string }[] }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Format de requête invalide' }, { status: 400 })
    }

    // Validation et sanitization des messages (protection prompt injection)
    const messages = sanitizeChatMessages(body.messages)
    if (!messages) {
      return NextResponse.json({ error: 'Messages invalides' }, { status: 400 })
    }

    // Récupérer le couple authentifié côté serveur
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Charger le profil couple + préférences en parallèle avec les demandes
    const [coupleResult, demandesResult] = await Promise.all([
      supabase
        .from('couples')
        .select('*, preferences:couple_preferences(*)')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('demandes')
        .select('service_type')
        .eq('couple_id', user.id),
    ])

    const couple = coupleResult.data
    const rawDemandes = (demandesResult.data ?? []) as Array<{ service_type: string | null }>

    const culturalPrefs = couple?.preferences?.cultural_preferences as CulturalPreferences | null

    const serviceTypesRequested: string[] = Array.from(
      new Set(
        rawDemandes
          .map(d => d.service_type)
          .filter((t): t is string => typeof t === 'string' && t.length > 0)
      )
    )

    const systemPrompt = buildWeddingAdvisorSystemPrompt({
      partner_1_name: couple?.partner_1_name ?? null,
      partner_2_name: couple?.partner_2_name ?? null,
      wedding_date: couple?.wedding_date ?? null,
      wedding_location: couple?.wedding_location ?? null,
      guest_count: couple?.guest_count ?? null,
      budget_min: couple?.budget_min ?? null,
      budget_max: couple?.budget_max ?? null,
      cultural_preferences: culturalPrefs,
      essential_services: couple?.preferences?.essential_services ?? [],
      optional_services: couple?.preferences?.optional_services ?? [],
      wedding_description: couple?.preferences?.wedding_description ?? null,
      service_types_requested: serviceTypesRequested,
      demandes_count: rawDemandes.length,
    })

    try {
      const { object } = await generateObject({
        model: openai('gpt-4o'),
        system: systemPrompt,
        messages,
        schema: WeddingAdvisorResponseSchema,
        temperature: 0.5,
        maxOutputTokens: 400,
      })

      const message = object.message.normalize('NFC').substring(0, 500)
      const suggestions = object.suggestions
        .filter(s => s.trim().length > 0)
        .map(s => s.normalize('NFC').trim())
        .slice(0, 4)

      return NextResponse.json(
        { message, suggestions, next_action: 'continue' },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      )
    } catch (aiError: unknown) {
      logger.error('Erreur AI wedding-advisor:', aiError)
      return NextResponse.json(
        {
          error: 'Erreur service IA',
          message: 'Le service IA est temporairement indisponible. Veuillez réessayer.',
        },
        { status: 503 }
      )
    }
  } catch (error: unknown) {
    logger.error('Wedding advisor API error:', error)
    return handleApiError(error)
  }
}
