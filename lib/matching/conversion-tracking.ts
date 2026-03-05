/**
 * Matching Conversion Tracking
 *
 * Tracks when matching results lead to demandes (requests).
 * Records matching views and checks for conversions when demandes are created.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface MatchingConversion {
  couple_id: string;
  provider_id: string;
  service_type: string;
  matching_score: number;
  matching_rank: number;
  converted: boolean;
  conversion_delay_hours?: number;
}

/**
 * Record that a couple viewed matching results.
 * Called from the matching route after matches are calculated.
 * Uses admin client to bypass RLS.
 */
export async function recordMatchingView(
  coupleId: string,
  matches: Array<{ provider_id: string; score: number; rank: number; service_type: string }>
): Promise<void> {
  try {
    const supabase = createAdminClient();

    const rows = matches.map((match) => ({
      couple_id: coupleId,
      provider_id: match.provider_id,
      service_type: match.service_type,
      matching_score: match.score,
      matching_rank: match.rank,
      converted: false,
    }));

    const { error } = await supabase.from('matching_views').insert(rows);

    if (error) {
      // Log but don't throw — table may not exist yet if migration hasn't been applied
      logger.warn('Failed to record matching views:', error.message);
      return;
    }

    logger.debug(`Recorded ${rows.length} matching views for couple ${coupleId}`);
  } catch (err) {
    logger.warn(
      'Error recording matching views:',
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Check if a demande was preceded by a matching view.
 * Called when a demande is created to track conversions.
 * Returns the most recent unconverted matching view for this couple+provider pair.
 */
export async function checkMatchingConversion(
  coupleId: string,
  providerId: string
): Promise<{
  converted: boolean;
  matching_score?: number;
  matching_rank?: number;
  delay_hours?: number;
}> {
  try {
    const supabase = createAdminClient();

    // Find the most recent unconverted matching view for this couple+provider
    const { data, error } = await supabase
      .from('matching_views')
      .select('id, matching_score, matching_rank, created_at')
      .eq('couple_id', coupleId)
      .eq('provider_id', providerId)
      .eq('converted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return { converted: false };
    }

    // Calculate delay in hours between matching view and now
    const viewTime = new Date(data.created_at).getTime();
    const now = Date.now();
    const delayHours = parseFloat(((now - viewTime) / (1000 * 60 * 60)).toFixed(2));

    return {
      converted: true,
      matching_score: data.matching_score,
      matching_rank: data.matching_rank,
      delay_hours: delayHours,
    };
  } catch (err) {
    logger.warn(
      'Error checking matching conversion:',
      err instanceof Error ? err.message : err
    );
    return { converted: false };
  }
}

/**
 * Mark a matching view as converted when a demande is created.
 * Should be called after checkMatchingConversion returns converted: true.
 */
export async function markMatchingConversion(
  coupleId: string,
  providerId: string,
  demandeId: string
): Promise<void> {
  try {
    const supabase = createAdminClient();

    const now = new Date().toISOString();
    const viewTime = await getLatestViewTime(supabase, coupleId, providerId);
    const delayHours = viewTime
      ? parseFloat(((Date.now() - new Date(viewTime).getTime()) / (1000 * 60 * 60)).toFixed(2))
      : null;

    const { error } = await supabase
      .from('matching_views')
      .update({
        converted: true,
        converted_at: now,
        demande_id: demandeId,
        conversion_delay_hours: delayHours,
      })
      .eq('couple_id', coupleId)
      .eq('provider_id', providerId)
      .eq('converted', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      logger.warn('Failed to mark matching conversion:', error.message);
    }
  } catch (err) {
    logger.warn(
      'Error marking matching conversion:',
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Get the created_at of the latest unconverted view for a couple+provider pair.
 */
async function getLatestViewTime(
  supabase: ReturnType<typeof createAdminClient>,
  coupleId: string,
  providerId: string
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('matching_views')
      .select('created_at')
      .eq('couple_id', coupleId)
      .eq('provider_id', providerId)
      .eq('converted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data?.created_at ?? null;
  } catch {
    return null;
  }
}

/**
 * Get conversion stats for analytics.
 * Optionally filtered by service type.
 */
export async function getConversionStats(
  serviceType?: string
): Promise<{
  total_views: number;
  total_conversions: number;
  conversion_rate: number;
  avg_delay_hours: number;
}> {
  const emptyStats = {
    total_views: 0,
    total_conversions: 0,
    conversion_rate: 0,
    avg_delay_hours: 0,
  };

  try {
    const supabase = createAdminClient();

    // Count total views
    let viewsQuery = supabase
      .from('matching_views')
      .select('*', { count: 'exact', head: true });

    if (serviceType) {
      viewsQuery = viewsQuery.eq('service_type', serviceType);
    }

    const { count: totalViews, error: viewsError } = await viewsQuery;

    if (viewsError) {
      logger.warn('Failed to get conversion stats (views):', viewsError.message);
      return emptyStats;
    }

    // Count conversions
    let conversionsQuery = supabase
      .from('matching_views')
      .select('*', { count: 'exact', head: true })
      .eq('converted', true);

    if (serviceType) {
      conversionsQuery = conversionsQuery.eq('service_type', serviceType);
    }

    const { count: totalConversions, error: conversionsError } = await conversionsQuery;

    if (conversionsError) {
      logger.warn('Failed to get conversion stats (conversions):', conversionsError.message);
      return emptyStats;
    }

    // Get average delay for conversions
    let delayQuery = supabase
      .from('matching_views')
      .select('conversion_delay_hours')
      .eq('converted', true)
      .not('conversion_delay_hours', 'is', null);

    if (serviceType) {
      delayQuery = delayQuery.eq('service_type', serviceType);
    }

    const { data: delayData, error: delayError } = await delayQuery;

    if (delayError) {
      logger.warn('Failed to get conversion stats (delay):', delayError.message);
    }

    const views = totalViews ?? 0;
    const conversions = totalConversions ?? 0;

    let avgDelay = 0;
    if (delayData && delayData.length > 0) {
      const totalDelay = delayData.reduce(
        (sum, row) => sum + (Number(row.conversion_delay_hours) || 0),
        0
      );
      avgDelay = parseFloat((totalDelay / delayData.length).toFixed(2));
    }

    return {
      total_views: views,
      total_conversions: conversions,
      conversion_rate: views > 0 ? parseFloat(((conversions / views) * 100).toFixed(2)) : 0,
      avg_delay_hours: avgDelay,
    };
  } catch (err) {
    logger.warn(
      'Error getting conversion stats:',
      err instanceof Error ? err.message : err
    );
    return emptyStats;
  }
}
