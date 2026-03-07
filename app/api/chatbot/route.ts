import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { chatbotLimiter, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-error-handler';
import { getServiceSpecificPrompt, getMinRequiredCriteria } from '@/lib/chatbot/service-prompts';
import { calculateMarketAverage, formatBudgetGuideMessage } from '@/lib/matching/market-averages';
import { logger } from '@/lib/logger';
import { getServiceTypeLabel } from '@/lib/constants/service-types';
import { sanitizeChatMessages, sanitizeAIInput } from '@/lib/security';
import { estimateMessagesTokens, checkTokenBudget } from '@/lib/token-utils';
import { createClient } from '@/lib/supabase/server';
import type { SearchCriteria } from '@/types/chatbot';
import {
  buildCoupleContext,
  buildBudgetPlannerPrompt,
  buildMatchingChatbotPrompt,
} from '@/lib/prompts/matching-chatbot';

const ChatbotResponseSchema = z.object({
  message: z.string().describe('Réponse courte (2-3 phrases max)'),
  suggestions: z.array(z.string()).max(4).optional().describe('2-4 suggestions de réponse rapide'),
  extracted_data: z.object({
    service_type: z.string().nullable().optional().describe('Type de prestataire recherché'),
    cultures: z.array(z.string()).optional().describe('Cultures/traditions du couple'),
    cultural_importance: z.enum(['essential', 'important', 'nice_to_have']).nullable().optional(),
    budget_min: z.number().nullable().optional(),
    budget_max: z.number().nullable().optional(),
    wedding_style: z.string().nullable().optional(),
    wedding_ambiance: z.string().nullable().optional(),
    specific_requirements: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    event_types: z.array(z.string()).optional(),
    vision_description: z.string().optional().describe('Résumé personnalisé de toute la conversation'),
    must_haves: z.array(z.string()).optional(),
    must_not_haves: z.array(z.string()).optional(),
    dietary_requirements: z.array(z.string()).nullable().optional(),
    required_languages: z.array(z.string()).nullable().optional(),
  }).optional(),
  next_action: z.enum(['continue', 'validate']).describe('continue ou validate si critères suffisants'),
  question_count: z.number().optional(),
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

    const { messages: rawMessages, service_type, couple_profile, assistant_context, conversation_id, couple_id } = body;

    // --- Load existing conversation for multi-turn persistence ---
    let existingConversationId: string | undefined = typeof conversation_id === 'string' ? conversation_id : undefined;
    let existingExtractedCriteria: Partial<SearchCriteria> = {};

    if (existingConversationId && typeof couple_id === 'string') {
      try {
        const supabase = await createClient();
        const { data: existingConv } = await supabase
          .from('chatbot_conversations')
          .select('id, extracted_criteria')
          .eq('id', existingConversationId)
          .single();

        if (existingConv) {
          existingExtractedCriteria = (existingConv.extracted_criteria as Partial<SearchCriteria>) ?? {};
        } else {
          // Conversation not found — will create a new one instead
          existingConversationId = undefined;
        }
      } catch (loadError: unknown) {
        logger.warn('Failed to load existing conversation, will create new:', loadError);
        existingConversationId = undefined;
      }
    }

    // Validation et sanitization des messages (protection prompt injection)
    const messages = sanitizeChatMessages(rawMessages);
    if (!messages) {
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

    // Sanitize service_type si fourni
    const sanitizedServiceType = service_type
      ? sanitizeAIInput(String(service_type), 100)
      : undefined;

    // Construire le contexte du couple enrichi si disponible
    const coupleContext = buildCoupleContext(couple_profile ?? null);

    const isBudgetPlanner = assistant_context === 'budget_planner' || sanitizedServiceType === 'budget_planner';

    // Générer le prompt spécialisé selon le service
    const serviceSpecificPrompt = sanitizedServiceType && !isBudgetPlanner
      ? getServiceSpecificPrompt(sanitizedServiceType, couple_profile)
      : '';

    // Critères minimum obligatoires pour ce service
    const minRequiredCriteria = sanitizedServiceType && !isBudgetPlanner
      ? getMinRequiredCriteria(sanitizedServiceType)
      : [];
    
    // Calculer les moyennes de marché pour guider le couple
    let marketAverageInfo = '';
    if (sanitizedServiceType && !isBudgetPlanner) {
      const marketAvg = await calculateMarketAverage(sanitizedServiceType);
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

    // System prompt pour le chatbot (extracted to lib/prompts/matching-chatbot.ts)
    const systemPrompt = isBudgetPlanner
      ? buildBudgetPlannerPrompt({
          coupleContext,
          budgetPlannerAverages,
          coupleProfile: couple_profile ?? null,
        })
      : buildMatchingChatbotPrompt({
          coupleContext,
          marketAverageInfo,
          serviceSpecificPrompt,
          minRequiredCriteria,
          coupleProfile: couple_profile ?? null,
        });

    // Token budget pre-check — prevent sending requests that exceed context limits
    const estimatedInputTokens = estimateMessagesTokens(messages, systemPrompt);
    const maxOutputTokens = 500;
    const tokenCheck = checkTokenBudget(estimatedInputTokens, 'gpt-4o', maxOutputTokens);
    if (!tokenCheck.ok) {
      logger.warn(`Chatbot token budget exceeded: estimated=${tokenCheck.estimated}, limit=${tokenCheck.limit}`);
      return NextResponse.json(
        { error: 'Message trop long', message: 'Votre conversation est trop longue. Veuillez la réinitialiser.' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }

    // Appel à l'IA via Vercel AI SDK avec extraction structurée (Zod schema)
    let parsedResponse: z.infer<typeof ChatbotResponseSchema>;
    try {
      const { object } = await generateObject({
        model: openai('gpt-4o'),
        system: systemPrompt,
        messages,
        schema: ChatbotResponseSchema,
        temperature: 0.3,
        maxOutputTokens: 500,
      });
      parsedResponse = object;
    } catch (aiError: unknown) {
      logger.error('Erreur AI SDK chatbot:', aiError);
      return NextResponse.json(
        {
          error: 'Erreur service IA',
          message: 'Désolé, le service IA est temporairement indisponible. Veuillez réessayer.',
        },
        {
          status: 503,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }

    // Normaliser le message
    parsedResponse.message = (parsedResponse.message || 'Je n\'ai pas compris. Pouvez-vous reformuler ?').normalize('NFC');

    // Normaliser les suggestions
    parsedResponse.suggestions = (parsedResponse.suggestions || [])
      .filter(s => s.trim().length > 0)
      .map(s => s.normalize('NFC').trim())
      .slice(0, 4);

    // Initialiser extracted_data si absent
    if (!parsedResponse.extracted_data) {
      parsedResponse.extracted_data = {};
    }

    // PRÉ-REMPLIR avec les données du couple si disponibles
    // Le frontend attend des champs additionnels dans extracted_data
    const responseData: Record<string, unknown> = { ...parsedResponse };
    const extractedData: Record<string, unknown> = { ...parsedResponse.extracted_data };
    responseData.extracted_data = extractedData;

    if (couple_profile) {
      if (couple_profile.cultures?.length > 0 && (!extractedData.cultures || (extractedData.cultures as string[]).length === 0)) {
        extractedData.cultures = couple_profile.cultures;
      }
      if (couple_profile.wedding_date && !extractedData.wedding_date) {
        extractedData.wedding_date = couple_profile.wedding_date;
      }
      if (couple_profile.wedding_city && !extractedData.wedding_city) {
        extractedData.wedding_city = couple_profile.wedding_city;
      }
      if (couple_profile.wedding_region && !extractedData.wedding_department) {
        extractedData.wedding_department = couple_profile.wedding_region;
      }
      if (couple_profile.guest_count && !extractedData.guest_count) {
        extractedData.guest_count = couple_profile.guest_count;
      }
      if (couple_profile.wedding_style && !extractedData.wedding_style) {
        extractedData.wedding_style = couple_profile.wedding_style;
      }
      if (couple_profile.ambiance && !extractedData.wedding_ambiance) {
        extractedData.wedding_ambiance = couple_profile.ambiance;
      }
      if (couple_profile.budget_min && !extractedData.budget_min) {
        extractedData.budget_reference = {
          global_min: couple_profile.budget_min,
          global_max: couple_profile.budget_max,
        };
      }
      extractedData.auto_filled_from_profile = true;
    }

    // Tronquer si trop long
    if (responseData.message && (responseData.message as string).length > 400) {
      responseData.message = (responseData.message as string).substring(0, 397) + '...';
    }

    // Détecter si l'utilisateur confirme le lancement de recherche
    const lastUserMsg = messages.filter(msg => msg.role === 'user').pop();
    const lastUserMessage = (lastUserMsg?.content ?? '').toLowerCase();

    const confirmationKeywords = ['oui', 'ok', 'd\'accord', 'daccord', 'vas-y', 'vasy', 'go', 'lancer', 'parfait', 'c\'est bon', 'cest bon', 'valider', 'confirmer', 'lancez', 'top', 'super', 'bonne idée', 'allons-y', 'on y va', 'c\'est parti'];
    const isConfirmation = confirmationKeywords.some(keyword => lastUserMessage.includes(keyword));

    const lastBotMsg = messages.filter(msg => msg.role === 'assistant').pop();
    const lastBotMessage = (lastBotMsg?.content ?? '').toLowerCase();
    const botAskedConfirmation = lastBotMessage.includes('je lance') || lastBotMessage.includes('lancer la recherche') || lastBotMessage.includes('recherche ?') || lastBotMessage.includes('je résume') || lastBotMessage.includes('on lance') || lastBotMessage.includes('confirmer ?');

    if (isConfirmation && botAskedConfirmation && responseData.next_action !== 'validate') {
      responseData.next_action = 'validate';
      if (!(responseData.message as string) || (responseData.message as string).length < 20) {
        responseData.message = 'Parfait ! Je lance la recherche maintenant.';
      }
    }

    // --- Persist conversation to database (non-blocking) ---
    let savedConversationId: string | undefined = existingConversationId;

    if (typeof couple_id === 'string' && couple_id.length > 0) {
      const conversationStatus = responseData.next_action === 'validate' ? 'completed' : 'in_progress';
      const mergedCriteria: Partial<SearchCriteria> = {
        ...existingExtractedCriteria,
        ...(extractedData as Partial<SearchCriteria>),
      };

      // Build stored messages from the current exchange (role mapping: user→user, assistant→bot)
      const storedMessages = messages
        .map((msg: { role: string; content: string }) => ({
          role: msg.role === 'assistant' ? 'bot' as const : 'user' as const,
          content: typeof msg.content === 'string' ? msg.content : '',
          timestamp: new Date().toISOString(),
        }))
        .concat([{
          role: 'bot' as const,
          content: typeof responseData.message === 'string' ? responseData.message : '',
          timestamp: new Date().toISOString(),
          ...(parsedResponse.suggestions?.length ? { suggestions: parsedResponse.suggestions } : {}),
        }]);

      try {
        const supabase = await createClient();

        if (existingConversationId) {
          // Update existing conversation
          const { error: updateError } = await supabase
            .from('chatbot_conversations')
            .update({
              messages: storedMessages,
              extracted_criteria: mergedCriteria,
              status: conversationStatus,
            })
            .eq('id', existingConversationId);

          if (updateError) {
            logger.warn('Failed to update chatbot conversation:', updateError);
          }
        } else {
          // Create new conversation
          const effectiveServiceType = sanitizedServiceType || (mergedCriteria.service_type as string) || 'unknown';
          const { data: newConv, error: insertError } = await supabase
            .from('chatbot_conversations')
            .insert({
              couple_id: couple_id,
              service_type: effectiveServiceType,
              messages: storedMessages,
              extracted_criteria: mergedCriteria,
              status: conversationStatus,
            })
            .select('id')
            .single();

          if (insertError) {
            logger.warn('Failed to save chatbot conversation:', insertError);
          } else if (newConv) {
            savedConversationId = newConv.id;
          }
        }
      } catch (persistError: unknown) {
        // Persistence failure should not break the chatbot response
        logger.warn('Chatbot conversation persistence error:', persistError);
      }
    }

    // Include conversation_id in response for multi-turn continuity
    if (savedConversationId) {
      responseData.conversation_id = savedConversationId;
    }

    return NextResponse.json(responseData, {
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
