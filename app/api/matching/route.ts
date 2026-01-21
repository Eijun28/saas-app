// app/api/matching/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTotalScore } from '@/lib/matching/scoring';
import { MatchingRequest, ProviderMatch } from '@/types/matching';

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
  console.warn(`⚠️ Service type non reconnu: "${serviceType}" -> "${normalized}"`);
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

    console.log('🔍 Matching pour:', search_criteria.service_type);
    console.log('📋 Critères de recherche:', JSON.stringify(search_criteria, null, 2));

    // Normaliser le service_type pour correspondre au format de la base
    const normalizedServiceType = normalizeServiceType(search_criteria.service_type);
    console.log('🔄 Service type normalisé:', normalizedServiceType);

    // ÉTAPE 1 : FILTRES DURS
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
        )
      `)
      .eq('role', 'prestataire');

    // Recherche flexible du service_type (insensible à la casse et aux variations)
    // D'abord essayer une correspondance exacte
    query = query.eq('service_type', normalizedServiceType);
    
    // Si pas de résultats, on pourra essayer une recherche partielle (à implémenter si nécessaire)

    // Filtre budget si défini - LOGIQUE AMÉLIORÉE
    // Un prestataire correspond si sa fourchette chevauche celle du couple
    if (search_criteria.budget_max) {
      // Le prestataire doit avoir un budget_min <= budget_max du couple
      // (sinon il est trop cher même au minimum)
      query = query.lte('budget_min', search_criteria.budget_max);
      
      // Si le couple a un budget_min, on filtre aussi les prestataires trop chers
      // Un prestataire est trop cher si son budget_max existe ET est < budget_min du couple
      // On garde donc ceux qui n'ont pas de budget_max OU dont budget_max >= budget_min du couple
      if (search_criteria.budget_min) {
        // Note: Supabase ne supporte pas directement OR dans les filtres simples
        // On va plutôt être moins restrictif : on garde tous ceux dont budget_min <= budget_max du couple
        // Le scoring s'occupera de pénaliser ceux qui sont hors budget
      }
    }

    console.log('🔎 Requête Supabase:', query);

    const { data: providers, error } = await query;

    if (error) {
      console.error('Erreur Supabase:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la recherche' },
        { status: 500 }
      );
    }

    if (error) {
      console.error('❌ Erreur Supabase lors de la recherche:', error);
      console.error('Détails:', JSON.stringify(error, null, 2));
    }

    if (!providers || providers.length === 0) {
      console.warn('⚠️ Aucun prestataire trouvé avec les critères:', {
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
        .eq('service_type', search_criteria.service_type);
      
      console.log(`ℹ️ Total prestataires pour ${search_criteria.service_type}:`, totalCount);
      
      return NextResponse.json({
        matches: [],
        total_candidates: 0,
        search_criteria,
        debug: {
          service_type: search_criteria.service_type,
          total_providers_for_service: totalCount || 0,
        },
      });
    }

    console.log(`✅ ${providers.length} prestataires trouvés après filtres`);
    console.log('📊 Prestataires:', providers.map(p => ({
      id: p.id,
      nom_entreprise: p.nom_entreprise,
      service_type: p.service_type,
      budget_min: p.budget_min,
      budget_max: p.budget_max,
    })));

    // ÉTAPE 2 : ENRICHIR AVEC CULTURES ET ZONES
    const enrichedProviders = await Promise.all(
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

        return {
          ...provider,
          cultures: cultures?.map((c) => c.culture_id) || [],
          zones: zones?.map((z) => z.zone_id) || [],
          portfolio_count: portfolioCount || 0,
          average_rating: provider.prestataire_public_profiles?.[0]?.rating || 0,
          review_count: provider.prestataire_public_profiles?.[0]?.total_reviews || 0,
        };
      })
    );

    // ÉTAPE 3 : CALCULER LES SCORES
    const scoredProviders = enrichedProviders.map((provider) => {
      const { score, breakdown } = calculateTotalScore(
        search_criteria,
        provider
      );

      // Générer explication simple
      const explanation = generateExplanation(breakdown, provider, search_criteria);

      return {
        provider_id: provider.id,
        provider,
        score,
        rank: 0, // Sera défini après tri
        breakdown,
        explanation,
      };
    });

    // ÉTAPE 4 : TRIER ET SÉLECTIONNER TOP 3
    const sortedProviders = scoredProviders
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((p, index) => ({ ...p, rank: index + 1 }));

    // ÉTAPE 5 : SAUVEGARDER DANS MATCHING_HISTORY
    // matching_history.couple_id référence maintenant couples(id) directement
    const { error: historyError } = await supabase
      .from('matching_history')
      .insert({
        couple_id: couple_id, // couples.id directement
        conversation_id,
        service_type: search_criteria.service_type,
        search_criteria,
        results: sortedProviders,
      });

    if (historyError) {
      console.error('Erreur sauvegarde historique:', historyError);
    }

    console.log(`🎯 Top 3 scores: ${sortedProviders.map(p => p.score).join(', ')}`);

    return NextResponse.json({
      matches: sortedProviders,
      total_candidates: providers.length,
      search_criteria,
      created_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erreur matching:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}

function generateExplanation(breakdown: any, provider: any, criteria: any): string {
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
