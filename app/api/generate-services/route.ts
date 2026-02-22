import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

export async function POST(request: NextRequest) {
  try {
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

    const prompt = `Tu es un expert en services de mariage. Génère une liste de 4 à 6 services réalistes et bien définis pour un prestataire de type "${type_activite}".

Informations supplémentaires :
- Spécialités : ${specialites || 'Non précisé'}
- Fourchette de tarifs : ${tarifs_habituels || 'Non précisé'}
- Autres informations : ${autres_info || 'Non précisé'}

Retourne UNIQUEMENT un JSON valide de cette forme (sans markdown) :
{
  "services": [
    {
      "nom": "Nom du service",
      "description": "Description détaillée du service en 1-2 phrases",
      "prix": 1500
    }
  ]
}

Règles :
- Les noms doivent être clairs et professionnels
- Les descriptions doivent être précises et commerciales
- Les prix doivent être réalistes pour le marché du mariage en France (en euros, nombre entier)
- Entre 4 et 6 services maximum
- Ne pas inclure de packages avec prix "à partir de"
- Adapter les services aux spécialités mentionnées`

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
