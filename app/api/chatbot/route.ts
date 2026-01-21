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
        { 
          status: 429, 
          headers: { 
            'Retry-After': resetTime.toString(),
            'Content-Type': 'application/json; charset=utf-8',
          } 
        }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible' },
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // Parser le body avec gestion d'erreur
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError);
      return NextResponse.json(
        { error: 'Format de requête invalide', details: 'Le body JSON est invalide' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    const { messages, service_type, couple_profile } = body;

    // Validation des messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages invalides' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // Construire le contexte du couple si disponible
    const coupleContext = couple_profile ? `

Informations du couple disponibles :

Cultures : ${couple_profile.cultures?.join(', ') || 'Non spécifié'}
Date mariage : ${couple_profile.wedding_date || 'Non spécifié'}
Lieu : ${couple_profile.wedding_location || 'Non spécifié'}
Budget global : ${couple_profile.budget_min || 0}€ - ${couple_profile.budget_max || 0}€
Nombre d'invités : ${couple_profile.guest_count || 'Non spécifié'}
N'utilise ces infos que si pertinentes. Ne les répète pas inutilement.
` : '';

    // System prompt pour le chatbot
    const systemPrompt = `Tu es l'assistant IA de NUPLY, plateforme de matching entre couples et prestataires de mariage multiculturels.

${coupleContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES ABSOLUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CONCISION MAXIMALE
   - Réponses COURTES (2-3 phrases maximum)
   - 1 question à la fois (JAMAIS 2-3 questions en même temps)
   - Aller DIRECT à l'essentiel
   - Pas de blabla, pas de reformulation longue

2. EFFICACITÉ
   - Objectif : être concis mais complet (généralement 3-7 questions suffisent)
   - Si l'utilisateur donne beaucoup d'infos → Pose seulement 1-2 questions de clarification
   - Si l'utilisateur est vague → Pose des questions fermées avec choix
   - Ne te limite pas strictement : si tu as besoin de plus d'infos pour un matching précis, continue

3. ADAPTATION
   - Utilisateur bavard (>30 mots) → Juste confirmer et passer à validation
   - Utilisateur concis (<15 mots) → Poser UNE question précise avec exemples
   - Utilisateur moyen → Poser UNE question ouverte courte

4. PROGRESSION LOGIQUE
   Ordre des infos à extraire :
   
   Question 1 : Service type (si pas encore clair)
   Question 2 : Culture + Importance culturelle
   Question 3 : Budget (fourchette rapide)
   Question 4 : Style/Vision (moderne, traditionnel, fusion)
   Question 5 : Localisation + Date (si pas dans profil)
   
   Dès que tu as service + culture + budget → PASSE EN VALIDATION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLES DE BONNES RÉPONSES (COURTES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Utilisateur : "Je cherche un photographe"
Toi : "Parfait ! Votre mariage a une culture particulière ? (maghrébin, indien, européen...)"

Utilisateur : "Oui maghrébin"
Toi : "D'accord. Budget approximatif pour le photographe ?"

Utilisateur : "2000€ environ"
Toi : "Niveau style, vous préférez moderne, traditionnel ou un mix ?"

Utilisateur : "Moderne"
Toi : "Compris ! Je résume :
- Photographe maghrébin moderne
- Budget ~2000€
- Mariage le ${couple_profile?.wedding_date || 'date'} à ${couple_profile?.wedding_location || 'lieu'}

Je lance la recherche ?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLES DE MAUVAISES RÉPONSES (À ÉVITER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ "Super ! Je suis ravi de vous aider à trouver le photographe parfait. 
    Pour bien comprendre vos besoins, j'ai quelques questions. Tout d'abord,
    votre mariage a-t-il une dimension culturelle particulière ? Par exemple,
    s'agit-il d'un mariage maghrébin, indien, européen ou autre chose ?
    Et est-ce important que le prestataire connaisse ces traditions ?"
    
    POURQUOI C'EST MAL : Trop long, 2 questions à la fois, blabla inutile

✅ "Votre mariage a une culture particulière ? (maghrébin, indien...)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GESTION CAS SPÉCIAUX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAS 1 : Utilisateur donne TOUT d'un coup
"Je cherche un photographe maghrébin moderne, budget 2000€, mariage en juin à Paris"

Toi : "Parfait, j'ai tout ! Je résume :
- Photographe maghrébin moderne
- Budget 2000€
- Juin 2026 à Paris

Je lance la recherche ?"

CAS 2 : Utilisateur très vague
"Je sais pas trop"

Toi : "Pas de souci. Commençons simple : quel prestataire ? (photographe, DJ, traiteur...)"

CAS 3 : Utilisateur ne répond pas à la question
Question : "Budget approximatif ?"
Réponse : "Il faut qu'il connaisse les traditions"

Toi : "D'accord, culture importante. Et niveau budget, une fourchette ?"

CAS 4 : Utilisateur demande conseil
"C'est quoi un bon budget pour un photographe ?"

Toi : "En moyenne 1500-3000€. Votre fourchette ?"

CAS 5 : Utilisateur confirme le lancement de recherche
Question : "Je lance la recherche ?"
Réponse : "oui" / "ok" / "d'accord" / "vas-y" / "go" / "lancer" / "parfait"

Toi : Retourner IMMÉDIATEMENT next_action: "validate" avec un message court
Exemple : "Parfait ! Je lance la recherche maintenant."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT DE RÉPONSE JSON (STRICTEMENT RESPECTER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "message": "Ta réponse courte (2-3 phrases max)",
  "extracted_data": {
    "service_type": "string ou null",
    "cultures": ["culture1"] ou [],
    "cultural_importance": "essential|important|nice_to_have ou null",
    "budget_min": number ou null,
    "budget_max": number ou null,
    "wedding_style": "moderne|traditionnel|fusion ou null",
    "wedding_ambiance": "string ou null",
    "specific_requirements": ["req1"] ou [],
    "vision_description": "résumé court",
    "must_haves": [] ou ["élément"],
    "must_not_haves": [] ou ["élément"]
  },
  "next_action": "continue" | "validate",
  "question_count": 1
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITÈRES DE VALIDATION (next_action: "validate")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Passe en validation DÈS QUE tu as :
✅ service_type identifié
✅ AU MOINS 1 des suivants : cultures OU budget OU style
✅ Une vision minimale de ce qu'ils veulent

OU SI :
✅ L'utilisateur confirme explicitement le lancement ("oui", "ok", "d'accord", "vas-y", "go", "lancer", "parfait" en réponse à "Je lance la recherche ?")

JAMAIS besoin de toutes les infos pour valider. Mieux vaut un matching avec 3 critères bien compris qu'attendre d'avoir tout.

Si tu as : service + culture + budget → VALIDATION IMMÉDIATE
Si tu as : service + style + vision → VALIDATION IMMÉDIATE
Si l'utilisateur confirme → VALIDATION IMMÉDIATE (même avec moins d'infos)

NE PAS attendre d'avoir localisation, date précise, nombre d'invités, etc.
Ces infos viendront du profil couple ou seront optionnelles.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TON & STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Chaleureux mais professionnel
✅ Direct et efficace
✅ Pas de "Super !", "Génial !", "Parfait !" à chaque message
✅ Tutoiement naturel
✅ Emojis UNIQUEMENT dans le message de bienvenue initial

Exemple bon ton :
"D'accord. Budget approximatif ?"
"Compris. Style moderne ou traditionnel ?"
"Parfait, j'ai ce qu'il faut. Je résume..."

Exemple mauvais ton :
"Super ! C'est génial ! 🎉 Maintenant parlons budget..."
"Wouah, excellente question ! Alors concernant le budget..."`;

    // Convertir les messages au format OpenAI avec validation
    const openaiMessages: ChatCompletionMessageParam[] = messages
      .filter((msg: any) => msg && msg.content && typeof msg.content === 'string')
      .map((msg: any) => {
        const role = msg.role === 'bot' ? 'assistant' : 'user';
        const content = String(msg.content).trim();
        return {
          role: role as 'user' | 'assistant',
          content: content,
        };
      })
      .filter((msg: ChatCompletionMessageParam) => {
        const content = typeof msg.content === 'string' ? msg.content : '';
        return content.length > 0;
      });

    if (openaiMessages.length === 0) {
      return NextResponse.json(
        { error: 'Aucun message valide à traiter' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // Compter le nombre de questions déjà posées (messages bot)
    // Note: On ne force plus la validation après 5 questions, on laisse l'IA décider
    const questionCount = messages.filter((m: any) => m.role === 'bot').length;

    // Appel à OpenAI avec gestion d'erreur améliorée
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...openaiMessages,
        ],
        temperature: 0.5,        // Plus déterministe
        max_tokens: 150,         // Forcer concision
        response_format: { type: 'json_object' },
      });
    } catch (openaiError: any) {
      console.error('Erreur OpenAI API:', openaiError);
      const errorMessage = openaiError?.message || 'Erreur lors de l\'appel à l\'API OpenAI';
      return NextResponse.json(
        { 
          error: 'Erreur service IA', 
          details: errorMessage,
          message: 'Désolé, le service IA est temporairement indisponible. Veuillez réessayer.',
        },
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('Réponse OpenAI vide:', response);
      return NextResponse.json(
        { 
          error: 'Réponse vide du service IA',
          message: 'Désolé, je n\'ai pas pu générer de réponse. Pouvez-vous reformuler ?',
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // Parser la réponse JSON avec gestion d'erreur améliorée
    let parsedResponse;
    try {
      // Nettoyer le contenu si nécessaire (enlever markdown code blocks, etc.)
      let cleanedContent = content.trim();
      
      // Si le contenu est entouré de markdown code blocks, les enlever
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError: any) {
      console.error('Erreur parsing réponse OpenAI:', {
        error: parseError?.message || parseError,
        contentLength: content?.length,
        contentPreview: content?.substring(0, 200),
        fullContent: content,
      });
      
      // Essayer de récupérer au moins le message si c'est un JSON partiel
      let fallbackMessage = 'Je n\'ai pas pu traiter votre demande. Pouvez-vous reformuler ?';
      try {
        // Essayer d'extraire un message même si le JSON est invalide
        const messageMatch = content.match(/"message"\s*:\s*"([^"]+)"/);
        if (messageMatch && messageMatch[1]) {
          fallbackMessage = messageMatch[1];
        }
      } catch (e) {
        // Ignorer
      }
      
      return NextResponse.json(
        { 
          error: 'Format de réponse invalide',
          details: parseError?.message || 'Erreur de parsing JSON',
          message: fallbackMessage,
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // Validation de la structure de réponse
    if (!parsedResponse || typeof parsedResponse !== 'object') {
      console.error('Réponse OpenAI invalide (pas un objet):', parsedResponse);
      return NextResponse.json(
        { 
          error: 'Format de réponse invalide',
          message: 'Je n\'ai pas pu traiter votre demande. Pouvez-vous reformuler ?',
          extracted_data: {},
          next_action: 'continue',
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // S'assurer que le message existe et est une chaîne
    if (!parsedResponse.message || typeof parsedResponse.message !== 'string') {
      console.error('Réponse OpenAI invalide (pas de message):', parsedResponse);
      parsedResponse.message = 'Je n\'ai pas compris. Pouvez-vous reformuler ?';
    }

    // S'assurer que next_action existe
    if (!parsedResponse.next_action || !['continue', 'validate'].includes(parsedResponse.next_action)) {
      parsedResponse.next_action = 'continue';
    }

    // S'assurer que extracted_data existe
    if (!parsedResponse.extracted_data || typeof parsedResponse.extracted_data !== 'object') {
      parsedResponse.extracted_data = {};
    }

    // Si la réponse est trop longue, la tronquer
    if (parsedResponse.message && parsedResponse.message.length > 200) {
      console.warn('Message IA trop long, troncature...');
      parsedResponse.message = parsedResponse.message.substring(0, 197) + '...';
    }

    // Détecter si l'utilisateur confirme le lancement de recherche
    // Vérifier le dernier message utilisateur pour détecter une confirmation
    const lastUserMsg = openaiMessages
      .filter((msg: ChatCompletionMessageParam) => msg.role === 'user')
      .pop();
    const lastUserMessage = typeof lastUserMsg?.content === 'string' 
      ? lastUserMsg.content.toLowerCase() 
      : '';
    
    const confirmationKeywords = ['oui', 'ok', 'd\'accord', 'daccord', 'vas-y', 'vasy', 'go', 'lancer', 'parfait', 'c\'est bon', 'cest bon', 'valider', 'confirmer'];
    const isConfirmation = confirmationKeywords.some(keyword => lastUserMessage.includes(keyword));
    
    // Vérifier si le dernier message bot demandait confirmation
    const lastBotMsg = openaiMessages
      .filter((msg: ChatCompletionMessageParam) => msg.role === 'assistant')
      .pop();
    const lastBotMessage = typeof lastBotMsg?.content === 'string'
      ? lastBotMsg.content.toLowerCase()
      : '';
    const botAskedConfirmation = lastBotMessage.includes('je lance') || lastBotMessage.includes('lancer la recherche') || lastBotMessage.includes('recherche ?');
    
    // Si l'utilisateur confirme ET que le bot demandait confirmation, forcer la validation
    if (isConfirmation && botAskedConfirmation && parsedResponse.next_action !== 'validate') {
      console.log('Détection confirmation utilisateur, passage en validation');
      parsedResponse.next_action = 'validate';
      // Message court de confirmation
      if (!parsedResponse.message || parsedResponse.message.length < 20) {
        parsedResponse.message = 'Parfait ! Je lance la recherche maintenant.';
      }
    }

    // Suggestion de validation après 8 questions si l'IA continue encore
    // (mais on ne force pas, on laisse l'IA décider si elle a assez d'infos)
    if (questionCount >= 8 && parsedResponse.next_action === 'continue') {
      // On suggère seulement, mais on ne force pas
      console.log(`Conversation longue (${questionCount} questions), l'IA devrait considérer la validation`);
    }

    // Encoder correctement la réponse en UTF-8 avec Buffer pour garantir l'encodage
    const responseBody = JSON.stringify(parsedResponse);
    const buffer = Buffer.from(responseBody, 'utf-8');
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Chatbot API error:', error);
    return handleApiError(error);
  }
}
