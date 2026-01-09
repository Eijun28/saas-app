// app/auth/confirm/page.tsx

'use client';

import Particles from '@/components/Particles'

export default function ConfirmEmail() {

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

      <div className="text-center max-w-md px-6">

        <h1 className="text-2xl font-bold mb-4">

          Vérifiez votre email

        </h1>

        <p className="text-gray-600 mb-4">

          Nous vous avons envoyé un email de confirmation. 

          Cliquez sur le lien dans l'email pour activer votre compte.

        </p>

        <p className="text-sm text-gray-500">

          Vous n'avez pas reçu l'email ? Vérifiez vos spams.

        </p>

      </div>

    </div>
    </>

  );

}
