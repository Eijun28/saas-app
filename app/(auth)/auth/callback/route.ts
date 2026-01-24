import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { translateAuthError } from '@/lib/auth/error-translations'
import { getUserRoleServer, getDashboardUrl } from '@/lib/auth/utils'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    // Échanger le code pour une session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      logger.error('Erreur callback:', error)
      const translatedError = translateAuthError(error.message || 'callback_error')
      // Encoder l'erreur pour l'URL
      const encodedError = encodeURIComponent(translatedError)
      return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=${encodedError}`)
    }

    // Récupérer l'utilisateur
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Utiliser la fonction utilitaire centralisée pour vérifier le rôle
      const roleCheck = await getUserRoleServer(user.id)
      
      if (roleCheck.role) {
        // Profil trouvé, rediriger vers le dashboard approprié
        const dashboardUrl = getDashboardUrl(roleCheck.role)
        return NextResponse.redirect(`${requestUrl.origin}${dashboardUrl}`)
      }

      // Si ni couple ni prestataire trouvé, essayer de récupérer le rôle depuis les métadonnées
      // et créer le profil manquant si possible
      logger.warn('Utilisateur trouvé mais aucun profil couple/prestataire:', { userId: user.id, email: user.email })
      
      // Récupérer le rôle depuis les métadonnées de l'utilisateur
      const userRole = user.user_metadata?.role as 'couple' | 'prestataire' | undefined
      
      if (userRole && (userRole === 'couple' || userRole === 'prestataire')) {
        logger.info('Tentative de récupération du profil manquant...', { userId: user.id, role: userRole })
        
        try {
          const adminClient = createAdminClient()
          
          if (userRole === 'couple') {
            // Essayer de créer le profil couple manquant
            const { error: coupleError } = await adminClient
              .from('couples')
              .insert({
                id: user.id,
                user_id: user.id,
                email: user.email || '',
                partner_1_name: user.user_metadata?.prenom || '',
                partner_2_name: user.user_metadata?.nom || '',
              })
            
            if (!coupleError) {
              logger.info('✅ Profil couple récupéré avec succès', { userId: user.id })
              // Créer aussi les préférences vides
              try {
                await adminClient
                  .from('couple_preferences')
                  .insert({
                    couple_id: user.id,
                    languages: ['français'],
                    essential_services: [],
                    optional_services: [],
                    cultural_preferences: {},
                    service_priorities: {},
                    budget_breakdown: {},
                    profile_completed: false,
                    completion_percentage: 0,
                    onboarding_step: 0,
                  })
              } catch (prefError) {
                // Ne pas bloquer si les préférences échouent
                logger.warn('Erreur création préférences (non bloquant):', prefError)
              }
              
              return NextResponse.redirect(`${requestUrl.origin}/couple/dashboard`)
            } else {
              logger.error('Erreur lors de la récupération du profil couple:', coupleError)
            }
          } else {
            // Essayer de créer le profil prestataire manquant
            const { error: profileError } = await adminClient
              .from('profiles')
              .upsert({
                id: user.id,
                email: user.email || '',
                role: 'prestataire',
                prenom: user.user_metadata?.prenom || null,
                nom: user.user_metadata?.nom || null,
                nom_entreprise: user.user_metadata?.nom_entreprise || null,
              }, {
                onConflict: 'id'
              })
            
            if (!profileError) {
              logger.info('✅ Profil prestataire récupéré avec succès', { userId: user.id })
              return NextResponse.redirect(`${requestUrl.origin}/prestataire/dashboard`)
            } else {
              logger.error('Erreur lors de la récupération du profil prestataire:', profileError)
            }
          }
        } catch (recoveryError: any) {
          logger.error('Erreur lors de la tentative de récupération du profil:', recoveryError)
        }
      }
      
      // Si la récupération a échoué ou si le rôle n'est pas dans les métadonnées
      // Rediriger vers une page de récupération avec un message explicite
      const errorMessage = encodeURIComponent(
        'Votre compte a été créé mais votre profil n\'est pas encore complet. ' +
        'Nous avons tenté de le récupérer automatiquement. ' +
        'Si le problème persiste, veuillez contacter le support.'
      )
      return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=${errorMessage}&recovery=true`)
    }
  }

  // Fallback
  return NextResponse.redirect(`${requestUrl.origin}/`)
}

