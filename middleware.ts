import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { getEnvConfig } from '@/lib/config/env'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname

  // Set pathname header so layouts can detect the current route
  supabaseResponse.headers.set('x-pathname', pathname)

  // Guard: prestataire dashboard pages require completed onboarding
  // Skip if already on the onboarding page or non-prestataire routes
  if (
    user &&
    pathname.startsWith('/prestataire') &&
    !pathname.startsWith('/prestataire/onboarding')
  ) {
    const config = getEnvConfig()
    const supabase = createServerClient(
      config.NEXT_PUBLIC_SUPABASE_URL,
      config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Read-only in this context
          },
        },
      }
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_step')
      .eq('id', user.id)
      .maybeSingle()

    if (profile && (profile.onboarding_step ?? 0) < 5) {
      const url = request.nextUrl.clone()
      url.pathname = '/prestataire/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
