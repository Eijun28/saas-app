import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import type { User } from '@supabase/supabase-js';
import { getPublicEnvConfig } from '@/lib/config/env';

export type UpdateSessionResult = {
  supabaseResponse: NextResponse;
  user: User | null;
};

export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  // ✅ PROTECTION CSRF : Vérifier origin pour les requêtes mutantes
  const method = request.method
  const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)

  if (isMutating) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    // Autoriser uniquement les requêtes du même origin (comparaison stricte du hostname)
    if (origin && host) {
      try {
        const originHostname = new URL(origin).hostname
        const hostWithoutPort = host.split(':')[0]
        if (originHostname !== hostWithoutPort) {
          return {
            supabaseResponse: NextResponse.json(
              { error: 'CSRF detected: Invalid origin' },
              { status: 403 }
            ),
            user: null
          }
        }
      } catch {
        return {
          supabaseResponse: NextResponse.json(
            { error: 'CSRF detected: Invalid origin' },
            { status: 403 }
          ),
          user: null
        }
      }
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Utiliser la configuration validée
  const config = getPublicEnvConfig()

  const supabase = createServerClient(
    config.NEXT_PUBLIC_SUPABASE_URL,
    config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Récupérer l'utilisateur
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Si erreur de session manquante, c'est normal pour les utilisateurs non connectés
  // On ne fait rien, on retourne simplement null pour user
  if (error && !error.message.includes('Auth session missing')) {
    logger.error('Erreur lors de la récupération de l\'utilisateur', error);
  }

  return { supabaseResponse, user: error ? null : user };
}

