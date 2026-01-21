import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { chatbotLimiter, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-error-handler';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    
    if (!chatbotLimiter.check(clientIp)) {
      const resetTime = chatbotLimiter.getResetTime(clientIp);
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter.', retryAfter: resetTime },
        { status: 429, headers: { 'Retry-After': resetTime.toString() } }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible' },
        { status: 503 }
      );
    }

    const { messages, service_type, couple_profile } = await request.json();

    // Validation des messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages invalides' },
        { status: 400 }
      );
    }

    // Construire le contexte du couple si disponible
    const coupleContext = couple_profile ? `
Informations du couple :
- Cultures : ${couple_profile.cultures?.join(', ') || 'Non spécifié'}
- Date mariage : ${couple_profile.wedding_date || 'Non spécifié'}
- Lieu : ${couple_profile.wedding_location || 'Non spécifié'}
- Budget global : ${couple_profile.budget_min || 0}€ - ${couple_profile.budget_max || 0}€
- Nombre d'invités : ${couple_profile.guest_count || 'Non spécifié'}
` : '';

    // System prompt pour le chatbot
    const systemPrompt = `Tu es l'assistant IA de NUPLY, une plateforme de matching entre couples et prestataires de mariage multiculturels.

Ton rôle : Comprendre les besoins du couple en ayant une conversation NATURELLE et ADAPTATIVE.

${coupleContext}

PROCESSUS :
1. Si le service n'est pas encore identifié, commence par demander quel type de prestataire ils recherchent
2. Une fois le service identifié, pose des questions ouvertes sur leur vision
3. Adapte-toi à leur verbosité :
   - S'ils donnent beaucoup de détails : pose moins de questions, reformule pour confirmer
   - S'ils sont concis : guide-les avec des questions simples et des exemples
4. Extrais progressivement :
   - Type de service (photographe, DJ, traiteur, neggafa, etc.)
   - Cultures importantes (maghrébin, indien, antillais, etc.)
   - Budget pour ce service (fourchette min-max)
   - Style désiré (moderne, traditionnel, fusion, etc.)
   - Besoins spécifiques et vision

RÈGLES :
- Sois chaleureux, empathique, naturel et conversationnel (comme un ami qui t'aide)
- NE répète PAS les infos déjà connues du profil couple
- Pose maximum 2 questions par message
- Utilise des exemples concrets pour aider
- Reformule ce qu'ils disent pour confirmer ta compréhension
- Si le message de l'utilisateur n'est pas clair ou pas pertinent, demande poliment une clarification :
  * "Je ne suis pas sûr de comprendre, pouvez-vous préciser ?"
  * "Je ne vois pas le lien avec votre recherche de prestataire. Parlez-moi plutôt de..."
- Si le message est complètement hors sujet (ex: météo, actualité), redirige gentiment :
  * "Je comprends, mais je suis là pour vous aider à trouver un prestataire. Parlons plutôt de..."
- Reste toujours bienveillant et ne montre jamais d'agacement
- Une fois que tu as : service_type + cultures + budget approximatif + style → propose de passer à la validation

FORMAT DE RÉPONSE (JSON strict) :
{
  "message": "Ta réponse conversationnelle au couple",
  "extracted_data": {
    "service_type": "string ou null",
    "cultures": ["culture1", "culture2"],
    "cultural_importance": "essential|important|nice_to_have ou null",
    "budget_min": number ou null,
    "budget_max": number ou null,
    "wedding_style": "string ou null",
    "wedding_ambiance": "string ou null",
    "specific_requirements": ["req1", "req2"],
    "vision_description": "résumé de leur vision",
    "must_haves": ["élément indispensable"],
    "must_not_haves": ["ce qu'ils ne veulent pas"]
  },
  "next_action": "continue" | "validate"
}

Mets next_action: "validate" UNIQUEMENT si tu as AU MINIMUM :
- service_type identifié
- Au moins 1 culture OU 1 style OU 1 besoin spécifique clair
- Une vision générale de ce qu'ils cherchent

Sinon, garde "continue" et pose des questions pour clarifier.

IMPORTANT : Le modèle doit être patient et ne pas se précipiter vers la validation.`;

    // Convertir les messages au format OpenAI
    const openaiMessages: ChatCompletionMessageParam[] = messages.map((msg: any) => {
      const role = msg.role === 'bot' ? 'assistant' : 'user';
      return {
        role: role as 'user' | 'assistant',
        content: msg.content,
      };
    });

    // Appel à OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...openaiMessages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parser la réponse JSON
    const parsedResponse = JSON.parse(content);

    return NextResponse.json(parsedResponse, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Chatbot API error:', error);
    return handleApiError(error);
  }
}
