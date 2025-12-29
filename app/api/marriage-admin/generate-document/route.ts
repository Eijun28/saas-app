import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { apiLimiter, getClientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Validation des types de documents autorisés
const ALLOWED_DOCUMENT_TYPES = ['birth_certificate_request', 'housing_certificate', 'witnesses_list'] as const

// Fonction de sanitisation pour prévenir les injections
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 1000) // Limite de longueur
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req)
  if (!apiLimiter.check(ip)) {
    logger.warn('Rate limit dépassé pour génération document', { ip })
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429 }
    )
  }

  try {
    // Vérifier l'authentification
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentType, userData } = await req.json()

    logger.info('Génération document', { documentType, userId: user.id })

    if (!documentType || !userData) {
      return NextResponse.json(
        { error: 'Missing documentType or userData' },
        { status: 400 }
      )
    }

    // Valider le type de document
    if (!ALLOWED_DOCUMENT_TYPES.includes(documentType as any)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }

    // Vérifier que la clé API est présente
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OPENAI_API_KEY manquante', undefined, { userId: user.id })
      return NextResponse.json(
        { error: 'Service de génération non disponible' },
        { status: 500 }
      )
    }

    let prompt = ''

    // Sanitiser les données utilisateur
    const sanitizedData = {
      firstName: sanitizeInput(String(userData.firstName || '')),
      lastName: sanitizeInput(String(userData.lastName || '')),
      birthDate: sanitizeInput(String(userData.birthDate || '')),
      birthPlace: sanitizeInput(String(userData.birthPlace || '')),
      weddingDate: sanitizeInput(String(userData.weddingDate || '')),
      municipality: sanitizeInput(String(userData.municipality || '')),
      hostName: sanitizeInput(String(userData.hostName || '')),
      address: sanitizeInput(String(userData.address || '')),
      guestName: sanitizeInput(String(userData.guestName || '')),
      sinceDate: sanitizeInput(String(userData.sinceDate || '')),
      witnesses: Array.isArray(userData.witnesses) 
        ? userData.witnesses.map((w: any) => ({
            name: sanitizeInput(String(w.name || '')),
            firstName: sanitizeInput(String(w.firstName || '')),
            birthDate: sanitizeInput(String(w.birthDate || '')),
            birthPlace: sanitizeInput(String(w.birthPlace || '')),
            profession: sanitizeInput(String(w.profession || '')),
            address: sanitizeInput(String(w.address || '')),
          }))
        : [],
    }

    // ===== LETTRE ACTE DE NAISSANCE =====
    if (documentType === 'birth_certificate_request') {
      prompt = `Tu es un expert en rédaction administrative française.

Génère une lettre formelle de demande d'acte de naissance pour un dossier de mariage.

Informations:

- Prénom: ${sanitizedData.firstName}

- Nom: ${sanitizedData.lastName}

- Date naissance: ${sanitizedData.birthDate}

- Lieu naissance: ${sanitizedData.birthPlace}

- Mariage prévu: ${sanitizedData.weddingDate}

- Ville mariage: ${sanitizedData.municipality}

La lettre doit contenir:

1. Objet: Demande d'acte de naissance

2. Formule de politesse

3. Corps: demande copie intégrale avec filiation

4. Préciser: pour dossier de mariage

5. Signature

Format: Texte brut, prêt à copier.`
    }

    // ===== ATTESTATION HÉBERGEMENT =====
    else if (documentType === 'housing_certificate') {
      prompt = `Génère une attestation d'hébergement française conforme.

Hébergeur: ${sanitizedData.hostName}

Adresse: ${sanitizedData.address}

Hébergé: ${sanitizedData.guestName}

Depuis: ${sanitizedData.sinceDate}

Format: Document formel avec titre, déclaration sur l'honneur, mention "à titre gratuit".`
    }

    // ===== LISTE TÉMOINS =====
    else if (documentType === 'witnesses_list') {
      prompt = `Génère une liste de témoins pour mariage en mairie.

Témoins: ${JSON.stringify(sanitizedData.witnesses)}

Pour chaque témoin: nom, prénom, date et lieu naissance, profession, adresse.`
    } else {
      return NextResponse.json(
        { error: 'Document type not supported' },
        { status: 400 }
      )
    }

    // ===== APPEL OPENAI =====
    // Limiter la longueur du prompt pour éviter les abus
    const maxPromptLength = 2000
    const truncatedPrompt = prompt.slice(0, maxPromptLength)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Tu es un expert en rédaction administrative française. Documents formels et conformes. Réponds uniquement avec le contenu du document demandé, sans commentaires supplémentaires.',
        },
        { role: 'user', content: truncatedPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const content = completion.choices[0].message.content

    logger.info('Document généré avec succès', { documentType, userId: user.id })

    return NextResponse.json({
      success: true,
      content,
      documentType,
    })
  } catch (error: any) {
    logger.error('Erreur génération document', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du document' },
      { status: 500 }
    )
  }
}

