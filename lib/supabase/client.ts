/**
 * Client Supabase pour le navigateur
 * Utilise la configuration validée au démarrage
 */
import { createBrowserSupabaseClient } from '@/lib/config/supabase-client'

export const createClient = createBrowserSupabaseClient

export type SupabaseClient = ReturnType<typeof createBrowserSupabaseClient>
