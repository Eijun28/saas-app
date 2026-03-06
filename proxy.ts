import { updateSession, type UpdateSessionResult } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { getDashboardUrl } from '@/lib/auth/utils'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function proxy(request: NextRequest) {
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

  // Use admin client for role checks — getUserRoleServer creates a separate
  // Supabase client via cookies() which may not have the session tokens
  // available in the proxy context, causing RLS to block queries and
  // returning role=null even for authenticated users → redirect loop
  const adminClient = (user && (isAuthRoute || isProtectedRoute))
    ? createAdminClient()
    : null

  // Connecté + route auth = redirect vers dashboard
  if (user && isAuthRoute && adminClient) {
    const [{ data: couple }, { data: profile }] = await Promise.all([
      adminClient.from('couples').select('id').eq('user_id', user.id).maybeSingle(),
      adminClient.from('profiles').select('id').eq('id', user.id).maybeSingle(),
    ])
    const role = couple ? 'couple' : profile ? 'prestataire' : null

    if (role) {
      const dashboardUrl = getDashboardUrl(role)
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }
  }

  // Protection : empêcher un prestataire d'accéder aux routes couple et vice versa
  if (user && isProtectedRoute && adminClient) {
    const isTryingToAccessCouple = request.nextUrl.pathname.startsWith('/couple')
    const isTryingToAccessPrestataire = request.nextUrl.pathname.startsWith('/prestataire')

    const [{ data: couple }, { data: profile }] = await Promise.all([
      adminClient.from('couples').select('id').eq('user_id', user.id).maybeSingle(),
      adminClient.from('profiles').select('id, onboarding_step').eq('id', user.id).maybeSingle(),
    ])
    const role = couple ? 'couple' : profile ? 'prestataire' : null

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

      // Vérifier si l'onboarding guidé est terminé (sauf si déjà sur la page d'onboarding)
      if (!request.nextUrl.pathname.startsWith('/prestataire/onboarding')) {
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

