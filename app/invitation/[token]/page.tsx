'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import Particles from '@/components/Particles'

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'accepted'>('loading')
  const [invitation, setInvitation] = useState<any>(null)
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
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/collaborateurs/invitation/${token}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setStatus('invalid')
        } else if (response.status === 410) {
          setStatus('expired')
        } else {
          setStatus('invalid')
        }
        setLoading(false)
        return
      }

      setInvitation(data.invitation)
      
      // Vérifier si l'invitation est déjà acceptée
      if (data.invitation.accepted_at) {
        setStatus('accepted')
      } else {
        setStatus('valid')
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'invitation:', error)
      setStatus('invalid')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!user) {
      // Rediriger vers la page de connexion avec le token en paramètre
      router.push(`/sign-in?invitation=${token}`)
      return
    }

    try {
      const response = await fetch(`/api/collaborateurs/invitation/${token}/accept`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'acceptation')
      }

      setStatus('accepted')
      // Rediriger vers le dashboard après quelques secondes
      setTimeout(() => {
        router.push('/couple/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Erreur lors de l\'acceptation:', error)
      toast.error(error.message || 'Erreur lors de l\'acceptation de l\'invitation')
    }
  }

  if (loading) {
    return (
      <>
        {/* Background de particules - couvre toute la page */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
          <Particles
            particleCount={200}
            particleSpread={10}
            speed={0.24}
            particleColors={["#823F91","#c081e3","#823F91"]}
            moveParticlesOnHover={false}
            particleHoverFactor={1}
            alphaParticles={false}
            particleBaseSize={50}
            sizeRandomness={0.5}
            cameraDistance={20}
            disableRotation={false}
            className=""
          />
        </div>
        <div className="min-h-screen bg-gradient-to-br from-[#F5E9AD] via-[#F6B4AD] to-[#F5DCBA] flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#823F91]" />
            <p className="text-[#4A4A4A]">Vérification de l'invitation...</p>
          </CardContent>
        </Card>
      </div>
      </>
    )
  }

  if (status === 'invalid') {
    return (
      <>
        {/* Background de particules - couvre toute la page */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
          <Particles
            particleCount={200}
            particleSpread={10}
            speed={0.24}
            particleColors={["#823F91","#c081e3","#823F91"]}
            moveParticlesOnHover={false}
            particleHoverFactor={1}
            alphaParticles={false}
            particleBaseSize={50}
            sizeRandomness={0.5}
            cameraDistance={20}
            disableRotation={false}
            className=""
          />
        </div>
        <div className="min-h-screen bg-gradient-to-br from-[#F5E9AD] via-[#F6B4AD] to-[#F5DCBA] flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-semibold text-[#0D0D0D] mb-2">
              Invitation invalide
            </h1>
            <p className="text-[#4A4A4A] mb-6">
              Cette invitation n'existe pas ou a été révoquée.
            </p>
            <Link href="/">
              <Button className="bg-[#823F91] hover:bg-[#6D3478] text-white">
                Retour à l'accueil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      </>
    )
  }

  if (status === 'expired') {
    return (
      <>
        {/* Background de particules - couvre toute la page */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
          <Particles
            particleCount={200}
            particleSpread={10}
            speed={0.24}
            particleColors={["#823F91","#c081e3","#823F91"]}
            moveParticlesOnHover={false}
            particleHoverFactor={1}
            alphaParticles={false}
            particleBaseSize={50}
            sizeRandomness={0.5}
            cameraDistance={20}
            disableRotation={false}
            className=""
          />
        </div>
        <div className="min-h-screen bg-gradient-to-br from-[#F5E9AD] via-[#F6B4AD] to-[#F5DCBA] flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h1 className="text-2xl font-semibold text-[#0D0D0D] mb-2">
              Invitation expirée
            </h1>
            <p className="text-[#4A4A4A] mb-6">
              Cette invitation a expiré. Veuillez demander une nouvelle invitation.
            </p>
            <Link href="/">
              <Button className="bg-[#823F91] hover:bg-[#6D3478] text-white">
                Retour à l'accueil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      </>
    )
  }

  if (status === 'accepted') {
    return (
      <>
        {/* Background de particules - couvre toute la page */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
          <Particles
            particleCount={200}
            particleSpread={10}
            speed={0.24}
            particleColors={["#823F91","#c081e3","#823F91"]}
            moveParticlesOnHover={false}
            particleHoverFactor={1}
            alphaParticles={false}
            particleBaseSize={50}
            sizeRandomness={0.5}
            cameraDistance={20}
            disableRotation={false}
            className=""
          />
        </div>
        <div className="min-h-screen bg-gradient-to-br from-[#F5E9AD] via-[#F6B4AD] to-[#F5DCBA] flex items-center justify-center p-4 relative z-10">
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
              Invitation acceptée !
            </h1>
            <p className="text-[#4A4A4A] mb-6">
              Vous avez été ajouté comme collaborateur. Redirection en cours...
            </p>
            <Link href="/couple/dashboard">
              <Button className="bg-[#823F91] hover:bg-[#6D3478] text-white">
                Aller au dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      </>
    )
  }

  return (
    <>
      {/* Background de particules - couvre toute la page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
        <Particles
          particleCount={200}
          particleSpread={10}
          speed={0.24}
          particleColors={["#823F91","#c081e3","#823F91"]}
          moveParticlesOnHover={false}
          particleHoverFactor={1}
          alphaParticles={false}
          particleBaseSize={50}
          sizeRandomness={0.5}
          cameraDistance={20}
          disableRotation={false}
          className=""
        />
      </div>
      <div className="min-h-screen bg-gradient-to-br from-[#F5E9AD] via-[#F6B4AD] to-[#F5DCBA] flex items-center justify-center p-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#E8D4EF] flex items-center justify-center">
              <Mail className="h-8 w-8 text-[#823F91]" />
            </div>
            <CardTitle className="text-2xl">Vous êtes invité !</CardTitle>
            <CardDescription className="text-base mt-2">
              {invitation?.name} vous invite à collaborer sur leur mariage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#6B7280]">Rôle :</span>
                <span className="text-sm font-medium text-[#0D0D0D]">{invitation?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#6B7280]">Email :</span>
                <span className="text-sm font-medium text-[#0D0D0D]">{invitation?.email}</span>
              </div>
            </div>

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
                  Accepter l'invitation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[#4A4A4A] text-center">
                  Vous devez vous connecter ou créer un compte pour accepter cette invitation.
                </p>
                <div className="flex gap-3">
                  <Link href={`/sign-in?invitation=${token}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="lg">
                      Se connecter
                    </Button>
                  </Link>
                  <Link href={`/sign-up?invitation=${token}`} className="flex-1">
                    <Button className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white" size="lg">
                      Créer un compte
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </>
  )
}

