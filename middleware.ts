import { updateSession, type UpdateSessionResult } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
  const result = await updateSession(request) as UpdateSessionResult
  const { supabaseResponse } = result

  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
