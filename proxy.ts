import { updateSession, type UpdateSessionResult } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserRoleServer, getDashboardUrl } from '@/lib/auth/utils'

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

  // Connecté + route auth = redirect vers dashboard
  if (user && isAuthRoute) {
    const roleCheck = await getUserRoleServer(user.id)
    
    if (roleCheck.role) {
      const dashboardUrl = getDashboardUrl(roleCheck.role)
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }
  }

  // Protection : empêcher un prestataire d'accéder aux routes couple et vice versa
  if (user && isProtectedRoute) {
    const isTryingToAccessCouple = request.nextUrl.pathname.startsWith('/couple')
    const isTryingToAccessPrestataire = request.nextUrl.pathname.startsWith('/prestataire')
    
    const roleCheck = await getUserRoleServer(user.id)
    
    if (roleCheck.role === 'couple') {
      // Couple essaie d'accéder à une route prestataire
      if (isTryingToAccessPrestataire) {
        return NextResponse.redirect(new URL('/couple/dashboard', request.url))
      }
      // Sinon, c'est bon, le couple accède à ses routes
      return supabaseResponse
    }
    
    if (roleCheck.role === 'prestataire') {
      // Prestataire essaie d'accéder à une route couple
      if (isTryingToAccessCouple) {
        return NextResponse.redirect(new URL('/prestataire/dashboard', request.url))
      }
      // Sinon, c'est bon, le prestataire accède à ses routes
      return supabaseResponse
    }
    
    // Si aucun rôle trouvé, rediriger vers sign-in
    if (!roleCheck.role) {
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

