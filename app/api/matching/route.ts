// app/api/matching/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  calculateTotalScore,
  enrichProviderWithFairness,
  type FairnessData,
  type ExtendedSearchCriteria,
} from '@/lib/matching/scoring';
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
    // Chevauchement : (provider_min <= couple_max) ET (provider_max >= couple_min OR provider_max IS NULL)
    // Important : les prestataires sans budget renseigné (NULL) restent éligibles
    if (search_criteria.budget_max) {
      // Le prestataire doit avoir un budget_min <= budget_max du couple OU pas de budget_min défini
      query = query.or(`budget_min.is.null,budget_min.lte.${search_criteria.budget_max}`);

      // Si le couple a un budget_min, exclure les prestataires dont le budget_max est trop bas
      // On garde ceux qui n'ont pas de budget_max (NULL) OU dont budget_max >= budget_min du couple
      if (search_criteria.budget_min) {
        query = query.or(`budget_max.gte.${search_criteria.budget_min},budget_max.is.null`);
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

    // FILTRES POST-CHARGEMENT : disponibilités + prestataires masqués
    // Ces filtres réduisent l'ensemble avant l'enrichissement (évite des requêtes inutiles)

    // Filtre 1 : Exclure les prestataires déjà réservés sur la date de mariage
    if (search_criteria.wedding_date && providers.length > 0) {
      try {
        const weddingDate = search_criteria.wedding_date;
        const loadedProviderIds = providers.map(p => String(p.id));
        const { data: busyEvents } = await supabase
          .from('events')
          .select('prestataire_id')
          .in('prestataire_id', loadedProviderIds)
          .eq('status', 'confirmed')
          .eq('date', weddingDate);

        if (busyEvents && busyEvents.length > 0) {
          const busyIds = new Set(busyEvents.map((e: { prestataire_id: string }) => String(e.prestataire_id)));
          const before = providers.length;
          providers = providers.filter(p => !busyIds.has(String(p.id)));
          logger.info(`📅 Filtre disponibilités: ${before} -> ${providers.length} prestataires (${busyIds.size} déjà réservés le ${weddingDate})`);
        }
      } catch (availabilityError) {
        // Table events peut ne pas exister ou avoir un schéma différent — non bloquant
        logger.warn('⚠️ Filtre disponibilités ignoré (table events):', availabilityError);
      }
    }

    // Filtre 2 : Exclure les prestataires que le couple a déjà masqués
    if (couple_id && providers.length > 0) {
      try {
        const { data: hiddenLogs } = await supabase
          .from('impression_logs')
          .select('profile_id')
          .eq('couple_id', couple_id)
          .eq('event_type', 'hide');

        if (hiddenLogs && hiddenLogs.length > 0) {
          const hiddenIds = new Set(hiddenLogs.map((l: { profile_id: string }) => String(l.profile_id)));
          const before = providers.length;
          providers = providers.filter(p => !hiddenIds.has(String(p.id)));
          logger.info(`🙈 Filtre masqués: ${before} -> ${providers.length} prestataires (${hiddenIds.size} masqués par le couple)`);
        }
      } catch (hideError) {
        // Table impression_logs peut ne pas exister — non bloquant
        logger.warn('⚠️ Filtre masqués ignoré (table impression_logs):', hideError);
      }
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
      // Methode optimisee : jointures Supabase + requete groupee pour portfolio
      logger.debug('⚡ Utilisation de la methode d\'enrichissement optimisee');

      // Requete groupee pour compter les portfolios (une seule requete au lieu de N)
      const { data: portfolioCounts } = await supabase
        .from('provider_portfolio')
        .select('profile_id')
        .in('profile_id', providerIds);

      // Creer un map pour acces rapide O(1)
      const portfolioCountMap = new Map<string, number>();
      portfolioCounts?.forEach((item) => {
        const count = portfolioCountMap.get(item.profile_id) || 0;
        portfolioCountMap.set(item.profile_id, count + 1);
      });

      // Enrichir les prestataires avec les donnees deja chargees via jointures
      enrichedProviders = providers.map((provider) => {
        const providerId = typeof provider.id === 'string' ? provider.id : String(provider.id);

        // Extraire les cultures depuis la jointure
        const providerCultures = (provider.provider_cultures as Array<{ culture_id: string }>) || [];
        const cultures = providerCultures.map((c) => c.culture_id);

        // Extraire les zones depuis la jointure
        const providerZones = (provider.provider_zones as Array<{ zone_id: string }>) || [];
        const zones = providerZones.map((z) => z.zone_id);

        // Recuperer le portfolio_count depuis le map
        const portfolio_count = portfolioCountMap.get(providerId) || 0;

        // Extraire les donnees de rating
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

    // ETAPE 2.5 : FILTRER PAR COMPLETION DU PROFIL
    // Seuil adaptatif : 40% minimum (critères essentiels seulement)
    // Fallback à 0% si aucun prestataire ne passe (évite les 0 résultats en dev/peu de données)
    const MINIMUM_PROFILE_COMPLETION = 40;

    const computeCompletion = (provider: Record<string, unknown>): number => {
      let score = 0;
      // Avatar: 15 pts
      if (provider.avatar_url) score += 15;
      // Nom entreprise: 10 pts
      if (provider.nom_entreprise) score += 10;
      // Description courte (> 20 chars): 15 pts
      if (provider.description_courte && String(provider.description_courte).length > 20) score += 15;
      // Budget: 10 pts
      if (provider.budget_min || provider.budget_max) score += 10;
      // Ville principale: 5 pts
      if (provider.ville_principale) score += 5;
      // Cultures: 15 pts
      if (Array.isArray(provider.cultures) && provider.cultures.length > 0) score += 15;
      // Zones: 10 pts
      if (Array.isArray(provider.zones) && provider.zones.length > 0) score += 10;
      // Portfolio (3+ photos): 15 pts
      if (typeof provider.portfolio_count === 'number' && provider.portfolio_count >= 3) score += 15;
      // Le score max effectif est 95 pts (réseaux sociaux non chargés ici)
      return Math.round((score / 100) * 100);
    };

    let providersWithCompletion = enrichedProviders.filter(
      p => computeCompletion(p) >= MINIMUM_PROFILE_COMPLETION
    );

    logger.info(`📊 Filtrage profil: ${enrichedProviders.length} -> ${providersWithCompletion.length} prestataires (>= ${MINIMUM_PROFILE_COMPLETION}% complétion)`);

    // Fallback : si aucun prestataire ne passe, montrer tous les prestataires disponibles
    // (utile en développement avec peu de données ou profils incomplets)
    if (providersWithCompletion.length === 0 && enrichedProviders.length > 0) {
      logger.warn(`⚠️ Aucun prestataire >= ${MINIMUM_PROFILE_COMPLETION}% de complétion — fallback sans filtre de complétion`);
      providersWithCompletion = enrichedProviders;
    }

    // Remplacer enrichedProviders par les prestataires filtrés
    enrichedProviders = providersWithCompletion;

    // ETAPE 2.6 : CHARGER LES DONNEES D'EQUITE ET LES TAGS DE SPECIALITE
    logger.debug('⚖️ Chargement des donnees d\'equite et specialites');

    // Charger les donnees d'equite pour tous les prestataires
    const fairnessDataMap = new Map<string, FairnessData>();
    try {
      const { data: fairnessData, error: fairnessError } = await supabase
        .from('provider_impressions')
        .select('profile_id, impressions_this_week, total_impressions, click_through_rate')
        .eq('service_type', normalizedServiceType)
        .in('profile_id', providerIds);

      // PGRST205 = table not found in schema cache — migration not yet applied
      if (fairnessError && fairnessError.code !== 'PGRST205') {
        throw fairnessError;
      }

      if (fairnessData && fairnessData.length > 0) {
        // Calculer le max d'impressions pour normaliser les scores
        // Garantir un minimum de 1 pour eviter toute division par zero
        const impressionValues = fairnessData.map(f => f.impressions_this_week || 0);
        const maxImpressions = Math.max(...impressionValues);
        const safeMaxImpressions = maxImpressions > 0 ? maxImpressions : 1;

        fairnessData.forEach((item) => {
          const impressions = item.impressions_this_week || 0;
          // Score d'equite: moins d'impressions = meilleur score
          const fairnessScore = impressions > 0
            ? 1.0 - Math.pow(impressions / safeMaxImpressions, 0.5)
            : 1.0;

          fairnessDataMap.set(item.profile_id, {
            impressions_this_week: impressions,
            total_impressions: item.total_impressions || 0,
            fairness_score: Math.max(0.1, fairnessScore),
            click_through_rate: item.click_through_rate || 0,
          });
        });
      }
    } catch (fairnessError) {
      // Si la table n'existe pas encore, continuer sans donnees d'equite
      logger.warn('⚠️ Impossible de charger les donnees d\'equite (table peut-etre inexistante):', fairnessError);
    }

    // Charger les tags pour tous les prestataires (tous types + specialites separement)
    const allTagsMap = new Map<string, string[]>();
    const specialtyTagsMap = new Map<string, string[]>();
    try {
      const { data: providerTagsData, error: tagsError } = await supabase
        .from('provider_tags')
        .select(`
          profile_id,
          tags!inner (
            slug,
            category
          )
        `)
        .in('profile_id', providerIds);

      if (tagsError) {
        throw tagsError;
      }

      if (providerTagsData) {
        // Le type de retour Supabase peut varier selon la relation
        // On gere les deux cas: objet unique ou tableau
        providerTagsData.forEach((item) => {
          const profileId = item.profile_id as string;
          const tags = item.tags;

          // Gerer le cas ou tags est un tableau ou un objet
          const tagsList = Array.isArray(tags) ? tags : [tags];

          tagsList.forEach((tag) => {
            if (tag) {
              // Stocker TOUS les tags pour calculateTagsScore (style, ambiance, etc.)
              const existingAll = allTagsMap.get(profileId) || [];
              existingAll.push(tag.slug as string);
              allTagsMap.set(profileId, existingAll);

              // Stocker les tags de specialite separement
              if (tag.category === 'specialite') {
                const existing = specialtyTagsMap.get(profileId) || [];
                existing.push(tag.slug as string);
                specialtyTagsMap.set(profileId, existing);
              }
            }
          });
        });
      }
    } catch (tagsError) {
      logger.warn('⚠️ Impossible de charger les tags:', tagsError);
    }

    // ETAPE 3 : CALCULER LES SCORES AVEC EQUITE (sur les prestataires filtrés >= 70%)
    const scoredProviders = enrichedProviders.map((provider) => {
      const providerId = typeof provider.id === 'string' ? provider.id : String(provider.id);

      // Enrichir le provider avec les donnees d'equite et specialites
      const enrichedProvider = enrichProviderWithFairness(
        {
          ...provider,
          tags: allTagsMap.get(providerId) || [],
          specialty_tags: specialtyTagsMap.get(providerId) || [],
        },
        fairnessDataMap.get(providerId) || null
      );

      const { score, breakdown } = calculateTotalScore(
        search_criteria as ExtendedSearchCriteria,
        enrichedProvider
      );

      // Generer explication simple
      const providerForExplanation = {
        average_rating: typeof provider.average_rating === 'number' ? provider.average_rating : 0,
        annees_experience: typeof provider.annees_experience === 'number' ? provider.annees_experience : 0,
      };
      const explanation = generateExplanation(breakdown, providerForExplanation, search_criteria);

      return {
        provider_id: provider.id,
        provider,
        score,
        rank: 0, // Sera defini apres tri
        breakdown,
        explanation,
      };
    });

    // ETAPE 4 : TRIER ET SELECTIONNER RESULTATS
    // Par defaut, on retourne les top 3, mais on garde tous les resultats tries pour pagination future
    const sortedProviders = scoredProviders
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({ ...p, rank: index + 1 }));

    // Selectionner les top 3 pour l'affichage initial
    const topMatches = sortedProviders.slice(0, 3);

    // ETAPE 5 : SAUVEGARDER DANS MATCHING_HISTORY
    // matching_history.couple_id reference maintenant couples(id) directement
    const { error: historyError } = await supabase
      .from('matching_history')
      .insert({
        couple_id: couple_id, // couples.id directement
        conversation_id,
        service_type: search_criteria.service_type,
        search_criteria,
        results: sortedProviders, // Sauvegarder tous les resultats pour pagination
      });

    if (historyError) {
      logger.error('Erreur sauvegarde historique:', historyError);
    }

    // ETAPE 6 : ENREGISTRER LES IMPRESSIONS POUR L'EQUITE
    // Enregistrer une impression pour chaque prestataire affiche dans le top 3
    try {
      for (const match of topMatches) {
        const providerId = typeof match.provider_id === 'string'
          ? match.provider_id
          : String(match.provider_id);

        await supabase.rpc('record_impression', {
          p_profile_id: providerId,
          p_service_type: normalizedServiceType,
          p_couple_id: couple_id,
          p_conversation_id: conversation_id || null,
          p_rank_position: match.rank,
          p_score: match.score,
          p_search_criteria: search_criteria,
        });
      }
      logger.debug('✅ Impressions enregistrees pour', topMatches.length, 'prestataires');
    } catch (impressionError) {
      // Ne pas bloquer le matching si l'enregistrement des impressions echoue
      logger.warn('⚠️ Erreur enregistrement impressions (non bloquant):', impressionError);
    }

    logger.info(`🎯 Top 3 scores: ${topMatches.map(p => p.score).join(', ')}`);
    logger.info(`📊 Total resultats disponibles: ${sortedProviders.length}`);
    logger.info(`⚖️ Equite: ${fairnessDataMap.size} prestataires avec donnees d'equite`);

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
