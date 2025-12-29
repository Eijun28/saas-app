import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Configuration CORS - Origines autorisées
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'https://nuply.com',
  'https://www.nuply.com',
  'http://localhost:3000',  // Dev local
  'http://localhost:3001',  // Dev local alternatif
].filter(Boolean) as string[]

// Fonction helper pour vérifier origine
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true  // Same-origin requests
  return ALLOWED_ORIGINS.some(allowed => origin === allowed)
}

/**
 * Configure les en-têtes CORS pour les requêtes API
 */
function configureCORS(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  
  // Si l'origine est autorisée, ajouter les en-têtes CORS
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

export async function middleware(request: NextRequest) {
  // ========== CORS PROTECTION ==========
  const origin = request.headers.get('origin')
  
  // Vérifier si origine autorisée (pour les requêtes cross-origin)
  if (origin && !isAllowedOrigin(origin)) {
    return new NextResponse('Forbidden - Invalid Origin', { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      }
    })
  }

  // Handle preflight requests (OPTIONS)
  // À ce stade, si origin existe, elle est déjà vérifiée et autorisée
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // ========== SUITE DU CODE EXISTANT ==========
  const { supabaseResponse, user } = await updateSession(request)
  
  // Appliquer CORS à toutes les réponses
  const response = configureCORS(supabaseResponse, request);

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/sign-in') ||
    request.nextUrl.pathname.startsWith('/sign-up')

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/prestataire') ||
    request.nextUrl.pathname.startsWith('/couple')


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
          // Ne rien faire dans le middleware
        },
      },
    }
  )

  // Connecté + route auth = redirect vers dashboard
  if (user && isAuthRoute) {
    // Vérifier d'abord dans la table couples
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .eq('id', user.id)
      .single()

    if (couple) {
      return configureCORS(NextResponse.redirect(new URL('/couple/dashboard', request.url)), request)
    }

    // Sinon vérifier dans profiles (prestataires)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      return configureCORS(NextResponse.redirect(new URL('/prestataire/dashboard', request.url)), request)
    }
  }

  // Protection : empêcher un prestataire d'accéder aux routes couple et vice versa
  if (user && isProtectedRoute) {
    const isTryingToAccessCouple = request.nextUrl.pathname.startsWith('/couple')
    const isTryingToAccessPrestataire = request.nextUrl.pathname.startsWith('/prestataire')

    // Vérifier d'abord dans la table couples
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .eq('id', user.id)
      .single()

    if (couple) {
      // Couple essaie d'accéder à une route prestataire
      if (isTryingToAccessPrestataire) {
        return configureCORS(NextResponse.redirect(new URL('/couple/dashboard', request.url)), request)
      }
      // Sinon, c'est bon, le couple accède à ses routes
      return response
    }

    // Sinon vérifier dans profiles (prestataires)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      // Prestataire essaie d'accéder à une route couple
      if (isTryingToAccessCouple) {
        return configureCORS(NextResponse.redirect(new URL('/prestataire/dashboard', request.url)), request)
      }
      // Sinon, c'est bon, le prestataire accède à ses routes
      return response
    }
  }

  // Non connecté + route protégée = redirect connexion
  if (!user && isProtectedRoute) {
    return configureCORS(NextResponse.redirect(new URL('/sign-in', request.url)), request)
  }

  return response
}

export const config = {
  matcher: [
    '/prestataire/:path*',
    '/couple/:path*',
    '/sign-in',
    '/sign-up/:path*',
    '/api/:path*',
  ],
}

