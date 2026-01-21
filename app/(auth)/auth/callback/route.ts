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
      // Si l'utilisateur est dans couples, c'est forcément un couple
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (couple && !coupleError) {
        return NextResponse.redirect(`${requestUrl.origin}/couple/dashboard`)
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
        return NextResponse.redirect(`${requestUrl.origin}/prestataire/dashboard`)
      }

      // Si ni couple ni prestataire trouvé, rediriger vers sign-in avec message
      // Cela peut arriver si l'inscription n'est pas complète ou si le profil n'a pas été créé
      console.warn('Utilisateur trouvé mais aucun profil couple/prestataire:', user.id)
      const errorMessage = encodeURIComponent('Votre compte a été créé mais votre profil n\'est pas encore complet. Veuillez vous connecter ou contacter le support.')
      return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=${errorMessage}`)
    }
  }

  // Fallback
  return NextResponse.redirect(`${requestUrl.origin}/`)
}

