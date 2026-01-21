// app/api/matching/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTotalScore } from '@/lib/matching/scoring';
import { MatchingRequest, ProviderMatch } from '@/types/matching';

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

    console.log('🔍 Matching pour:', search_criteria.service_type);

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
      .eq('role', 'prestataire')
      .eq('service_type', search_criteria.service_type);

    // Filtre budget si défini
    if (search_criteria.budget_max) {
      query = query.lte('budget_min', search_criteria.budget_max);
    }

    const { data: providers, error } = await query;

    if (error) {
      console.error('Erreur Supabase:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la recherche' },
        { status: 500 }
      );
    }

    if (!providers || providers.length === 0) {
      return NextResponse.json({
        matches: [],
        total_candidates: 0,
        search_criteria,
      });
    }

    console.log(`✅ ${providers.length} prestataires trouvés`);

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
    const { error: historyError } = await supabase
      .from('matching_history')
      .insert({
        couple_id,
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
