import { updateSession, type UpdateSessionResult } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

type UserRole = 'couple' | 'prestataire' | null

function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case 'couple':
      return '/couple/dashboard'
    case 'prestataire':
      return '/prestataire/dashboard'
    default:
      return '/'
  }
}

/**
 * Crée un client Supabase compatible Edge Runtime (utilise request.cookies, pas next/headers)
 */
function createEdgeSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() { /* read-only in middleware */ },
      },
    }
  )
}

/**
 * Vérifie le rôle utilisateur via les cookies de la request (compatible Edge Runtime)
 */
async function getUserRole(request: NextRequest, userId: string): Promise<UserRole> {
  const supabase = createEdgeSupabaseClient(request)
  const [{ data: couple }, { data: profile }] = await Promise.all([
    supabase.from('couples').select('id').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('id, onboarding_step').eq('id', userId).maybeSingle(),
  ])
  if (couple) return 'couple'
  if (profile) return 'prestataire'
  return null
}

export default async function middleware(request: NextRequest) {
  const result = await updateSession(request) as UpdateSessionResult
  const { supabaseResponse, user } = result

  // Set pathname header so layouts can detect the current route
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)

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

  // Connecté + route auth = redirect vers dashboard
  if (user && isAuthRoute) {
    const role = await getUserRole(request, user.id)
    if (role) {
      return NextResponse.redirect(new URL(getDashboardUrl(role), request.url))
    }
  }

  // Protection : empêcher un prestataire d'accéder aux routes couple et vice versa
  if (user && isProtectedRoute) {
    const isTryingToAccessCouple = request.nextUrl.pathname.startsWith('/couple')
    const isTryingToAccessPrestataire = request.nextUrl.pathname.startsWith('/prestataire')

    const role = await getUserRole(request, user.id)

    if (role === 'couple') {
      if (isTryingToAccessPrestataire) {
        return NextResponse.redirect(new URL('/couple/dashboard', request.url))
      }
      return supabaseResponse
    }

    if (role === 'prestataire') {
      if (isTryingToAccessCouple) {
        return NextResponse.redirect(new URL('/prestataire/dashboard', request.url))
      }

      // Vérifier si l'onboarding guidé est terminé
      if (!request.nextUrl.pathname.startsWith('/prestataire/onboarding')) {
        const supabase = createEdgeSupabaseClient(request)
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_step')
          .eq('id', user.id)
          .maybeSingle()

        if (profile && (profile.onboarding_step ?? 0) < 5) {
          return NextResponse.redirect(new URL('/prestataire/onboarding', request.url))
        }
      }

      return supabaseResponse
    }

    // Si aucun rôle trouvé, rediriger vers sign-in
    if (!role) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
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

