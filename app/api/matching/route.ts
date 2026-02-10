// app/api/matching/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  calculateTotalScore,
  enrichProviderWithFairness,
  type FairnessData,
  type ExtendedSearchCriteria,
} from '@/lib/matching/scoring';
import { MatchingRequest } from '@/types/matching';
import { logger } from '@/lib/logger';

/**
 * Normalise le service_type extrait par le chatbot pour correspondre au format de la base
 */
function normalizeServiceType(serviceType: string | null | undefined): string {
  if (!serviceType) return '';

  const normalized = serviceType.toLowerCase().trim();

  const validServiceTypes = [
    'photographe', 'videaste', 'traiteur', 'patissier', 'dj', 'animation',
    'coiffure_maquillage', 'robe_mariee', 'bijoutier', 'fleuriste',
    'salle', 'location_materiel', 'location_vehicules',
    'neggafa', 'zaffa', 'henna_artiste', 'calligraphe', 'musicien_traditionnel',
    'danseuse_orientale', 'couturier_traditionnel', 'decorateur_maghrebin',
    'organisateur_ceremonie', 'wedding_planner', 'faire_part', 'officiant', 'autre'
  ];

  const serviceTypeMap: Record<string, string> = {
    'papetier': 'faire_part',
    'papeterie': 'faire_part',
    'faire-part': 'faire_part',
    'faire part': 'faire_part',
    'invitations': 'faire_part',
    'invitation': 'faire_part',
    'photographe': 'photographe',
    'photographie': 'photographe',
    'photo': 'photographe',
    'vidéaste': 'videaste',
    'videaste': 'videaste',
    'video': 'videaste',
    'vidéo': 'videaste',
    'traiteur': 'traiteur',
    'catering': 'traiteur',
    'dj': 'dj',
    'musicien': 'dj',
    'musique': 'dj',
    'wedding planner': 'wedding_planner',
    'wedding_planner': 'wedding_planner',
    'planner': 'wedding_planner',
    'organisateur': 'wedding_planner',
    'fleuriste': 'fleuriste',
    'décorateur': 'fleuriste',
    'decorateur': 'fleuriste',
    'decoration': 'fleuriste',
    'coiffeur': 'coiffure_maquillage',
    'maquilleur': 'coiffure_maquillage',
    'coiffure': 'coiffure_maquillage',
    'maquillage': 'coiffure_maquillage',
    'robe': 'robe_mariee',
    'costume': 'robe_mariee',
    'pâtissier': 'patissier',
    'patissier': 'patissier',
    'cake': 'patissier',
    'salle': 'salle',
    'lieu': 'salle',
  };

  if (serviceTypeMap[normalized]) {
    return serviceTypeMap[normalized];
  }

  for (const [key, value] of Object.entries(serviceTypeMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  if (validServiceTypes.includes(normalized)) {
    return normalized;
  }

  logger.warn(`⚠️ Service type non reconnu: "${serviceType}" -> "${normalized}"`);
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: MatchingRequest = await request.json();
    const { couple_id, conversation_id, search_criteria } = body;

    // Validation
    if (!couple_id || !search_criteria || !search_criteria.service_type) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier que le couple existe
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .eq('id', couple_id)
      .single();

    if (!couple) {
      return NextResponse.json(
        { error: 'Couple non trouvé' },
        { status: 404 }
      );
    }

    logger.info('🔍 Matching pour:', search_criteria.service_type);

    const normalizedServiceType = normalizeServiceType(search_criteria.service_type);

    // ──────────────────────────────────────────────────────────────────────
    // ÉTAPE 1 : FILTRES DURS avec jointures optimisées
    // ──────────────────────────────────────────────────────────────────────
    let query = supabase
      .from('profiles')
      .select(`
        id,
        nom_entreprise,
        avatar_url,
        bio,
        description_courte,
        service_type,
        budget_min,
        budget_max,
        ville_principale,
        annees_experience,
        languages,
        guest_capacity_min,
        guest_capacity_max,
        response_rate,
        prestataire_public_profiles (
          rating,
          total_reviews
        ),
        provider_cultures (
          culture_id
        ),
        provider_zones (
          zone_id
        )
      `)
      .eq('role', 'prestataire')
      .eq('service_type', normalizedServiceType);

    // Filtre budget si défini
    if (search_criteria.budget_max) {
      query = query.lte('budget_min', search_criteria.budget_max);
    }

    let providers: Array<Record<string, unknown>> = [];
    let useFallbackEnrichment = false;

    const { data: providersData, error } = await query;

    if (error) {
      logger.error('❌ Erreur Supabase:', error);

      if (error.code === '42703' || error.message?.includes('relation') || error.message?.includes('foreign key')) {
        logger.warn('⚠️ Jointures indisponibles, fallback');
        useFallbackEnrichment = true;

        const { data: providersFallback, error: fallbackError } = await supabase
          .from('profiles')
          .select(`
            id, nom_entreprise, avatar_url, bio, description_courte,
            service_type, budget_min, budget_max, ville_principale,
            annees_experience, languages, guest_capacity_min,
            guest_capacity_max, response_rate,
            prestataire_public_profiles ( rating, total_reviews )
          `)
          .eq('role', 'prestataire')
          .eq('service_type', normalizedServiceType);

        if (fallbackError) {
          return NextResponse.json(
            { error: 'Erreur lors de la recherche', details: fallbackError.message },
            { status: 500 }
          );
        }

        providers = providersFallback || [];
      } else {
        return NextResponse.json(
          { error: 'Erreur lors de la recherche', details: error.message },
          { status: 500 }
        );
      }
    } else {
      providers = providersData || [];
    }

    if (!providers || providers.length === 0) {
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'prestataire')
        .eq('service_type', normalizedServiceType);

      let alternativeProviders: Array<Record<string, unknown>> = [];
      if (totalCount && totalCount > 0) {
        const { data: alternatives } = await supabase
          .from('profiles')
          .select('id, nom_entreprise, service_type, budget_min, budget_max')
          .eq('role', 'prestataire')
          .eq('service_type', normalizedServiceType)
          .limit(5);

        alternativeProviders = alternatives || [];
      }

      return NextResponse.json({
        matches: [],
        total_candidates: 0,
        search_criteria,
        suggestions: {
          message: totalCount === 0
            ? `Aucun prestataire trouvé pour "${search_criteria.service_type}". Essayez un autre type de service.`
            : `Aucun prestataire ne correspond exactement à vos critères de budget. ${totalCount} prestataire(s) disponible(s) pour ce service.`,
          alternative_providers: alternativeProviders,
          total_providers_for_service: totalCount || 0,
          service_type: normalizedServiceType,
        },
      });
    }

    logger.info(`✅ ${providers.length} prestataires trouvés après filtres`);

    // ──────────────────────────────────────────────────────────────────────
    // ÉTAPE 2 : ENRICHISSEMENT (optimisé - requêtes groupées)
    // ──────────────────────────────────────────────────────────────────────
    const providerIds = providers.map(p => String(p.id));

    let enrichedProviders: Array<Record<string, unknown>>;

    if (useFallbackEnrichment) {
      // Fallback OPTIMISÉ : requêtes IN groupées au lieu de N+1
      logger.debug('📦 Enrichissement fallback (requêtes groupées)');

      const [culturesResult, zonesResult, portfolioResult] = await Promise.all([
        supabase.from('provider_cultures').select('profile_id, culture_id').in('profile_id', providerIds),
        supabase.from('provider_zones').select('profile_id, zone_id').in('profile_id', providerIds),
        supabase.from('provider_portfolio').select('profile_id').in('profile_id', providerIds),
      ]);

      // Construire les maps O(1)
      const culturesMap = new Map<string, string[]>();
      culturesResult.data?.forEach((c: { profile_id: string; culture_id: string }) => {
        const existing = culturesMap.get(c.profile_id) || [];
        existing.push(c.culture_id);
        culturesMap.set(c.profile_id, existing);
      });

      const zonesMap = new Map<string, string[]>();
      zonesResult.data?.forEach((z: { profile_id: string; zone_id: string }) => {
        const existing = zonesMap.get(z.profile_id) || [];
        existing.push(z.zone_id);
        zonesMap.set(z.profile_id, existing);
      });

      const portfolioCountMap = new Map<string, number>();
      portfolioResult.data?.forEach((item: { profile_id: string }) => {
        portfolioCountMap.set(item.profile_id, (portfolioCountMap.get(item.profile_id) || 0) + 1);
      });

      enrichedProviders = providers.map(provider => {
        const id = String(provider.id);
        const publicProfile = Array.isArray(provider.prestataire_public_profiles)
          ? provider.prestataire_public_profiles[0]
          : provider.prestataire_public_profiles;

        return {
          ...provider,
          cultures: culturesMap.get(id) || [],
          zones: zonesMap.get(id) || [],
          portfolio_count: portfolioCountMap.get(id) || 0,
          average_rating: publicProfile?.rating || 0,
          review_count: publicProfile?.total_reviews || 0,
        };
      });
    } else {
      // Méthode optimisée : jointures déjà chargées, requête groupée pour portfolio
      const { data: portfolioCounts } = await supabase
        .from('provider_portfolio')
        .select('profile_id')
        .in('profile_id', providerIds);

      const portfolioCountMap = new Map<string, number>();
      portfolioCounts?.forEach((item: { profile_id: string }) => {
        portfolioCountMap.set(item.profile_id, (portfolioCountMap.get(item.profile_id) || 0) + 1);
      });

      enrichedProviders = providers.map(provider => {
        const providerId = String(provider.id);
        const cultures = ((provider.provider_cultures as Array<{ culture_id: string }>) || []).map(c => c.culture_id);
        const zones = ((provider.provider_zones as Array<{ zone_id: string }>) || []).map(z => z.zone_id);
        const publicProfile = Array.isArray(provider.prestataire_public_profiles)
          ? provider.prestataire_public_profiles[0]
          : provider.prestataire_public_profiles;

        return {
          ...provider,
          cultures,
          zones,
          portfolio_count: portfolioCountMap.get(providerId) || 0,
          average_rating: publicProfile?.rating || 0,
          review_count: publicProfile?.total_reviews || 0,
        };
      });
    }

    // ──────────────────────────────────────────────────────────────────────
    // ÉTAPE 2.5 : FILTRER PAR COMPLÉTION DU PROFIL (>= 70%)
    // ──────────────────────────────────────────────────────────────────────
    const MINIMUM_PROFILE_COMPLETION = 70;

    const providersWithCompletion = enrichedProviders.filter(provider => {
      let score = 0;
      if (provider.avatar_url) score += 15;
      if (provider.nom_entreprise) score += 10;
      if (provider.description_courte && String(provider.description_courte).length > 20) score += 15;
      if (provider.budget_min || provider.budget_max) score += 10;
      if (provider.ville_principale) score += 5;
      if (Array.isArray(provider.cultures) && provider.cultures.length > 0) score += 15;
      if (Array.isArray(provider.zones) && provider.zones.length > 0) score += 10;
      if (typeof provider.portfolio_count === 'number' && provider.portfolio_count >= 3) score += 15;
      return score >= MINIMUM_PROFILE_COMPLETION;
    });

    logger.info(`📊 Complétion: ${enrichedProviders.length} -> ${providersWithCompletion.length} prestataires`);

    if (providersWithCompletion.length === 0 && enrichedProviders.length > 0) {
      return NextResponse.json({
        matches: [],
        total_candidates: 0,
        search_criteria,
        suggestions: {
          message: `Les prestataires de type "${search_criteria.service_type}" n'ont pas encore complété leur profil. Réessayez bientôt !`,
          total_providers_for_service: enrichedProviders.length,
          service_type: normalizedServiceType,
        },
      });
    }

    enrichedProviders = providersWithCompletion;

    // ──────────────────────────────────────────────────────────────────────
    // ÉTAPE 2.6 : CHARGER ÉQUITÉ + TAGS + DISPONIBILITÉ (en parallèle)
    // ──────────────────────────────────────────────────────────────────────
    const filteredIds = enrichedProviders.map(p => String(p.id));

    // Lancer les 3 requêtes en parallèle au lieu de séquentiellement
    const [fairnessResult, tagsResult, availabilityResult] = await Promise.all([
      // Équité
      supabase
        .from('provider_impressions')
        .select('profile_id, impressions_this_week, total_impressions, click_through_rate')
        .eq('service_type', normalizedServiceType)
        .in('profile_id', filteredIds)
        .then((r: { data: Array<{ profile_id: string; impressions_this_week: number; total_impressions: number; click_through_rate: number }> | null }) => r.data)
        .catch(() => null),
      // Tags de spécialité
      supabase
        .from('provider_tags')
        .select(`profile_id, tags!inner ( slug, category )`)
        .in('profile_id', filteredIds)
        .then((r: { data: Array<{ profile_id: string; tags: { slug: string; category: string } | Array<{ slug: string; category: string }> }> | null }) => r.data)
        .catch(() => null),
      // Disponibilité : vérifier si le prestataire a un événement le jour du mariage
      search_criteria.wedding_date
        ? supabase
            .from('evenements_prestataire')
            .select('prestataire_id')
            .in('prestataire_id', filteredIds)
            .eq('date', search_criteria.wedding_date)
            .then((r: { data: Array<{ prestataire_id: string }> | null }) => r.data)
            .catch(() => null)
        : Promise.resolve(null),
    ]);

    // Construire le set des prestataires indisponibles
    const unavailableProviderIds = new Set<string>();
    if (availabilityResult) {
      availabilityResult.forEach((event: { prestataire_id: string }) => {
        unavailableProviderIds.add(String(event.prestataire_id));
      });
      if (unavailableProviderIds.size > 0) {
        logger.info(`📅 ${unavailableProviderIds.size} prestataire(s) indisponible(s) le ${search_criteria.wedding_date}`);
      }
    }

    // Construire la map d'équité
    const fairnessDataMap = new Map<string, FairnessData>();
    if (fairnessResult) {
      const maxImpressions = Math.max(...fairnessResult.map((f: { impressions_this_week: number }) => f.impressions_this_week || 0), 1);
      fairnessResult.forEach((item: { profile_id: string; impressions_this_week: number; total_impressions: number; click_through_rate: number }) => {
        const impressions = item.impressions_this_week || 0;
        const fairnessScore = impressions > 0
          ? 1.0 - Math.pow(impressions / maxImpressions, 0.5)
          : 1.0;
        fairnessDataMap.set(item.profile_id, {
          impressions_this_week: impressions,
          total_impressions: item.total_impressions || 0,
          fairness_score: Math.max(0.1, fairnessScore),
          click_through_rate: item.click_through_rate || 0,
        });
      });
    }

    // Construire la map des tags de spécialité
    const specialtyTagsMap = new Map<string, string[]>();
    if (tagsResult) {
      tagsResult.forEach((item: { profile_id: string; tags: { slug: string; category: string } | Array<{ slug: string; category: string }> }) => {
        const profileId = item.profile_id;
        const tags = item.tags;
        const tagsList = Array.isArray(tags) ? tags : [tags];
        tagsList.forEach(tag => {
          if (tag && tag.category === 'specialite') {
            const existing = specialtyTagsMap.get(profileId) || [];
            existing.push(tag.slug as string);
            specialtyTagsMap.set(profileId, existing);
          }
        });
      });
    }

    // ──────────────────────────────────────────────────────────────────────
    // ÉTAPE 3 : SCORING
    // ──────────────────────────────────────────────────────────────────────
    const scoredProviders = enrichedProviders.map(provider => {
      const providerId = String(provider.id);

      const enrichedProvider = enrichProviderWithFairness(
        {
          ...provider,
          specialty_tags: specialtyTagsMap.get(providerId) || [],
        },
        fairnessDataMap.get(providerId) || null
      );

      const { score, breakdown } = calculateTotalScore(
        search_criteria as ExtendedSearchCriteria,
        enrichedProvider
      );

      // Pénalité de disponibilité : si le prestataire est occupé le jour du mariage
      const isUnavailable = unavailableProviderIds.has(providerId);
      const availabilityPenalty = isUnavailable ? -20 : 0;
      const finalScore = Math.max(0, Math.min(100, score + availabilityPenalty));

      const explanation = generateExplanation(
        breakdown,
        {
          average_rating: typeof provider.average_rating === 'number' ? provider.average_rating : 0,
          annees_experience: typeof provider.annees_experience === 'number' ? provider.annees_experience : 0,
        },
        search_criteria,
        isUnavailable
      );

      return {
        provider_id: provider.id,
        provider,
        score: finalScore,
        rank: 0,
        breakdown: { ...breakdown, availability_penalty: availabilityPenalty },
        explanation,
        is_unavailable: isUnavailable,
      };
    });

    // ──────────────────────────────────────────────────────────────────────
    // ÉTAPE 4 : TRI + SÉLECTION (disponibles en premier)
    // ──────────────────────────────────────────────────────────────────────
    const sortedProviders = scoredProviders
      .sort((a, b) => {
        // Les prestataires disponibles passent en premier
        if (a.is_unavailable !== b.is_unavailable) {
          return a.is_unavailable ? 1 : -1;
        }
        return b.score - a.score;
      })
      .map((p, index) => ({ ...p, rank: index + 1 }));

    const topMatches = sortedProviders.slice(0, 3);

    // ──────────────────────────────────────────────────────────────────────
    // ÉTAPE 5 : HISTORIQUE + IMPRESSIONS (en parallèle, non bloquant)
    // ──────────────────────────────────────────────────────────────────────
    // Sauvegarder l'historique et enregistrer les impressions en parallèle
    const saveHistoryPromise = supabase
      .from('matching_history')
      .insert({
        couple_id,
        conversation_id,
        service_type: search_criteria.service_type,
        search_criteria,
        results: sortedProviders,
      })
      .then(({ error: historyError }: { error: { message: string } | null }) => {
        if (historyError) logger.error('Erreur sauvegarde historique:', historyError);
      });

    // Enregistrer les impressions en parallèle (au lieu de séquentiellement)
    const impressionPromises = topMatches.map(match =>
      supabase.rpc('record_impression', {
        p_profile_id: String(match.provider_id),
        p_service_type: normalizedServiceType,
        p_couple_id: couple_id,
        p_conversation_id: conversation_id || null,
        p_rank_position: match.rank,
        p_score: match.score,
        p_search_criteria: search_criteria,
      }).catch(() => {})
    );

    // Fire-and-forget : on n'attend pas la fin pour retourner la réponse
    Promise.all([saveHistoryPromise, ...impressionPromises]).catch(err => {
      logger.warn('⚠️ Erreur background (non bloquant):', err);
    });

    logger.info(`🎯 Top 3 scores: ${topMatches.map(p => p.score).join(', ')}`);
    logger.info(`📊 Total: ${sortedProviders.length} | Indisponibles: ${unavailableProviderIds.size}`);

    return NextResponse.json({
      matches: topMatches,
      total_candidates: providers.length,
      total_available: sortedProviders.length,
      search_criteria,
      created_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Erreur matching:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: errorMessage },
      { status: 500 }
    );
  }
}

function generateExplanation(
  breakdown: { cultural_match: number; budget_match: number; reputation: number; experience: number; location_match: number },
  provider: { average_rating: number; annees_experience: number },
  criteria: MatchingRequest['search_criteria'],
  isUnavailable: boolean = false
): string {
  const reasons = [];

  if (isUnavailable) {
    reasons.push('⚠️ Potentiellement indisponible à votre date');
  }
  if (breakdown.cultural_match > 20) {
    reasons.push(`Match culturel excellent (${breakdown.cultural_match}/30)`);
  }
  if (breakdown.budget_match > 15) {
    reasons.push('Budget parfaitement aligné');
  }
  if (breakdown.reputation > 15) {
    reasons.push(`Excellente réputation (${provider.average_rating}/5)`);
  }
  if (breakdown.experience > 7) {
    reasons.push(`${provider.annees_experience} ans d'expérience`);
  }
  if (breakdown.location_match === 10) {
    reasons.push('Intervient dans votre région');
  }

  return reasons.join(' • ') || 'Prestataire qualifié pour votre mariage';
}
