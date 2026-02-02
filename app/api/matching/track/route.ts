// app/api/matching/track/route.ts
// API pour tracker les clics et contacts sur les prestataires
// Permet d'alimenter le systeme d'equite

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

interface TrackingRequest {
  provider_id: string;
  service_type: string;
  event_type: 'click' | 'contact' | 'favorite' | 'hide';
  couple_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: TrackingRequest = await request.json();
    const { provider_id, service_type, event_type, couple_id } = body;

    // Validation
    if (!provider_id || !service_type || !event_type) {
      return NextResponse.json(
        { error: 'Donnees manquantes: provider_id, service_type et event_type requis' },
        { status: 400 }
      );
    }

    // Valider le type d'evenement
    const validEventTypes = ['click', 'contact', 'favorite', 'hide'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: `Type d'evenement invalide. Valeurs acceptees: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Enregistrer l'evenement selon le type
    let rpcResult;
    try {
      switch (event_type) {
        case 'click':
          rpcResult = await supabase.rpc('record_click', {
            p_profile_id: provider_id,
            p_service_type: service_type,
            p_couple_id: couple_id || null,
          });
          break;

        case 'contact':
          rpcResult = await supabase.rpc('record_contact', {
            p_profile_id: provider_id,
            p_service_type: service_type,
            p_couple_id: couple_id || null,
          });
          break;

        case 'favorite':
        case 'hide':
          // Pour favorite et hide, on enregistre juste dans les logs
          const { error: logError } = await supabase
            .from('impression_logs')
            .insert({
              profile_id: provider_id,
              service_type,
              couple_id: couple_id || null,
              event_type,
            });

          if (logError) {
            throw logError;
          }
          break;
      }

      if (rpcResult?.error) {
        throw rpcResult.error;
      }

      logger.debug(`✅ Evenement "${event_type}" enregistre pour prestataire ${provider_id}`);

      return NextResponse.json({
        success: true,
        event_type,
        provider_id,
        message: `Evenement "${event_type}" enregistre avec succes`,
      });
    } catch (dbError) {
      // Si les tables/fonctions n'existent pas encore, retourner succes silencieux
      logger.warn('⚠️ Tracking non disponible (migration peut-etre non appliquee):', dbError);

      return NextResponse.json({
        success: true,
        event_type,
        provider_id,
        message: 'Evenement recu (tracking en attente de migration)',
        warning: 'Les tables de tracking ne sont pas encore creees',
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Erreur tracking:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: errorMessage },
      { status: 500 }
    );
  }
}

// GET pour verifier le statut du tracking d'un prestataire
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('provider_id');
    const serviceType = searchParams.get('service_type');

    if (!providerId) {
      return NextResponse.json(
        { error: 'provider_id requis' },
        { status: 400 }
      );
    }

    // Recuperer les statistiques du prestataire
    let query = supabase
      .from('provider_impressions')
      .select('*')
      .eq('profile_id', providerId);

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    const { data, error } = await query;

    if (error) {
      // Si la table n'existe pas, retourner des donnees vides
      if (error.code === '42P01') {
        return NextResponse.json({
          provider_id: providerId,
          stats: [],
          message: 'Tracking non encore active',
        });
      }
      throw error;
    }

    return NextResponse.json({
      provider_id: providerId,
      stats: data || [],
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Erreur lecture tracking:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: errorMessage },
      { status: 500 }
    );
  }
}
