import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { requireEnv } from '@/lib/security';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
  }

  return { supabaseResponse, user: error ? null : user };
}

