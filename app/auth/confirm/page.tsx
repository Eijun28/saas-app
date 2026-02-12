// app/auth/confirm/page.tsx

'use client';

import Particles from '@/components/Particles'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'

export default function ConfirmEmail() {
  const searchParams = useSearchParams()
  const emailWarning = searchParams.get('emailWarning')

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

      <div className="flex min-h-screen items-center justify-center relative z-10">

      <div className="text-center max-w-md px-4 sm:px-6">

        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          Vérifiez votre email
        </h1>

        {emailWarning ? (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-orange-800">{emailWarning}</p>
          </div>
        ) : (
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Nous vous avons envoyé un email de confirmation.
            Cliquez sur le lien dans l'email pour activer votre compte.
          </p>
        )}

        <p className="text-sm text-gray-500 mb-6">
          Vous n'avez pas reçu l'email ? Vérifiez vos spams.
        </p>

        <Link href="/sign-in">
          <Button
            className="w-full sm:w-auto bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base min-h-[44px]"
          >
            Se connecter
          </Button>
        </Link>

      </div>

    </div>
    </>
  );
}
