'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, Building2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import Particles from '@/components/Particles'

interface InvitationData {
  email: string
  nom_entreprise?: string
  prenom?: string
  nom?: string
  service_type?: string
  message?: string
}

type InvitationStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'accepted' | 'accepting'

export default function RejoindrePrestatairePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [status, setStatus] = useState<InvitationStatus>('loading')
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkInvitation()
    checkUser()
  }, [token])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const checkInvitation = async () => {
    if (!token) {
      setStatus('invalid')
      return
    }

    try {
      const response = await fetch(`/api/vendor-invitations/${token}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 410) {
          setStatus(data.accepted ? 'accepted' : 'expired')
        } else {
          setStatus('invalid')
        }
        return
      }

      setInvitation(data.invitation)
      setStatus('valid')
    } catch {
      setStatus('invalid')
    }
  }

  const handleAccept = async () => {
    if (!user) {
      // Rediriger vers inscription prestataire avec le token
      router.push(`/sign-up?role=prestataire&invitation=${token}`)
      return
    }

    setStatus('accepting')
    try {
      const response = await fetch(`/api/vendor-invitations/${token}/accept`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'acceptation')
      }

      setStatus('accepted')
      toast.success('Bienvenue sur Nuply !')

      setTimeout(() => {
        router.push(data.redirect || '/prestataire/profil-public')
      }, 1500)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'acceptation')
      setStatus('valid')
    }
  }

  const particlesConfig = {
    particleCount: 200,
    particleSpread: 10,
    speed: 0.24,
    particleColors: ['#823F91', '#c081e3', '#823F91'] as string[],
    moveParticlesOnHover: false,
    particleHoverFactor: 1,
    alphaParticles: false,
    particleBaseSize: 50,
    sizeRandomness: 0.5,
    cameraDistance: 20,
    disableRotation: false,
    className: '',
  }

  const renderParticles = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
      <Particles {...particlesConfig} />
    </div>
  )

  const renderWrapper = (children: React.ReactNode) => (
    <>
      {renderParticles()}
      <div className="min-h-screen bg-gradient-to-br from-[#F5E9AD] via-[#F6B4AD] to-[#F5DCBA] flex items-center justify-center p-4 relative z-10">
        {children}
      </div>
    </>
  )

  // Loading
  if (status === 'loading') {
    return renderWrapper(
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#823F91]" />
          <p className="text-[#4A4A4A]">Vérification de l'invitation...</p>
        </CardContent>
      </Card>
    )
  }

  // Invalid
  if (status === 'invalid') {
    return renderWrapper(
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-semibold text-[#0D0D0D] mb-2">
            Invitation invalide
          </h1>
          <p className="text-[#4A4A4A] mb-6">
            Ce lien d'invitation n'est pas valide ou a été révoqué.
          </p>
          <Link href="/sign-up?role=prestataire">
            <Button className="bg-[#823F91] hover:bg-[#6D3478] text-white">
              Créer un compte prestataire
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Expired
  if (status === 'expired') {
    return renderWrapper(
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          <h1 className="text-2xl font-semibold text-[#0D0D0D] mb-2">
            Invitation expirée
          </h1>
          <p className="text-[#4A4A4A] mb-6">
            Ce lien d'invitation a expiré. Vous pouvez toujours créer un compte directement.
          </p>
          <Link href="/sign-up?role=prestataire">
            <Button className="bg-[#823F91] hover:bg-[#6D3478] text-white">
              Créer un compte prestataire
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Accepted
  if (status === 'accepted') {
    return renderWrapper(
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          </motion.div>
          <h1 className="text-2xl font-semibold text-[#0D0D0D] mb-2">
            Bienvenue sur Nuply !
          </h1>
          <p className="text-[#4A4A4A] mb-6">
            Votre compte prestataire est prêt. Complétez votre profil pour commencer à recevoir des demandes.
          </p>
          <Link href="/prestataire/profil-public">
            <Button className="bg-[#823F91] hover:bg-[#6D3478] text-white">
              Compléter mon profil
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Accepting
  if (status === 'accepting') {
    return renderWrapper(
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#823F91]" />
          <p className="text-[#4A4A4A]">Création de votre espace prestataire...</p>
        </CardContent>
      </Card>
    )
  }

  // Valid - show invitation details
  return renderWrapper(
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#E8D4EF] flex items-center justify-center">
            <Building2 className="h-8 w-8 text-[#823F91]" />
          </div>
          <CardTitle className="text-2xl">Rejoignez Nuply</CardTitle>
          <CardDescription className="text-base mt-2">
            Créez votre profil prestataire et commencez à recevoir des demandes de couples
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Infos pré-remplies */}
          {(invitation?.nom_entreprise || invitation?.service_type || invitation?.prenom) && (
            <div className="bg-[#F0FDF4] rounded-lg p-4 space-y-2 border border-green-100">
              <p className="text-sm font-medium text-green-800 mb-2">
                Votre profil sera pré-rempli avec :
              </p>
              {invitation.nom_entreprise && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B7280]">Entreprise :</span>
                  <span className="text-sm font-medium text-[#0D0D0D]">{invitation.nom_entreprise}</span>
                </div>
              )}
              {invitation.prenom && invitation.nom && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B7280]">Nom :</span>
                  <span className="text-sm font-medium text-[#0D0D0D]">
                    {invitation.prenom} {invitation.nom}
                  </span>
                </div>
              )}
              {invitation.service_type && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B7280]">Service :</span>
                  <span className="text-sm font-medium text-[#0D0D0D]">{invitation.service_type}</span>
                </div>
              )}
            </div>
          )}

          {/* Message personnel */}
          {invitation?.message && (
            <div className="bg-[#F9FAFB] rounded-lg p-4 border-l-4 border-[#823F91]">
              <p className="text-sm italic text-[#4A4A4A]">"{invitation.message}"</p>
            </div>
          )}

          {/* Actions */}
          {user ? (
            <div className="space-y-4">
              <p className="text-sm text-[#4A4A4A] text-center">
                Connecté en tant que <strong>{user.email}</strong>
              </p>
              <Button
                onClick={handleAccept}
                className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white"
                size="lg"
              >
                Activer mon compte prestataire
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#4A4A4A] text-center">
                Créez votre compte en quelques secondes
              </p>
              <Button
                onClick={() => router.push(`/sign-up?role=prestataire&invitation=${token}`)}
                className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white"
                size="lg"
              >
                Créer mon compte prestataire
              </Button>
              <div className="text-center">
                <Link
                  href={`/sign-in?invitation=${token}&redirect=/rejoindre/${token}`}
                  className="text-sm text-[#823F91] hover:underline"
                >
                  Déjà inscrit ? Se connecter
                </Link>
              </div>
            </div>
          )}

          {/* Avantages rapides */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <span className="text-sm text-[#4A4A4A]">Inscription gratuite</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <span className="text-sm text-[#4A4A4A]">Recevez des demandes de couples qualifiés</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <span className="text-sm text-[#4A4A4A]">Gestion de devis et facturation intégrée</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
