import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { chatbotLimiter, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-error-handler';
import { getServiceSpecificPrompt, shouldAskQuestion } from '@/lib/chatbot/service-prompts';
import { calculateMarketAverage, formatBudgetGuideMessage } from '@/lib/matching/market-averages';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fonction utilitaire pour corriger l'encodage UTF-8 des caractères accentués
function fixUtf8Encoding(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  try {
    let fixed = text;
    
    // Décoder les séquences d'échappement Unicode (\uXXXX)
    fixed = fixed.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
      return String.fromCharCode(parseInt(code, 16));
    });
    
    // Normaliser les caractères Unicode (NFC - Canonical Composition)
    fixed = fixed.normalize('NFC');
    
    // Détecter et corriger les caractères mal encodés (remplacement par �)
    // Pattern pour détecter les mots avec des caractères de remplacement suivis de lettres
    const commonAccents: Record<string, string> = {
      // é
      '�': 'é', // Si suivi de certaines lettres communes
      // è
      '�': 'è',
      // à
      '�': 'à',
      // ç
      '�': 'ç',
    };
    
    // Remplacer les patterns courants de mots français mal encodés
    const wordReplacements: Record<string, string> = {
      'r�sume': 'résume',
      'r�sum�': 'résumé',
      'alg�rien': 'algérien',
      'sp�cifique': 'spécifique',
      'allerg�nes': 'allergènes',
      'r�gime': 'régime',
      'v�g�tarien': 'végétarien',
      'pr�ciser': 'préciser',
      'pr�f�r�': 'préféré',
      'pr�f�r�e': 'préférée',
      'pr�f�r�es': 'préférées',
      'pr�f�r�s': 'préférés',
      'd�j�': 'déjà',
      'tr�s': 'très',
      'apr�s': 'après',
      'm�me': 'même',
      'c�r�monie': 'cérémonie',
      'c�r�monies': 'cérémonies',
    };
    
    // Remplacer les mots connus
    for (const [wrong, correct] of Object.entries(wordReplacements)) {
      const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      fixed = fixed.replace(regex, correct);
    }
    
    // Si le texte contient encore des caractères de remplacement, logger pour déboguer
    if (fixed.includes('�')) {
      console.warn('Caractères de remplacement détectés après correction:', {
        original: text.substring(0, 100),
        fixed: fixed.substring(0, 100),
      });
    }
    
    return fixed;
  } catch (error) {
    console.error('Erreur lors de la correction UTF-8:', error);
    return text; // Retourner le texte original en cas d'erreur
  }
}

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

    // Construire le contexte du couple enrichi si disponible
    const coupleContext = couple_profile ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMATIONS DU COUPLE (DÉJÀ CONNUES - NE PAS REDEMANDER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Cultures : ${couple_profile.cultures?.join(', ') || 'Non spécifié'}
✅ Date mariage : ${couple_profile.wedding_date || 'Non spécifié'}
✅ Lieu : ${couple_profile.wedding_location || couple_profile.wedding_city || couple_profile.wedding_region || 'Non spécifié'}
✅ Budget global mariage : ${couple_profile.budget_min ? `${couple_profile.budget_min}€` : ''}${couple_profile.budget_min && couple_profile.budget_max ? ' - ' : ''}${couple_profile.budget_max ? `${couple_profile.budget_max}€` : ''}${!couple_profile.budget_min && !couple_profile.budget_max ? 'Non spécifié' : ''}
✅ Nombre d'invités : ${couple_profile.guest_count || 'Non spécifié'}
${couple_profile.wedding_style ? `✅ Style mariage : ${couple_profile.wedding_style}` : ''}
${couple_profile.ambiance ? `✅ Ambiance souhaitée : ${couple_profile.ambiance}` : ''}

RÈGLES IMPORTANTES :
- NE JAMAIS redemander ces informations déjà connues
- Utilise ces données pour pré-remplir les critères extraits
- Si une info manque dans cette liste, tu peux la demander
- Adapte tes questions selon ces données (ex: si déjà 100 invités, ne demande pas le nombre pour traiteur)
- Référence ces infos naturellement dans tes réponses sans les répéter mot pour mot
` : '';

    // Générer le prompt spécialisé selon le service
    const serviceSpecificPrompt = service_type ? getServiceSpecificPrompt(service_type, couple_profile) : '';
    
    // Calculer les moyennes de marché pour guider le couple
    let marketAverageInfo = '';
    if (service_type) {
      const marketAvg = await calculateMarketAverage(service_type);
      if (marketAvg) {
        marketAverageInfo = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GUIDE DE BUDGET POUR ${service_type.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${formatBudgetGuideMessage(marketAvg, service_type)}

Note moyenne : ${marketAvg.average_rating}/5
Expérience moyenne : ${marketAvg.average_experience} ans

Utilise ces informations pour guider le couple sur les budgets réalistes.
Si le couple demande conseil sur le budget, référence ces moyennes.
`;
      }
    }
    
    // System prompt pour le chatbot
    const systemPrompt = `Tu es l'assistant IA de NUPLY, plateforme de matching entre couples et prestataires de mariage multiculturels.

${coupleContext}

${marketAverageInfo}

${serviceSpecificPrompt}

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

4. PROGRESSION LOGIQUE ADAPTÉE AU SERVICE
   Ordre des infos à extraire selon le type de service :
   
   ÉTAPE 1 : Service type (si pas encore clair)
   ÉTAPE 2 : Utiliser les données du couple (cultures, date, lieu, invités) - NE PAS REDEMANDER
   ÉTAPE 3 : Questions spécifiques au service (voir section QUESTIONS SPÉCIFIQUES ci-dessous)
   ÉTAPE 4 : Budget pour ce service spécifique (si pas dans profil ou différent du budget global)
   ÉTAPE 5 : Style/Vision spécifique au service
   
   RÈGLE D'OR : Si les données du couple sont complètes ET tu as les critères spécifiques au service → VALIDATION IMMÉDIATE
   
   Exemple pour traiteur :
   - Si couple a déjà 100 invités dans profil → NE PAS redemander
   - Poser : type de service, régime alimentaire, style culinaire
   - Si couple a déjà budget global → adapter pour budget traiteur (portion du budget global)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLES DE BONNES RÉPONSES (COURTES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXEMPLE 1 - Photographe (avec données couple disponibles) :
Utilisateur : "Je cherche un photographe"
Toi : "Parfait ! Style de photos préféré ? (reportage, posé, artistique)"

Utilisateur : "Reportage"
Toi : "D'accord. Durée de prestation souhaitée ? (cérémonie uniquement, journée complète)"

Utilisateur : "Journée complète"
Toi : "Compris ! Je résume :
- Photographe reportage, journée complète
- Mariage ${couple_profile?.wedding_date ? `le ${couple_profile.wedding_date}` : 'date à confirmer'} ${couple_profile?.wedding_location ? `à ${couple_profile.wedding_location}` : ''}
- ${couple_profile?.cultures?.length ? `Culture ${couple_profile.cultures.join(', ')}` : 'Culture à préciser'}
- Budget à définir selon prestation

Je lance la recherche ?"

EXEMPLE 2 - Traiteur (avec données couple disponibles) :
Utilisateur : "Je cherche un traiteur"
Toi : "Parfait ! Type de service préféré ? (buffet, assiette, mix)"

Utilisateur : "Buffet"
Toi : "D'accord. Régime alimentaire ? (halal, végétarien, sans allergènes)"

Utilisateur : "Halal"
Toi : "Compris ! Je résume :
- Traiteur buffet halal
- ${couple_profile?.guest_count ? `${couple_profile.guest_count} invités` : 'Nombre d\'invités à confirmer'}
- ${couple_profile?.wedding_date ? `Mariage le ${couple_profile.wedding_date}` : 'Date à confirmer'}
- Budget à définir selon nombre d'invités

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
"Je cherche un photographe maghrébin moderne, budget 2000€"

Toi : "Parfait, j'ai ce qu'il faut ! Je résume :
- Photographe maghrébin moderne
- Budget 2000€
${couple_profile?.wedding_date ? `- Mariage le ${couple_profile.wedding_date}` : ''}
${couple_profile?.wedding_location ? `- À ${couple_profile.wedding_location}` : ''}

Je lance la recherche ?"

Note : Utilise les données du profil pour compléter automatiquement date/lieu si disponibles.

CAS 2 : Utilisateur très vague
"Je sais pas trop"

Toi : "Pas de souci. Commençons simple : quel prestataire ? (photographe, DJ, traiteur...)"

CAS 3 : Utilisateur ne répond pas à la question
Question : "Budget approximatif ?"
Réponse : "Il faut qu'il connaisse les traditions"

Toi : "D'accord, culture importante. Et niveau budget, une fourchette ?"

CAS 4 : Utilisateur demande conseil
"C'est quoi un bon budget pour un traiteur ?"

Toi : "En moyenne 40-80€ par personne (selon les prestataires disponibles sur la plateforme). ${couple_profile?.guest_count ? `Pour ${couple_profile.guest_count} invités, comptez environ ${couple_profile.guest_count * 50}€ à ${couple_profile.guest_count * 80}€.` : 'Votre fourchette pour ce service ?'}"

IMPORTANT : Si des moyennes de marché sont fournies dans le contexte (section "GUIDE DE BUDGET"), utilise-les pour donner des conseils précis et actualisés. Sinon, utilise des valeurs par défaut raisonnables.

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
    
    // Corriger l'encodage UTF-8 du contenu dès la réception
    const fixedContent = fixUtf8Encoding(content);

    // Parser la réponse JSON avec gestion d'erreur améliorée
    let parsedResponse;
    try {
      // Nettoyer le contenu si nécessaire (enlever markdown code blocks, etc.)
      // Utiliser le contenu corrigé
      let cleanedContent = fixedContent.trim();
      
      // Si le contenu est entouré de markdown code blocks, les enlever
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Normaliser les caractères Unicode avant le parsing
      cleanedContent = cleanedContent.normalize('NFC');
      
      // Parser le JSON
      parsedResponse = JSON.parse(cleanedContent);
      
      // S'assurer que tous les strings dans la réponse sont correctement décodés
      if (parsedResponse.message && typeof parsedResponse.message === 'string') {
        // Corriger l'encodage UTF-8 du message
        parsedResponse.message = fixUtf8Encoding(parsedResponse.message);
      }
      
      // Corriger aussi les autres champs de texte si présents
      if (parsedResponse.extracted_data) {
        if (parsedResponse.extracted_data.vision_description && typeof parsedResponse.extracted_data.vision_description === 'string') {
          parsedResponse.extracted_data.vision_description = fixUtf8Encoding(parsedResponse.extracted_data.vision_description);
        }
        if (parsedResponse.extracted_data.wedding_ambiance && typeof parsedResponse.extracted_data.wedding_ambiance === 'string') {
          parsedResponse.extracted_data.wedding_ambiance = fixUtf8Encoding(parsedResponse.extracted_data.wedding_ambiance);
        }
      }
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
        const messageMatch = fixedContent.match(/"message"\s*:\s*"([^"]+)"/);
        if (messageMatch && messageMatch[1]) {
          fallbackMessage = fixUtf8Encoding(messageMatch[1]);
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
    } else {
      // Normaliser les caractères UTF-8 pour garantir l'affichage correct des accents
      parsedResponse.message = parsedResponse.message.normalize('NFC');
    }

    // S'assurer que next_action existe
    if (!parsedResponse.next_action || !['continue', 'validate'].includes(parsedResponse.next_action)) {
      parsedResponse.next_action = 'continue';
    }

    // S'assurer que extracted_data existe
    if (!parsedResponse.extracted_data || typeof parsedResponse.extracted_data !== 'object') {
      parsedResponse.extracted_data = {};
    }

    // PRÉ-REMPLIR avec les données du couple si disponibles
    if (couple_profile) {
      // Cultures
      if (couple_profile.cultures && couple_profile.cultures.length > 0) {
        if (!parsedResponse.extracted_data.cultures || parsedResponse.extracted_data.cultures.length === 0) {
          parsedResponse.extracted_data.cultures = couple_profile.cultures;
        }
      }

      // Date mariage
      if (couple_profile.wedding_date && !parsedResponse.extracted_data.wedding_date) {
        parsedResponse.extracted_data.wedding_date = couple_profile.wedding_date;
      }

      // Localisation
      if (couple_profile.wedding_city && !parsedResponse.extracted_data.wedding_city) {
        parsedResponse.extracted_data.wedding_city = couple_profile.wedding_city;
      }
      if (couple_profile.wedding_region && !parsedResponse.extracted_data.wedding_department) {
        parsedResponse.extracted_data.wedding_department = couple_profile.wedding_region;
      }

      // Nombre d'invités
      if (couple_profile.guest_count && !parsedResponse.extracted_data.guest_count) {
        parsedResponse.extracted_data.guest_count = couple_profile.guest_count;
      }

      // Style et ambiance
      if (couple_profile.wedding_style && !parsedResponse.extracted_data.wedding_style) {
        parsedResponse.extracted_data.wedding_style = couple_profile.wedding_style;
      }
      if (couple_profile.ambiance && !parsedResponse.extracted_data.wedding_ambiance) {
        parsedResponse.extracted_data.wedding_ambiance = couple_profile.ambiance;
      }

      // Budget (utiliser comme référence si pas de budget spécifique au service)
      if (couple_profile.budget_min && !parsedResponse.extracted_data.budget_min) {
        // Ne pas pré-remplir directement, mais l'IA peut s'en servir comme référence
        parsedResponse.extracted_data.budget_reference = {
          global_min: couple_profile.budget_min,
          global_max: couple_profile.budget_max,
        };
      }

      // Marquer que les données viennent du profil
      parsedResponse.extracted_data.auto_filled_from_profile = true;
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

    // Utiliser NextResponse.json() qui gère automatiquement UTF-8 correctement
    // avec les headers appropriés
    return NextResponse.json(parsedResponse, {
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
