import { updateSession, type UpdateSessionResult } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
  // 1. Rafraîchir la session Supabase (cookies) — c'est la seule chose critique
  const result = await updateSession(request) as UpdateSessionResult
  const { supabaseResponse, user } = result

  // 2. Header pathname pour les layouts (détection de route côté serveur)
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/sign-in') ||
    request.nextUrl.pathname.startsWith('/sign-up')

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/prestataire') ||
    request.nextUrl.pathname.startsWith('/couple')

  // 3. Non connecté + route protégée → redirect sign-in
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // 4. Connecté + route auth → redirect vers la home
  //    (les layouts couple/prestataire gèrent la redirection vers le bon dashboard)
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 5. Tout le reste : laisser passer
  //    La vérification du rôle (couple vs prestataire) est faite par les layouts protégés
  //    Cela évite les queries DB dans le middleware et les race conditions
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
