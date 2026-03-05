import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { chatbotLimiter, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { calculateMarketAverage } from '@/lib/matching/market-averages';
import { sanitizeChatMessages } from '@/lib/security';
import { estimateMessagesTokens, checkTokenBudget } from '@/lib/token-utils';
import { buildAdvisorSystemPrompt } from '@/lib/prompts/advisor-chatbot';

/**
 * Fetches provider profile data (excluding legal info) for the AI advisor
 */
async function getProviderProfile(userId: string) {
  const supabase = await createClient();

  const [
    { data: profile },
    { data: cultures },
    { data: zones },
    { data: portfolio },
    { data: tags },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'nom_entreprise, prenom, nom, service_type, description_courte, bio, annees_experience, ville_principale, budget_min, budget_max, avatar_url, instagram_url, facebook_url, website_url, tiktok_url, has_physical_location'
      )
      .eq('id', userId)
      .single(),
    supabase
      .from('provider_cultures')
      .select('culture_id')
      .eq('profile_id', userId),
    supabase
      .from('provider_zones')
      .select('zone_id')
      .eq('profile_id', userId),
    supabase
      .from('provider_portfolio')
      .select('id, type, url')
      .eq('profile_id', userId),
    supabase
      .from('provider_tags')
      .select('tag_id')
      .eq('profile_id', userId),
  ]);

  return {
    profile,
    cultures: cultures?.map((c) => c.culture_id) || [],
    zones: zones?.map((z) => z.zone_id) || [],
    portfolioCount: portfolio?.length || 0,
    portfolioTypes: portfolio?.map((p) => p.type).filter(Boolean) || [],
    tags: tags?.map((t) => t.tag_id) || [],
  };
}

/**
 * Fetches provider performance stats (demandes + reviews) for RAG context
 */
async function getProviderStats(userId: string) {
  const supabase = await createClient();

  const [
    { data: demandes },
    { data: reviews },
  ] = await Promise.all([
    supabase
      .from('demandes')
      .select('status')
      .eq('prestataire_id', userId),
    supabase
      .from('reviews')
      .select('rating')
      .eq('prestataire_id', userId),
  ]);

  const total = demandes?.length || 0;
  const accepted = demandes?.filter((d) => d.status === 'accepted' || d.status === 'completed').length || 0;
  const rejected = demandes?.filter((d) => d.status === 'rejected').length || 0;
  const pending = demandes?.filter((d) => d.status === 'new' || d.status === 'in-progress').length || 0;
  const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : null;

  const ratings = reviews?.map((r) => r.rating).filter(Boolean) as number[] || [];
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;

  return {
    total,
    accepted,
    rejected,
    pending,
    conversionRate,
    reviewCount: ratings.length,
    avgRating,
  };
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    if (!chatbotLimiter.check(clientIp)) {
      const resetTime = chatbotLimiter.getResetTime(clientIp);
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter.', retryAfter: resetTime },
        { status: 429, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible' },
        { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Format de requête invalide' },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const { messages: rawMessages, user_id } = body;

    // Vérifier l'authentification et l'identité de l'appelant
    const supabaseAuth = await createClient();
    const { data: { user: sessionUser }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !sessionUser) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Protection IDOR : s'assurer que user_id correspond à la session active
    if (!user_id || user_id !== sessionUser.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Validation et sanitization des messages (protection prompt injection)
    const messages = sanitizeChatMessages(rawMessages);
    if (!messages) {
      return NextResponse.json(
        { error: 'Messages invalides' },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Fetch provider profile + performance stats + market data in parallel (RAG)
    const [providerData, stats] = await Promise.all([
      getProviderProfile(user_id),
      getProviderStats(user_id),
    ]);

    if (!providerData.profile) {
      return NextResponse.json(
        { error: 'Profil prestataire introuvable' },
        { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Fetch market averages for this service type (non-blocking if fails)
    const marketAvg = providerData.profile.service_type
      ? await calculateMarketAverage(providerData.profile.service_type).catch(() => null)
      : null;

    const systemPrompt = buildAdvisorSystemPrompt(providerData, stats, marketAvg);

    // Token budget pre-check — prevent sending requests that exceed context limits
    const estimatedInputTokens = estimateMessagesTokens(messages, systemPrompt);
    const maxOutputTokens = 300;
    const tokenCheck = checkTokenBudget(estimatedInputTokens, 'gpt-4o', maxOutputTokens);
    if (!tokenCheck.ok) {
      logger.warn(`Chatbot-advisor token budget exceeded: estimated=${tokenCheck.estimated}, limit=${tokenCheck.limit}`);
      return NextResponse.json(
        { error: 'Message trop long', message: 'Votre conversation est trop longue. Veuillez la réinitialiser.' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }

    // Stream the response using Vercel AI SDK
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      temperature: 0.6,
      maxOutputTokens: 300,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    logger.error('Chatbot advisor API error:', error);
    return NextResponse.json(
      { error: 'Erreur interne', message: 'Une erreur est survenue. Réessaie.' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
