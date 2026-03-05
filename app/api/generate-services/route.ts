import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { sanitizeAIInput } from '@/lib/security'
import { buildServiceGeneratorPrompt } from '@/lib/prompts/service-generator'

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — prevent unauthenticated access to OpenAI
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { type_activite, specialites, tarifs_habituels, autres_info } = body

    if (!type_activite?.trim()) {
      return NextResponse.json(
        { error: 'Le type d\'activité est requis' },
        { status: 400 }
      )
    }

    // Sanitize all user inputs before sending to LLM
    const safeType = sanitizeAIInput(String(type_activite), 100)
    const safeSpecialites = sanitizeAIInput(String(specialites || ''), 500)
    const safeTarifs = sanitizeAIInput(String(tarifs_habituels || ''), 200)
    const safeAutres = sanitizeAIInput(String(autres_info || ''), 500)

    const prompt = buildServiceGeneratorPrompt({
      typeActivite: safeType,
      specialites: safeSpecialites,
      tarifsHabituels: safeTarifs,
      autresInfo: safeAutres,
    })

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'Réponse vide du service IA' },
        { status: 500 }
      )
    }

    const parsed = JSON.parse(content)

    if (!parsed.services || !Array.isArray(parsed.services)) {
      return NextResponse.json(
        { error: 'Format de réponse invalide' },
        { status: 500 }
      )
    }

    // Valider et nettoyer chaque service
    const services = parsed.services
      .filter((s: { nom?: unknown; description?: unknown; prix?: unknown }) =>
        s && typeof s.nom === 'string' && typeof s.prix === 'number'
      )
      .map((s: { nom: string; description?: string; prix: number }) => ({
        nom: s.nom.trim(),
        description: (s.description || '').trim(),
        prix: Math.max(0, Math.round(s.prix)),
      }))

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Erreur generate-services:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération des services' },
      { status: 500 }
    )
  }
}
