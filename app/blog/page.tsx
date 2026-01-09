'use client'

import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'
import Particles from '@/components/Particles'

export default function BlogPage() {
  return (
    <SmoothScrollProvider>
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

      <div className="min-h-screen bg-background pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4" style={{ color: '#823F91' }}>
              Blog NUPLY
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez nos articles sur les mariages multiculturels, les tendances et nos conseils
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#823F91' }}>
                Bientôt disponible
              </h2>
              <p className="text-gray-600">
                Notre blog est en cours de préparation. Revenez bientôt pour découvrir nos articles sur les mariages multiculturels, 
                les tendances, les conseils de nos experts et bien plus encore !
              </p>
            </div>
          </div>
        </div>
      </div>
    </SmoothScrollProvider>
  )
}
