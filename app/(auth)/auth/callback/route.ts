import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Vérifier si profil existe
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        const dashboardUrl =
          profile.role === 'couple' ? '/couple/dashboard' : '/prestataire/dashboard'
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    }
  }

  return NextResponse.redirect(new URL('/', request.url))
}

