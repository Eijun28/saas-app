'use client';

import Particles from '@/components/Particles';

export default function NotreVisionPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background" style={{ position: 'relative' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
        <Particles
          particleCount={200}
          particleSpread={10}
          speed={0.24}
          particleColors={["#823F91", "#c081e3", "#823F91"]}
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

      <main className="relative z-10 pt-24 md:pt-32 pb-16 px-4 md:px-6">
        <div className="mx-auto max-w-4xl">
          <header className="text-center mb-10 md:mb-14">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-5" style={{ color: '#823F91' }}>
              Notre vision
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'hsl(var(--beige-800))' }}>
              Connecter les bonnes demandes aux bonnes personnes, au bon moment.
            </p>
          </header>

          <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-10 border border-white/20 space-y-6">
            <p className="text-base md:text-lg leading-relaxed text-slate-700">
              Chez <span className="font-semibold" style={{ color: '#823F91' }}>Nuply</span>, nous pensons que l&apos;accès
              aux bonnes opportunités ne devrait pas dépendre du hasard, du réseau ou de la géographie.
            </p>

            <p className="text-base md:text-lg leading-relaxed text-slate-700">
              Nous avons créé Nuply dans un monde de plus en plus <span className="font-semibold">multiculturel</span>,
              où les talents, les expertises et les besoins sont partout, mais encore trop dispersés.
              Trop de demandes ne sont pas qualifiées, trop d&apos;échanges manquent de clarté, et trop de temps est perdu.
            </p>

            <p className="text-base md:text-lg leading-relaxed text-slate-700">
              Notre approche combine <span className="font-semibold">intelligence artificielle</span>,
              <span className="font-semibold"> centralisation intelligente</span> et
              <span className="font-semibold"> qualification des demandes</span> pour créer des connexions utiles,
              concrètes et efficaces.
            </p>

            <ul className="space-y-2 text-slate-700 md:text-lg">
              <li>• Comprendre rapidement un besoin réel.</li>
              <li>• Identifier les profils et partenaires les plus pertinents.</li>
              <li>• Faciliter des échanges plus fluides entre cultures, métiers et marchés.</li>
            </ul>

            <p className="text-base md:text-lg leading-relaxed font-semibold" style={{ color: '#823F91' }}>
              Nuply, c&apos;est la rencontre entre la diversité humaine et la précision de l&apos;IA.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
