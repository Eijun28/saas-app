import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { translateAuthError } from '@/lib/auth/error-translations'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    // Échanger le code pour une session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Erreur callback:', error)
      const translatedError = translateAuthError(error.message || 'callback_error')
      // Encoder l'erreur pour l'URL
      const encodedError = encodeURIComponent(translatedError)
      return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=${encodedError}`)
    }

    // Récupérer l'utilisateur
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Vérifier d'abord dans couples
      const { data: couple } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (couple) {
        return NextResponse.redirect(`${requestUrl.origin}/couple/dashboard`)
      }

      // Sinon vérifier dans profiles (prestataires uniquement)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .eq('role', 'prestataire')
        .single()

      if (profile && profile.role === 'prestataire') {
        return NextResponse.redirect(`${requestUrl.origin}/prestataire/dashboard`)
      }
    }
  }

  // Fallback
  return NextResponse.redirect(`${requestUrl.origin}/`)
}

