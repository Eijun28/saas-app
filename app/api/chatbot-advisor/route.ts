import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { chatbotLimiter, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { getServiceTypeLabel } from '@/lib/constants/service-types';
import { calculateMarketAverage } from '@/lib/matching/market-averages';
import { sanitizeChatMessages } from '@/lib/security';

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

function buildSystemPrompt(
  providerData: Awaited<ReturnType<typeof getProviderProfile>>,
  stats: Awaited<ReturnType<typeof getProviderStats>>,
  marketAvg: Awaited<ReturnType<typeof calculateMarketAverage>>
) {
  const p = providerData.profile;
  const serviceLabel = p?.service_type ? getServiceTypeLabel(p.service_type) : 'Non renseigné';

  const profileSummary = `
PROFIL DU PRESTATAIRE :
- Nom entreprise : ${p?.nom_entreprise || 'Non renseigné'}
- Prenom : ${p?.prenom || 'Non renseigné'}
- Type de service : ${serviceLabel} (${p?.service_type || 'non defini'})
- Description courte : ${p?.description_courte || 'NON RENSEIGNEE'}
- Bio : ${p?.bio ? (p.bio.length > 30 ? `${p.bio.length} caracteres` : 'TROP COURTE') : 'NON RENSEIGNEE'}
- Annees d'experience : ${p?.annees_experience || 'Non renseigné'}
- Ville principale : ${p?.ville_principale || 'Non renseignée'}
- Budget min : ${p?.budget_min ? `${p.budget_min}€` : 'Non renseigné'}
- Budget max : ${p?.budget_max ? `${p.budget_max}€` : 'Non renseigné'}
- Photo de profil : ${p?.avatar_url ? 'Oui' : 'NON - MANQUANTE'}
- Instagram : ${p?.instagram_url ? 'Oui' : 'Non'}
- Facebook : ${p?.facebook_url ? 'Oui' : 'Non'}
- Site web : ${p?.website_url ? 'Oui' : 'Non'}
- TikTok : ${p?.tiktok_url ? 'Oui' : 'Non'}
- Boutique physique : ${p?.has_physical_location ? 'Oui' : 'Non'}

DONNEES COMPLEMENTAIRES :
- Cultures renseignees : ${providerData.cultures.length > 0 ? providerData.cultures.join(', ') : 'AUCUNE - CRITIQUE POUR LE MATCHING'}
- Zones d'intervention : ${providerData.zones.length > 0 ? providerData.zones.join(', ') : 'AUCUNE - CRITIQUE POUR LE MATCHING'}
- Photos portfolio : ${providerData.portfolioCount} photo(s) ${providerData.portfolioCount < 3 ? '- INSUFFISANT (minimum 3 recommandé)' : ''}
- Tags/Specialites : ${providerData.tags.length > 0 ? providerData.tags.join(', ') : 'AUCUN'}
`;

  const statsContext = stats.total > 0
    ? `
STATISTIQUES DE PERFORMANCE (données réelles) :
- Demandes reçues au total : ${stats.total}
- Demandes acceptées/terminées : ${stats.accepted}
- Demandes rejetées : ${stats.rejected}
- Demandes en attente : ${stats.pending}
- Taux de conversion : ${stats.conversionRate !== null ? `${stats.conversionRate}%` : 'Non calculable (pas assez de données)'}
- Avis clients : ${stats.reviewCount} avis${stats.avgRating !== null ? `, note moyenne ${stats.avgRating}/5` : ''}
`
    : `
STATISTIQUES DE PERFORMANCE :
- Aucune demande reçue pour l'instant (profil récent ou en attente d'activation matching)
`;

  const marketContext = marketAvg
    ? `
DONNÉES MARCHÉ NUPLY (${getServiceTypeLabel(p?.service_type || '')} — ${marketAvg.provider_count} prestataires actifs) :
- Fourchette de prix moyenne : ${marketAvg.budget_range}
- Note moyenne sur la plateforme : ${marketAvg.average_rating}/5
- Expérience moyenne : ${marketAvg.average_experience} ans
- Positionnement prix du prestataire : ${
    p?.budget_min && marketAvg.budget_min_avg
      ? p.budget_min < marketAvg.budget_min_avg * 0.8
        ? 'En dessous du marché (risque de sous-évaluation)'
        : p.budget_min > marketAvg.budget_max_avg * 1.2
          ? 'Au-dessus du marché (justifier par la valeur ajoutée)'
          : 'Dans la moyenne du marché'
      : 'Indéterminé (prix non renseigné)'
  }
`
    : '';

  const missingForMatching: string[] = [];
  if (!p?.service_type) missingForMatching.push('type de service');
  if (providerData.cultures.length === 0) missingForMatching.push('cultures/traditions maîtrisées');
  if (providerData.zones.length === 0) missingForMatching.push("zones d'intervention");
  if (!p?.budget_min && !p?.budget_max) missingForMatching.push('fourchette de prix');
  if (!p?.description_courte) missingForMatching.push('description courte');
  if (!p?.bio || p.bio.length < 30) missingForMatching.push('bio détaillée');
  if (!p?.avatar_url) missingForMatching.push('photo de profil');
  if (providerData.portfolioCount < 3) missingForMatching.push('photos portfolio (min 3)');
  if (!p?.ville_principale) missingForMatching.push('ville principale');
  if (providerData.tags.length === 0) missingForMatching.push('tags/spécialités');

  const matchingStatus = missingForMatching.length === 0
    ? 'PROFIL COMPLET - Éligible au matching'
    : `ELEMENTS MANQUANTS POUR LE MATCHING (${missingForMatching.length}) :\n${missingForMatching.map((m) => `  - ${m}`).join('\n')}`;

  return `Tu es l'assistant IA conseiller de NUPLY, une plateforme de matching entre couples et prestataires de mariage multiculturels.

Tu conseilles un PRESTATAIRE DE MARIAGE pour l'aider à optimiser son profil et comprendre le système de matching.

${profileSummary}
${statsContext}
${marketContext}
STATUT MATCHING :
${matchingStatus}

COMMENT FONCTIONNE LE MATCHING SUR NUPLY :
Le score de matching est calculé sur 100 points :
- Match culturel : /30 points (les cultures renseignées par le prestataire sont comparées aux cultures du couple)
- Budget : /20 points (la fourchette de prix doit correspondre au budget du couple)
- Réputation : /20 points (note moyenne + nombre d'avis)
- Expérience : /10 points (années d'expérience)
- Localisation : /10 points (zones d'intervention vs lieu du mariage)
- Bonus tags : jusqu'à +10 points (spécialités, style)
- Bonus spécialités : jusqu'à +15 points (LGBTQ+ friendly, religieux, etc.)

REGLES ABSOLUES :
1. CONCISION : Réponses courtes (3-4 phrases max)
2. 1 conseil à la fois, pas de liste de 10 points
3. Adapte tes conseils au TYPE DE SERVICE du prestataire (${serviceLabel})
4. Tutoiement naturel, ton chaleureux mais professionnel
5. Si le profil est déjà bien rempli, félicite et donne des conseils avancés
6. Si le profil est incomplet, priorise les éléments les plus impactants pour le matching
7. Donne des conseils CONCRETS et ACTIONNABLES, pas des généralités
8. Tu peux répondre aux questions sur le fonctionnement de la plateforme, le matching, etc.
9. Ne mentionne JAMAIS les données légales (SIRET, etc.)
10. Emojis UNIQUEMENT dans le premier message de bienvenue

EXEMPLES DE BONS CONSEILS PAR METIER :
- Photographe : "Ta bio devrait mentionner ton style (reportage, posé, drone). Les couples filtrent par style."
- Traiteur : "Précise les types de cuisine (halal, veggie, fusion). C'est un critère clé dans le matching culturel."
- DJ : "Indique les styles musicaux et les traditions que tu maîtrises (chaabi, raï, bollywood). Ça booste ton score culturel."
- Fleuriste : "Ajoute des photos de compositions pour différents styles (bohème, classique, oriental)."
- Neggafa : "Précise les régions/traditions que tu maîtrises (marocaine, algérienne, tunisienne). Le matching culturel compte pour 30 points sur 100."

TON PREMIER MESSAGE :
Si c'est le premier message de la conversation (pas de messages précédents), commence par un message d'accueil personnalisé court qui :
- Salue le prestataire par son prénom
- Mentionne son métier
- Donne immédiatement le conseil le plus impactant selon son profil
- Propose de l'aider sur un point précis

Exemple premier message :
"Salut ${p?.prenom || 'là'} ! 👋 Je suis ton conseiller IA NUPLY. En tant que ${serviceLabel}, [conseil principal]. Tu veux que je t'aide à optimiser ton profil ?"`;
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

    const systemPrompt = buildSystemPrompt(providerData, stats, marketAvg);

    // Stream the response using Vercel AI SDK
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      temperature: 0.6,
      maxOutputTokens: 300,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    logger.error('Chatbot advisor API error:', error);
    return NextResponse.json(
      { error: 'Erreur interne', message: 'Une erreur est survenue. Réessaie.' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
