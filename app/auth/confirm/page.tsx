// app/auth/confirm/page.tsx

'use client';

import { Suspense } from 'react'
import Particles from '@/components/Particles'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { Mail, AlertTriangle } from 'lucide-react'

function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const emailWarning = searchParams.get('emailWarning')

  return (
    <>
      {emailWarning ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-orange-800">{emailWarning}</p>
        </div>
      ) : (
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Nous vous avons envoyé un email de confirmation à votre adresse.
          Cliquez sur le lien dans l&apos;email pour activer votre compte.
        </p>
      )}
    </>
  );
}

export default function ConfirmEmail() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const particleCount = isMobile ? 50 : 200

  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
        <Particles
          particleCount={particleCount}
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

          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#823F91] to-[#B855D6] shadow-lg shadow-purple-500/25">
            <Mail className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold mb-4">
            Vérifiez votre boîte mail
          </h1>

          <Suspense fallback={
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Nous vous avons envoyé un email de confirmation.
              Cliquez sur le lien dans l&apos;email pour activer votre compte.
            </p>
          }>
            <ConfirmEmailContent />
          </Suspense>

          {/* Message spam - visible et mis en avant */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Vous ne trouvez pas l&apos;email ?</strong> Pensez à vérifier votre dossier <strong>Spam</strong> ou <strong>Courrier indésirable</strong> — notre email s&apos;y retrouve parfois.
            </p>
          </div>

          <Link href="/sign-in">
            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#B855D6] text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base min-h-[44px]"
            >
              Aller à la connexion
            </Button>
          </Link>

        </div>
      </div>
    </>
  );
}
