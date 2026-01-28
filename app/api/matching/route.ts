// app/api/matching/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTotalScore } from '@/lib/matching/scoring';
import { MatchingRequest, ProviderMatch } from '@/types/matching';
import { logger } from '@/lib/logger';

/**
 * Normalise le service_type extrait par le chatbot pour correspondre au format de la base
 * Utilise les valeurs réelles de SERVICE_TYPES
 */
function normalizeServiceType(serviceType: string | null | undefined): string {
  if (!serviceType) return '';
  
  const normalized = serviceType.toLowerCase().trim();
  
  // Valeurs réelles de la base (d'après lib/constants/service-types.ts)
  const validServiceTypes = [
    'photographe', 'videaste', 'traiteur', 'patissier', 'dj', 'animation',
    'coiffure_maquillage', 'robe_mariee', 'bijoutier', 'fleuriste',
    'salle', 'location_materiel', 'location_vehicules',
    'neggafa', 'zaffa', 'henna_artiste', 'calligraphe', 'musicien_traditionnel',
    'danseuse_orientale', 'couturier_traditionnel', 'decorateur_maghrebin',
    'organisateur_ceremonie', 'wedding_planner', 'faire_part', 'officiant', 'autre'
  ];
  
  // Mapping des variations vers les formats de la base
  const serviceTypeMap: Record<string, string> = {
    // Papeterie / Faire-part
    'papetier': 'faire_part',
    'papeterie': 'faire_part',
    'faire-part': 'faire_part',
    'faire part': 'faire_part',
    'invitations': 'faire_part',
    'invitation': 'faire_part',
    
    // Photographe
    'photographe': 'photographe',
    'photographie': 'photographe',
    'photo': 'photographe',
    
    // Vidéaste
    'vidéaste': 'videaste',
    'videaste': 'videaste',
    'video': 'videaste',
    'vidéo': 'videaste',
    
    // Traiteur
    'traiteur': 'traiteur',
    'catering': 'traiteur',
    
    // DJ
    'dj': 'dj',
    'musicien': 'dj',
    'musique': 'dj',
    
    // Wedding Planner
    'wedding planner': 'wedding_planner',
    'wedding_planner': 'wedding_planner',
    'planner': 'wedding_planner',
    'organisateur': 'wedding_planner',
    
    // Fleuriste / Décorateur
    'fleuriste': 'fleuriste',
    'décorateur': 'fleuriste',
    'decorateur': 'fleuriste',
    'decoration': 'fleuriste',
    
    // Autres
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
  
  // Chercher une correspondance exacte d'abord
  if (serviceTypeMap[normalized]) {
    return serviceTypeMap[normalized];
  }
  
  // Chercher une correspondance partielle
  for (const [key, value] of Object.entries(serviceTypeMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Vérifier si c'est déjà une valeur valide
  if (validServiceTypes.includes(normalized)) {
    return normalized;
  }
  
  // Si pas de correspondance, retourner tel quel (normalisé en minuscules)
  // Le matching pourra quand même fonctionner si le service_type correspond exactement
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
    // matching_history.couple_id référence maintenant couples(id) directement
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
    logger.debug('📋 Critères de recherche:', JSON.stringify(search_criteria, null, 2));

    // Normaliser le service_type pour correspondre au format de la base
    const normalizedServiceType = normalizeServiceType(search_criteria.service_type);
    logger.debug('🔄 Service type normalisé:', normalizedServiceType);

    // ÉTAPE 1 : FILTRES DURS avec jointures optimisées
    // Utilisation de jointures Supabase pour éviter les requêtes N+1
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
      .eq('role', 'prestataire');

    // Recherche flexible du service_type (insensible à la casse et aux variations)
    // D'abord essayer une correspondance exacte
    query = query.eq('service_type', normalizedServiceType);
    
    // Si pas de résultats, on pourra essayer une recherche partielle (à implémenter si nécessaire)

    // Filtre budget si défini - LOGIQUE OPTIMISÉE
    // Un prestataire correspond si sa fourchette chevauche celle du couple
    // Chevauchement : (couple_min <= provider_max) ET (provider_min <= couple_max)
    if (search_criteria.budget_max) {
      // Le prestataire doit avoir un budget_min <= budget_max du couple
      // (sinon il est trop cher même au minimum)
      query = query.lte('budget_min', search_criteria.budget_max);
      
      // Si le couple a un budget_min, filtrer les prestataires dont le budget_max est trop bas
      // On garde ceux qui n'ont pas de budget_max OU dont budget_max >= budget_min du couple
      if (search_criteria.budget_min) {
        // Utiliser OR avec une requête conditionnelle
        // Note: Supabase ne supporte pas directement OR, donc on filtre côté serveur après
        // Le filtrage strict se fera dans le scoring pour plus de précision
      }
    }

    logger.debug('🔎 Requête Supabase exécutée');

    let providers: Array<Record<string, unknown>> = [];
    let useFallbackEnrichment = false;
    
    const { data: providersData, error } = await query;

    if (error) {
      logger.error('❌ Erreur Supabase lors de la recherche:', error);
      logger.error('Détails:', JSON.stringify(error, null, 2));
      
      // Si l'erreur concerne les jointures (code 42703 = colonne inexistante ou relation non définie)
      // Essayer sans les jointures et charger les données séparément
      if (error.code === '42703' || error.message?.includes('relation') || error.message?.includes('foreign key')) {
        logger.warn('⚠️ Les jointures ne fonctionnent pas, utilisation du fallback');
        useFallbackEnrichment = true;
        
        // Requête sans jointures
        const { data: providersFallback, error: fallbackError } = await supabase
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
            )
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
      logger.warn('⚠️ Aucun prestataire trouvé avec les critères:', {
        service_type: search_criteria.service_type,
        budget_min: search_criteria.budget_min,
        budget_max: search_criteria.budget_max,
        role: 'prestataire',
      });
      
      // Vérifier combien de prestataires existent pour ce service_type
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'prestataire')
        .eq('service_type', normalizedServiceType);
      
      logger.info(`ℹ️ Total prestataires pour ${normalizedServiceType}:`, totalCount);
      
      // Rechercher des alternatives : prestataires du même service sans filtre budget
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

    // ÉTAPE 2 : ENRICHIR AVEC CULTURES, ZONES ET PORTFOLIO (optimisé)
    // Récupérer tous les IDs des prestataires
    const providerIds = providers.map(p => {
      const id = typeof p.id === 'string' ? p.id : String(p.id);
      return id;
    });
    
    let enrichedProviders: Array<Record<string, unknown>>;
    
    if (useFallbackEnrichment) {
      // Méthode fallback : requêtes séparées (ancienne méthode)
      logger.debug('📦 Utilisation de la méthode d\'enrichissement fallback');
      enrichedProviders = await Promise.all(
        providers.map(async (provider) => {
          // Récupérer cultures
          const { data: cultures } = await supabase
            .from('provider_cultures')
            .select('culture_id')
            .eq('profile_id', provider.id);

          // Récupérer zones
          const { data: zones } = await supabase
            .from('provider_zones')
            .select('zone_id')
            .eq('profile_id', provider.id);

          // Compter portfolio
          const { count: portfolioCount } = await supabase
            .from('provider_portfolio')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', provider.id);

          const publicProfile = Array.isArray(provider.prestataire_public_profiles) 
            ? provider.prestataire_public_profiles[0] 
            : provider.prestataire_public_profiles;

          return {
            ...provider,
            cultures: cultures?.map((c) => c.culture_id) || [],
            zones: zones?.map((z) => z.zone_id) || [],
            portfolio_count: portfolioCount || 0,
            average_rating: publicProfile?.rating || 0,
            review_count: publicProfile?.total_reviews || 0,
          };
        })
      );
    } else {
      // Méthode optimisée : jointures Supabase + requête groupée pour portfolio
      logger.debug('⚡ Utilisation de la méthode d\'enrichissement optimisée');
      
      // Requête groupée pour compter les portfolios (une seule requête au lieu de N)
      const { data: portfolioCounts } = await supabase
        .from('provider_portfolio')
        .select('profile_id')
        .in('profile_id', providerIds);
      
      // Créer un map pour accès rapide O(1)
      const portfolioCountMap = new Map<string, number>();
      portfolioCounts?.forEach((item) => {
        const count = portfolioCountMap.get(item.profile_id) || 0;
        portfolioCountMap.set(item.profile_id, count + 1);
      });

      // Enrichir les prestataires avec les données déjà chargées via jointures
      enrichedProviders = providers.map((provider) => {
        const providerId = typeof provider.id === 'string' ? provider.id : String(provider.id);
        
        // Extraire les cultures depuis la jointure
        const providerCultures = (provider.provider_cultures as Array<{ culture_id: string }>) || [];
        const cultures = providerCultures.map((c) => c.culture_id);
        
        // Extraire les zones depuis la jointure
        const providerZones = (provider.provider_zones as Array<{ zone_id: string }>) || [];
        const zones = providerZones.map((z) => z.zone_id);
        
        // Récupérer le portfolio_count depuis le map
        const portfolio_count = portfolioCountMap.get(providerId) || 0;
        
        // Extraire les données de rating
        const publicProfile = Array.isArray(provider.prestataire_public_profiles) 
          ? provider.prestataire_public_profiles[0] 
          : provider.prestataire_public_profiles;
        
        return {
          ...provider,
          cultures,
          zones,
          portfolio_count,
          average_rating: publicProfile?.rating || 0,
          review_count: publicProfile?.total_reviews || 0,
        };
      });
    }

    // ÉTAPE 3 : CALCULER LES SCORES
    const scoredProviders = enrichedProviders.map((provider) => {
      const { score, breakdown } = calculateTotalScore(
        search_criteria,
        provider
      );

      // Générer explication simple
      const providerForExplanation = {
        average_rating: typeof provider.average_rating === 'number' ? provider.average_rating : 0,
        annees_experience: typeof provider.annees_experience === 'number' ? provider.annees_experience : 0,
      };
      const explanation = generateExplanation(breakdown, providerForExplanation, search_criteria);

      return {
        provider_id: provider.id,
        provider,
        score,
        rank: 0, // Sera défini après tri
        breakdown,
        explanation,
      };
    });

    // ÉTAPE 4 : TRIER ET SÉLECTIONNER RÉSULTATS
    // Par défaut, on retourne les top 3, mais on garde tous les résultats triés pour pagination future
    const sortedProviders = scoredProviders
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({ ...p, rank: index + 1 }));
    
    // Sélectionner les top 3 pour l'affichage initial
    const topMatches = sortedProviders.slice(0, 3);

    // ÉTAPE 5 : SAUVEGARDER DANS MATCHING_HISTORY
    // matching_history.couple_id référence maintenant couples(id) directement
    const { error: historyError } = await supabase
      .from('matching_history')
      .insert({
        couple_id: couple_id, // couples.id directement
        conversation_id,
        service_type: search_criteria.service_type,
        search_criteria,
        results: sortedProviders, // Sauvegarder tous les résultats pour pagination
      });

    if (historyError) {
      logger.error('Erreur sauvegarde historique:', historyError);
    }

    logger.info(`🎯 Top 3 scores: ${topMatches.map(p => p.score).join(', ')}`);
    logger.info(`📊 Total résultats disponibles: ${sortedProviders.length}`);

    return NextResponse.json({
      matches: topMatches, // Retourner les top 3 pour compatibilité UI
      all_matches: sortedProviders, // Tous les résultats pour pagination future
      total_candidates: providers.length,
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
  criteria: MatchingRequest['search_criteria']
): string {
  const reasons = [];

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
