import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { createClient } from '@/lib/supabase/server'
import { chatbotLimiter, getClientIp } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error-handler'
import { logger } from '@/lib/logger'
import { buildWeddingAdvisorSystemPrompt } from '@/lib/chatbot/wedding-advisor-prompt'
import type { CulturalPreferences } from '@/types/couples.types'

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

function fixUtf8Encoding(text: string): string {
  if (!text || typeof text !== 'string') return text
  try {
    let fixed = text
    fixed = fixed.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    )
    if (/Ã[\x80-\xBF©«®±²³µ¶¹»¼½¾¿]/.test(fixed)) {
      try {
        const bytes = new Uint8Array([...fixed].map(c => c.charCodeAt(0)))
        const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
        if (decoded && !decoded.includes('\uFFFD')) fixed = decoded
      } catch {
        // pas du double-encodage
      }
    }
    fixed = fixed.normalize('NFC')
    if (fixed.includes('\uFFFD')) fixed = fixed.replace(/\uFFFD/g, '')
    return fixed
  } catch {
    return text
  }
}

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

    const { messages } = body

    if (!Array.isArray(messages) || messages.length === 0) {
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

    // Construire le contexte enrichi pour le prompt
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

    // Convertir les messages au format OpenAI
    const openaiMessages: ChatCompletionMessageParam[] = messages
      .filter(msg => msg?.content && typeof msg.content === 'string')
      .map(msg => ({
        role: (msg.role === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: String(msg.content).trim(),
      }))
      .filter(msg => (msg.content as string).length > 0)

    if (openaiMessages.length === 0) {
      return NextResponse.json({ error: 'Aucun message valide' }, { status: 400 })
    }

    let response
    try {
      response = await getOpenAI().chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'system', content: systemPrompt }, ...openaiMessages],
        temperature: 0.5,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      })
    } catch (openaiError: unknown) {
      logger.error('Erreur OpenAI wedding-advisor:', openaiError)
      return NextResponse.json(
        {
          error: 'Erreur service IA',
          message: 'Le service IA est temporairement indisponible. Veuillez réessayer.',
        },
        { status: 503 }
      )
    }

    const rawContent = response.choices[0]?.message?.content
    if (!rawContent) {
      return NextResponse.json(
        { error: 'Réponse vide', message: 'Je n\'ai pas pu générer de réponse. Pouvez-vous reformuler ?' },
        { status: 500 }
      )
    }

    const fixedContent = fixUtf8Encoding(rawContent)

    let parsed: { message?: string; suggestions?: unknown; next_action?: string }
    try {
      let cleaned = fixedContent.trim()
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
      cleaned = cleaned.normalize('NFC')
      parsed = JSON.parse(cleaned)
    } catch {
      const fallback = fixedContent.match(/"message"\s*:\s*"([^"]+)"/)?.[1]
      return NextResponse.json(
        { message: fallback ? fixUtf8Encoding(fallback) : 'Pouvez-vous reformuler ?', suggestions: [], next_action: 'continue' },
        { status: 200 }
      )
    }

    // Normaliser la réponse
    const message =
      typeof parsed.message === 'string' && parsed.message.trim()
        ? fixUtf8Encoding(parsed.message).normalize('NFC').substring(0, 500)
        : 'Comment puis-je vous aider ?'

    const suggestions = Array.isArray(parsed.suggestions)
      ? (parsed.suggestions as unknown[])
          .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
          .map(s => s.normalize('NFC').trim())
          .slice(0, 4)
      : []

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
  } catch (error: unknown) {
    logger.error('Wedding advisor API error:', error)
    return handleApiError(error)
  }
}
