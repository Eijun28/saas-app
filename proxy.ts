import { updateSession, type UpdateSessionResult } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  const result = await updateSession(request) as UpdateSessionResult
  const { supabaseResponse, user } = result

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/sign-in') ||
    request.nextUrl.pathname.startsWith('/sign-up')

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/prestataire') ||
    request.nextUrl.pathname.startsWith('/couple')

  // Non connecté + route protégée = redirect connexion
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Créer un client Supabase pour vérifier le profil
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // Ne rien faire dans le proxy
        },
      },
    }
  )

  // Connecté + route auth = redirect vers dashboard
  if (user && isAuthRoute) {
    // Vérifier d'abord dans la table couples
    // Si l'utilisateur est dans couples, c'est forcément un couple
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (couple && !coupleError) {
      return NextResponse.redirect(new URL('/couple/dashboard', request.url))
    }

    // Sinon vérifier dans profiles
    // Si l'utilisateur est dans profiles, c'est forcément un prestataire
    // (car seuls les prestataires sont stockés dans profiles)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (profile && !profileError) {
      return NextResponse.redirect(new URL('/prestataire/dashboard', request.url))
    }
  }

  // Protection : empêcher un prestataire d'accéder aux routes couple et vice versa
  if (user && isProtectedRoute) {
    const isTryingToAccessCouple = request.nextUrl.pathname.startsWith('/couple')
    const isTryingToAccessPrestataire = request.nextUrl.pathname.startsWith('/prestataire')

    // Vérifier d'abord dans la table couples
    // Si l'utilisateur est dans couples, c'est forcément un couple
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (couple && !coupleError) {
      // Couple essaie d'accéder à une route prestataire
      if (isTryingToAccessPrestataire) {
        return NextResponse.redirect(new URL('/couple/dashboard', request.url))
      }
      // Sinon, c'est bon, le couple accède à ses routes
      return supabaseResponse
    }

    // Sinon vérifier dans profiles
    // Si l'utilisateur est dans profiles, c'est forcément un prestataire
    // (car seuls les prestataires sont stockés dans profiles)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (profile && !profileError) {
      // Prestataire essaie d'accéder à une route couple
      if (isTryingToAccessCouple) {
        return NextResponse.redirect(new URL('/prestataire/dashboard', request.url))
      }
      // Sinon, c'est bon, le prestataire accède à ses routes
      return supabaseResponse
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/prestataire/:path*',
    '/couple/:path*',
    '/sign-in',
    '/sign-up/:path*',
  ],
}

