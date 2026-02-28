import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { chatbotLimiter, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-error-handler';
import { getServiceSpecificPrompt, shouldAskQuestion, getMinRequiredCriteria } from '@/lib/chatbot/service-prompts';
import { calculateMarketAverage, formatBudgetGuideMessage } from '@/lib/matching/market-averages';
import { logger } from '@/lib/logger';
import { getServiceTypeLabel } from '@/lib/constants/service-types';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Fonction utilitaire pour corriger l'encodage UTF-8 des caractères accentués
function fixUtf8Encoding(text: string): string {
  if (!text || typeof text !== 'string') return text;

  try {
    let fixed = text;

    // Décoder les séquences d'échappement Unicode (\uXXXX)
    fixed = fixed.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
      return String.fromCharCode(parseInt(code, 16));
    });

    // Réparation double-encodage UTF-8 : seulement si on détecte le pattern Ã + suite
    // (Ã = 0xC3 en Latin-1, typique du double-encodage de é/à/ç/è/ê/etc.)
    // On cible uniquement "Ã©", "Ã ", "Ã§", "Ã¨"... pour éviter de toucher au texte correct
    if (/Ã[\x80-\xBF©«®±²³µ¶¹»¼½¾¿]/.test(fixed)) {
      try {
        const bytes = new Uint8Array([...fixed].map(c => c.charCodeAt(0)));
        const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        if (decoded && !decoded.includes('\uFFFD')) {
          fixed = decoded;
        }
      } catch {
        // Pas du double-encodage, continuer normalement
      }
    }

    // Normaliser les caractères Unicode (NFC - Canonical Composition)
    fixed = fixed.normalize('NFC');

    // Si le texte contient des caractères de remplacement (�), appliquer les corrections
    if (fixed.includes('\uFFFD') || fixed.includes('�')) {
      // Remplacer les patterns courants de mots français mal encodés
      const wordReplacements: Record<string, string> = {
        // Verbes et formes courantes
        'r\uFFFDsume': 'résume', 'r\uFFFDsum\uFFFD': 'résumé',
        'pr\uFFFDciser': 'préciser', 'pr\uFFFDcis\uFFFDment': 'précisément',
        'pr\uFFFDf\uFFFDr\uFFFD': 'préféré', 'pr\uFFFDf\uFFFDr\uFFFDe': 'préférée',
        'pr\uFFFDf\uFFFDr\uFFFDes': 'préférées', 'pr\uFFFDf\uFFFDr\uFFFDs': 'préférés',
        'pr\uFFFDf\uFFFDrence': 'préférence', 'pr\uFFFDf\uFFFDrences': 'préférences',
        'd\uFFFDj\uFFFD': 'déjà', 'tr\uFFFDs': 'très',
        'apr\uFFFDs': 'après', 'm\uFFFDme': 'même',
        // Noms communs mariage
        'c\uFFFDr\uFFFDmonie': 'cérémonie', 'c\uFFFDr\uFFFDmonies': 'cérémonies',
        'allerg\uFFFDnes': 'allergènes', 'r\uFFFDgime': 'régime',
        'v\uFFFDg\uFFFDtarien': 'végétarien', 'v\uFFFDg\uFFFDtarienne': 'végétarienne',
        'sp\uFFFDcifique': 'spécifique', 'sp\uFFFDcifiques': 'spécifiques',
        'sp\uFFFDcialit\uFFFD': 'spécialité', 'sp\uFFFDcialit\uFFFDs': 'spécialités',
        'sp\uFFFDcialis\uFFFD': 'spécialisé',
        // Cultures
        'alg\uFFFDrien': 'algérien', 'alg\uFFFDrienne': 'algérienne',
        'maghr\uFFFDbin': 'maghrébin', 'maghr\uFFFDbine': 'maghrébine',
        's\uFFFDn\uFFFDgalais': 'sénégalais',
        'europ\uFFFDen': 'européen', 'europ\uFFFDenne': 'européenne',
        'm\uFFFDditerran\uFFFDen': 'méditerranéen',
        // Adjectifs courants
        '\uFFFDl\uFFFDgant': 'élégant', '\uFFFDl\uFFFDgante': 'élégante',
        'cr\uFFFDatif': 'créatif', 'cr\uFFFDative': 'créative',
        'g\uFFFDn\uFFFDral': 'général', 'g\uFFFDn\uFFFDrale': 'générale',
        'd\uFFFDcoration': 'décoration', 'd\uFFFDcorateur': 'décorateur',
        'r\uFFFDception': 'réception', 'r\uFFFDserver': 'réserver',
        'r\uFFFDservation': 'réservation',
        'compl\uFFFDter': 'compléter', 'compl\uFFFDtement': 'complètement',
        'diff\uFFFDrent': 'différent', 'diff\uFFFDrente': 'différente',
        'int\uFFFDress\uFFFD': 'intéressé', 'int\uFFFDressant': 'intéressant',
        'n\uFFFDcessaire': 'nécessaire', 'qualit\uFFFD': 'qualité',
        'quantit\uFFFD': 'quantité', 'beaut\uFFFD': 'beauté',
        'march\uFFFD': 'marché', 'id\uFFFDe': 'idée', 'id\uFFFDes': 'idées',
        'num\uFFFDro': 'numéro', 'priv\uFFFD': 'privé',
        '\uFFFDv\uFFFDnement': 'événement', '\uFFFDv\uFFFDnements': 'événements',
        'exp\uFFFDrience': 'expérience', 'exp\uFFFDriment\uFFFD': 'expérimenté',
        'atmosph\uFFFDre': 'atmosphère', 'mani\uFFFDre': 'manière',
        'premi\uFFFDre': 'première', 'derni\uFFFDre': 'dernière',
        'enti\uFFFDre': 'entière', 'enti\uFFFDrement': 'entièrement',
        'particuli\uFFFDre': 'particulière', 'particuli\uFFFDrement': 'particulièrement',
        'l\uFFFDg\uFFFDret\uFFFD': 'légèreté',
      };

      for (const [wrong, correct] of Object.entries(wordReplacements)) {
        const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        fixed = fixed.replace(regex, correct);
      }

      // Dernier recours : supprimer les caractères de remplacement isolés restants
      // (plutôt que d'afficher des '�' dans l'interface)
      if (fixed.includes('\uFFFD')) {
        console.warn('Caractères de remplacement restants après correction:', {
          original: text.substring(0, 200),
          fixed: fixed.substring(0, 200),
        });
        // Remplacer les � isolés par rien (les supprimer proprement)
        fixed = fixed.replace(/\uFFFD/g, '');
      }
    }

    return fixed;
  } catch (error) {
    console.error('Erreur lors de la correction UTF-8:', error);
    return text;
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
      logger.error('Erreur parsing JSON:', parseError);
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

    const { messages, service_type, couple_profile, assistant_context } = body;

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

    const isBudgetPlanner = assistant_context === 'budget_planner' || service_type === 'budget_planner';

    // Générer le prompt spécialisé selon le service
    const serviceSpecificPrompt = service_type && !isBudgetPlanner
      ? getServiceSpecificPrompt(service_type, couple_profile)
      : '';

    // Critères minimum obligatoires pour ce service
    const minRequiredCriteria = service_type && !isBudgetPlanner
      ? getMinRequiredCriteria(service_type)
      : [];
    
    // Calculer les moyennes de marché pour guider le couple
    let marketAverageInfo = '';
    if (service_type && !isBudgetPlanner) {
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

    let budgetPlannerAverages = '';
    if (isBudgetPlanner) {
      const budgetPlannerServices = [
        'traiteur',
        'salle',
        'photographe',
        'videaste',
        'dj',
        'fleuriste',
        'robe_mariee',
        'patissier',
      ];
      const averages = await Promise.all(
        budgetPlannerServices.map(async (service) => {
          const marketAvg = await calculateMarketAverage(service);
          return {
            service,
            message: formatBudgetGuideMessage(marketAvg, service),
          };
        })
      );

      budgetPlannerAverages = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPÈRES DE PRIX (données moyennes NUPLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      ${averages.map((item) => `- ${getServiceTypeLabel(item.service)} : ${item.message}`).join('\n')}

Utilise ces repères pour proposer des budgets cohérents au marché.
Si une donnée manque, propose une fourchette raisonnable et indique qu'elle dépend du lieu, du nombre d'invités et des options.
`;
    }

    // System prompt pour le chatbot
    const systemPrompt = isBudgetPlanner
      ? `Tu es l'assistant IA budget mariage de NUPLY. Ta mission : aider un couple à construire un budget réaliste, réparti par postes, en tenant compte du marché et de leurs priorités.

${coupleContext}

${budgetPlannerAverages}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJECTIF & INFOS À RECUEILLIR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Budget global (ou fourchette) et marge de flexibilité.
2. Nombre d'invités (si manquant).
3. Priorités du couple (top 3 postes importants).
4. Lieu ou région (si manquant).
5. Style/culture/ambiance (si utile pour les coûts).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES ABSOLUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Réponses COURTES (2-3 phrases max).
- 1 question à la fois (jamais 2).
- Proposer des fourchettes réalistes basées sur les repères.
- Si le couple a un budget global : propose une répartition indicative (%).
- Si le couple n'a pas de budget : propose un budget cible basé sur invités + priorités.
- Toujours rappeler que les prix varient selon la ville, la saison, et les options.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLES (BUDGET PLANNER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Utilisateur : "On a 120 invités et 25k€"
Toi : "Merci ! Vos 3 postes prioritaires ? (ex : traiteur, salle, photo)."

Utilisateur : "Traiteur + déco + musique"
Toi : "Parfait. Je vous propose une répartition : traiteur ~35-40%, salle ~20-25%, photo/vidéo ~10-12%, déco ~8-12%, musique ~5-8%, reste imprévus. Votre lieu de mariage ?"

Utilisateur : "Quel budget pour un traiteur ?"
Toi : "En moyenne ${couple_profile?.guest_count ? `comptez ~${couple_profile.guest_count * 40}€ à ${couple_profile.guest_count * 80}€ pour ${couple_profile.guest_count} invités` : "40-80€ par personne"}. Vous avez combien d'invités ?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT DE RÉPONSE JSON (STRICTEMENT RESPECTER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "message": "Ta réponse courte (2-3 phrases max)",
  "extracted_data": {
    "service_type": "budget_planner",
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
TON & STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Chaleureux, expert budget
✅ Tutoiement naturel
✅ Emojis UNIQUEMENT dans le message de bienvenue initial
✅ IMPÉRATIF : Utilise TOUJOURS les caractères accentués français corrects (é, è, ê, ë, à, â, ù, û, ç, î, ï, ô, ñ). Ne JAMAIS omettre les accents.`
      : `Tu es l'assistant IA de NUPLY, plateforme de matching entre couples et prestataires de mariage multiculturels.

${coupleContext}

${marketAverageInfo}

${serviceSpecificPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES ABSOLUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CONCISION MAXIMALE (RÈGLE ABSOLUE)
   - Réponses COURTES : 1 phrase de contexte max + 1 question. JAMAIS plus.
   - 1 question à la fois (JAMAIS 2-3 questions en même temps)
   - Ne JAMAIS reformuler ni récapituler ce que l'utilisateur vient de dire.
     ❌ "Tu cherches donc un photographe reportage, c'est noté ! Et pour le budget..."
     ✅ "Budget pour le photographe ? (1 500–2 500€, 2 500–4 000€, 4 000€+)"
   - Toujours proposer des choix concrets entre parenthèses pour guider rapidement
   - Pas d'emojis sauf dans le message d'accueil initial

2. PRÉCISION MAXIMALE (NOUVEAU - PRIORITÉ ABSOLUE)
   - L'objectif est d'obtenir les critères MINIMUM OBLIGATOIRES du service avant toute validation
   - Ces critères sont listés dans la section "QUESTIONS SPÉCIFIQUES" ci-dessous
   - JAMAIS valider sans avoir tous les critères minimum obligatoires
   - Si un critère minimum manque → poser la question dessus en priorité
   - Critères minimum actuels pour ce service : ${minRequiredCriteria.length > 0 ? minRequiredCriteria.join(', ') : 'service_type + style + budget'}

3. CULTURAL IMPORTANCE (CRITIQUE pour le matching)
   - Si le couple a des cultures connues ET n'a pas encore précisé l'importance : TOUJOURS demander
   - "Les traditions [culture] sont importantes pour vous ? (essentielles — prestataire doit les maîtriser / importantes — un plus / secondaires)"
   - Mapper la réponse sur cultural_importance : "essential" | "important" | "nice_to_have"

4. BUDGET SERVICE SPÉCIFIQUE
   - Toujours demander le budget pour CE service précis (pas le budget global du mariage)
   - Si le couple a un budget global → suggérer une fourchette cohérente et demander confirmation
   - Le budget est un critère de matching critique, ne pas l'omettre

5. LOGIQUE D'ENTONNOIR — ORDRE STRICT À RESPECTER

   → Cet ordre garantit un matching précis dès le départ.

   ÉTAPE 1 : BESOIN — Quel service exactement ? (photographe, traiteur, DJ, etc.)
             Si le service n'est pas encore identifié, c'est LA seule question à poser.

   ÉTAPE 2 : BUDGET — Budget précis pour CE service (pas le budget global du mariage).
             Proposer une fourchette réaliste selon le marché si le couple hésite.
             Ex : "Budget pour le photographe ? (1 500–2 500€, 2 500–4 000€, 4 000€+)"

   ÉTAPE 3 : DISPONIBILITÉ — Date du mariage si absente du profil couple.
             Vérifier que la date n'est pas déjà connue avant de demander.
             Si la date est dans le profil → passer directement à l'étape 4.

   ÉTAPE 4 : CULTURES — Importance des traditions si le couple est multiculturel.
             "Les traditions [culture] sont importantes ? (essentielles / importantes / secondaires)"
             → cultural_importance : "essential" | "important" | "nice_to_have"
             Si le couple n'a pas de culture spécifique → passer à l'étape 4bis.

   ÉTAPE 4bis : ÉVÉNEMENTS PRÉVUS — Quels types d'événements/cérémonies avez-vous au programme ?
             → Exemples : mariage civil, mariage religieux (nikah/église/synagogue), cérémonie laïque,
               soirée henné, zaffa, cocktail, réception dîner, enterrement de vie (EVJF/EVG)
             → Si déjà mentionné dans la conversation (ex : "on a un henné") → pré-remplir et ne pas redemander
             → Cette info enrichit le matching (prestataires expérimentés dans ces moments)
             → Si évident (ex : couple européen sans mention particulière) → skip cette étape
             → Extraire dans extracted_data.event_types[] (ex: ["mariage_religieux", "henne", "reception"])

   ÉTAPE 5 : SPÉCIFICITÉS PRESTATAIRE — 1 à 2 questions clés propres au service
             (voir section QUESTIONS SPÉCIFIQUES ci-dessous).
             Choisir les 1 ou 2 critères les plus discriminants pour le matching.
             Ne pas chercher à tout demander — aller à l'essentiel.

   RÈGLE D'OR : Chaque étape = 1 seule question. Ne pas sauter d'étape, ne pas
   regrouper 2 étapes dans un même message. Si une étape est déjà remplie grâce au
   profil ou à une réponse précédente, passer directement à la suivante.

   Exemple traiteur avec couple maghrébin (100 invités connus) :
   → Étape 1 : déjà OK (traiteur)
   → Étape 2 : "Budget par personne pour le traiteur ? (40–60€, 60–90€, 90€+)"
   → Étape 3 : date déjà dans le profil → skip
   → Étape 4 : "Les traditions maghrébines sont importantes ? (essentiel — halal certifié obligatoire / importantes / secondaires)"
   → Étape 4bis : "Quels événements avez-vous ? (soirée henné, zaffa, nikah, réception, cocktail)"
   → Étape 5 : "Type de service ? (buffet, service à l'assiette, cocktail dinatoire)"
   → Résumé + validation

6. CONTEXTUALISATION — RÉFÉRENCER LES RÉPONSES PRÉCÉDENTES (CRITIQUE)
   - TOUJOURS relire la conversation avant de poser une question
   - Si le couple a mentionné quelque chose (ex : "on fait un mariage marocain avec 150 invités"), UTILISER cette info dans les questions suivantes
   - Jamais redemander une info déjà donnée dans la conversation, même implicitement
   - Exemple de bonne contextualisation :
     ✅ "Vous avez mentionné la zaffa — votre DJ doit-il s'en charger ou vous avez déjà quelqu'un ?"
     ❌ "Avez-vous une zaffa prévue ?" (alors que le couple l'a déjà mentionné)
   - Relier les questions au contexte : "Avec 150 invités et un buffet halal..."

7. ADAPTATION AU NIVEAU DE DÉTAIL
   - Utilisateur bavard (>30 mots, donne beaucoup d'infos) → Extraire un maximum, poser seulement 1 question sur le critère manquant le plus important
   - Utilisateur concis (<15 mots) → Poser UNE question fermée avec choix explicites
   - Utilisateur moyen → Poser UNE question ouverte courte avec exemples

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLES DE BONNES RÉPONSES (COURTES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXEMPLE 1 - Photographe (couple algérien, cultures: ["algérienne"], date et lieu déjà dans le profil) :
Utilisateur : "Je cherche un photographe"
Toi : "Budget pour le photographe ? (1 500–2 500€, 2 500–4 000€, 4 000€+)"

Utilisateur : "Autour de 2 000€"
Toi : "Les traditions algériennes sont importantes ? (essentielles — il doit maîtriser la zaffa et le henna / importantes / secondaires)"

Utilisateur : "Essentielles, zaffa et henna obligatoires"
Toi : "Style de photos ? (reportage/naturel, posé/classique, artistique, mix)"

Utilisateur : "Reportage naturel"
Toi : "Je résume :
- Photographe reportage, traditions algériennes essentielles (zaffa + henna)
- Budget ~2 000€
${couple_profile?.wedding_date ? `- Mariage le ${couple_profile.wedding_date}` : ''}${couple_profile?.wedding_location ? ` à ${couple_profile.wedding_location}` : ''}
Je lance la recherche ?"

EXEMPLE 2 - Traiteur (120 invités connus, cultures maghrébines) :
Utilisateur : "Je cherche un traiteur"
Toi : "Budget par personne ? (40–60€, 60–90€, 90€+)"

Utilisateur : "60–80€"
Toi : "Les traditions maghrébines sont importantes ? (essentielles — halal certifié obligatoire / importantes / secondaires)"

Utilisateur : "Essentielles, halal obligatoire"
Toi : "Type de service ? (buffet, service à l'assiette, cocktail dinatoire, mix)"

Utilisateur : "Buffet"
Toi : "Je résume :
- Traiteur halal certifié, buffet, 120 invités (~7 200–9 600€)
- Traditions maghrébines essentielles
${couple_profile?.wedding_date ? `- Mariage le ${couple_profile.wedding_date}` : ''}
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
  "suggestions": ["Option 1", "Option 2", "Option 3"],
  "extracted_data": {
    "service_type": "string ou null",
    "cultures": ["culture1"] ou [],
    "cultural_importance": "essential|important|nice_to_have ou null",
    "budget_min": number ou null,
    "budget_max": number ou null,
    "wedding_style": "moderne|traditionnel|fusion ou null",
    "wedding_ambiance": "string ou null",
    "specific_requirements": ["req1"] ou [],
    "tags": ["tag1", "tag2"],
    "event_types": ["mariage_civil", "henne", "zaffa"] ou [],
    "vision_description": "résumé riche et personnalisé incluant TOUT ce qui a été dit dans la conversation (style, traditions, ambiance, moments clés, besoins spécifiques)",
    "must_haves": [] ou ["élément"],
    "must_not_haves": [] ou ["élément"]
  },
  "next_action": "continue" | "validate",
  "question_count": 1
}

RÈGLES pour event_types[] :
- Extraire tous les types d'événements mentionnés dans la conversation
- Valeurs possibles : "mariage_civil", "mariage_religieux", "ceremonie_laique", "henne", "zaffa", "reception", "cocktail", "evjf_evg", "nikah", "sangeet", "mehndi", "kina_gecesi", "dugun", "baraat", "mandap", "dot", "ceremonie_traditionnelle"
- Si le couple mentionne "nikah" → ajouter "mariage_religieux" ET "nikah"
- Si "soirée henné" → ajouter "henne"
- Si le couple ne mentionne aucun événement particulier → laisser []

RÈGLES pour vision_description :
- Doit être un résumé PERSONNALISÉ de TOUTE la conversation, pas générique
- Mentionner les éléments spécifiques cités par le couple
- Ex : "Photographe reportage pour mariage maghrébin avec soirée henné et zaffa, ambiance chaleureuse, 150 invités, budget ~2000€"
- PAS : "Photographe pour mariage avec traditions culturelles"

RÈGLES pour suggestions[] :
- TOUJOURS générer 2 à 4 suggestions de réponse rapide pertinentes
- Les suggestions sont des BOUTONS cliquables dans l'interface — texte court (1-5 mots max)
- Quand ta question a des choix explicites entre parenthèses → extrais-les comme suggestions
- Pour les questions cultural_importance → ["Essentielles", "Importantes", "Secondaires"]
- Pour les questions budget → fourchettes courtes ["40-60€/pers", "60-90€/pers", "90€+"]
- Pour les questions style → options explicites ["Reportage", "Posé", "Artistique", "Mix"]
- Pour la confirmation finale → ["Oui, lancer !", "Modifier les critères"]
- Toujours en français, sans ponctuation à la fin, majuscule en début
- Exemples : ["Halal", "Végétarien", "Sans restriction"] / ["Buffet", "À l'assiette", "Mix"] / ["Oui", "Non", "Peu importe"]

RÈGLES pour tags[] :
- Extraire les tags pertinents depuis les réponses utilisateur
- Exemples photographe : "reportage", "henna", "zaffa", "album_physique", "artistique"
- Exemples traiteur : "halal", "buffet", "maghrébin", "végétarien"
- Exemples DJ : "oriental", "zaffa", "mix", "éclairage"
- Exemples salle : "extérieur", "traiteur_inclus", "moderne", "château"
- Toujours populer ce champ avec les tags pertinents identifiés

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITÈRES DE VALIDATION (next_action: "validate")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Passe en validation SEULEMENT si TOUTES ces conditions sont réunies :
✅ service_type identifié
✅ Critères minimum obligatoires du service collectés : ${minRequiredCriteria.length > 0 ? minRequiredCriteria.join(' + ') : 'style + vision'}
✅ cultural_importance extrait (si couple a des cultures connues)
✅ budget_min ou budget_max pour CE service (pas le budget global)

OU SI (priorité absolue, override tout) :
✅ L'utilisateur confirme explicitement le lancement ("oui", "ok", "d'accord", "vas-y", "go", "lancer", "parfait" en réponse à "Je lance la recherche ?")

Si confirmation utilisateur → VALIDATION IMMÉDIATE avec les données déjà collectées.
Si critères manquent et pas de confirmation → CONTINUER et poser la question sur le critère manquant le plus important.

NOTIFICATION DES INFOS MANQUANTES (OBLIGATOIRE dans le message de validation) :
→ Si wedding_date est absent du profil ET non mentionné dans la conversation :
  Ajouter à la fin du résumé : "📅 Votre date de mariage n'est pas encore dans votre profil — ajoutez-la pour affiner les disponibilités."
→ Si wedding_city/région est absent du profil ET non mentionné dans la conversation :
  Ajouter : "📍 Votre lieu de mariage n'est pas encore renseigné — ajoutez-le dans votre profil pour un matching géographique précis."
→ Si le couple a DONNÉ ces infos pendant la conversation → les incorporer dans extracted_data (ne pas afficher le message d'avertissement)
→ Ces avertissements ne bloquent PAS la validation — ils informent le couple.

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
"Wouah, excellente question ! Alors concernant le budget..."

✅ IMPÉRATIF : Utilise TOUJOURS les caractères accentués français corrects (é, è, ê, ë, à, â, ù, û, ç, î, ï, ô, ñ). Ne JAMAIS omettre les accents.`;

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
      response = await getOpenAI().chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...openaiMessages,
        ],
        temperature: 0.3,        // Très déterministe pour extraction fiable
        max_tokens: 500,         // Suffisant pour JSON complet avec suggestions
        response_format: { type: 'json_object' },
      });
    } catch (openaiError: any) {
      logger.error('Erreur OpenAI API:', openaiError);
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
      logger.error('Réponse OpenAI vide:', response);
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
      logger.error('Erreur parsing réponse OpenAI:', {
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
      logger.error('Réponse OpenAI invalide (pas un objet):', parsedResponse);
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
      logger.error('Réponse OpenAI invalide (pas de message):', parsedResponse);
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

    // S'assurer que tags est un tableau
    if (!Array.isArray(parsedResponse.extracted_data.tags)) {
      parsedResponse.extracted_data.tags = [];
    }

    // S'assurer que event_types est un tableau
    if (!Array.isArray(parsedResponse.extracted_data.event_types)) {
      parsedResponse.extracted_data.event_types = [];
    }

    // Valider et normaliser les suggestions
    if (!Array.isArray(parsedResponse.suggestions)) {
      parsedResponse.suggestions = [];
    } else {
      // Filtrer les suggestions vides, normaliser les accents, limiter à 4
      parsedResponse.suggestions = parsedResponse.suggestions
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => s.normalize('NFC').trim())
        .slice(0, 4);
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

    // Si la réponse est trop longue, la tronquer (400 chars max pour les résumés de validation)
    if (parsedResponse.message && parsedResponse.message.length > 400) {
      logger.warn('Message IA trop long, troncature...');
      parsedResponse.message = parsedResponse.message.substring(0, 397) + '...';
    }

    // Détecter si l'utilisateur confirme le lancement de recherche
    // Vérifier le dernier message utilisateur pour détecter une confirmation
    const lastUserMsg = openaiMessages
      .filter((msg: ChatCompletionMessageParam) => msg.role === 'user')
      .pop();
    const lastUserMessage = typeof lastUserMsg?.content === 'string' 
      ? lastUserMsg.content.toLowerCase() 
      : '';
    
    const confirmationKeywords = ['oui', 'ok', 'd\'accord', 'daccord', 'vas-y', 'vasy', 'go', 'lancer', 'parfait', 'c\'est bon', 'cest bon', 'valider', 'confirmer', 'lancez', 'top', 'super', 'bonne idée', 'allons-y', 'on y va', 'c\'est parti'];
    const isConfirmation = confirmationKeywords.some(keyword => lastUserMessage.includes(keyword));

    // Vérifier si le dernier message bot demandait confirmation
    const lastBotMsg = openaiMessages
      .filter((msg: ChatCompletionMessageParam) => msg.role === 'assistant')
      .pop();
    const lastBotMessage = typeof lastBotMsg?.content === 'string'
      ? lastBotMsg.content.toLowerCase()
      : '';
    const botAskedConfirmation = lastBotMessage.includes('je lance') || lastBotMessage.includes('lancer la recherche') || lastBotMessage.includes('recherche ?') || lastBotMessage.includes('je résume') || lastBotMessage.includes('on lance') || lastBotMessage.includes('confirmer ?');
    
    // Si l'utilisateur confirme ET que le bot demandait confirmation, forcer la validation
    if (isConfirmation && botAskedConfirmation && parsedResponse.next_action !== 'validate') {
      logger.info('Détection confirmation utilisateur, passage en validation');
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
      logger.debug(`Conversation longue (${questionCount} questions), l'IA devrait considérer la validation`);
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
  } catch (error: unknown) {
    logger.error('Chatbot API error:', error);
    return handleApiError(error);
  }
}
