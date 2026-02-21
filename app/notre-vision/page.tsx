'use client';

import Particles from '@/components/Particles';
import { motion } from 'framer-motion';
import { Globe, Sparkles, Target, Heart, Zap, Users, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const pillars = [
  {
    icon: <Globe className="w-6 h-6 text-white" />,
    title: 'Un monde sans frontières',
    description:
      'Les talents et les opportunités ne connaissent pas de frontières. Notre plateforme abolit les distances géographiques pour créer des connexions qui comptent vraiment.',
    gradient: 'from-[#823F91] to-[#c081e3]',
  },
  {
    icon: <Sparkles className="w-6 h-6 text-white" />,
    title: "L'IA au service de l'humain",
    description:
      "Nous utilisons l'intelligence artificielle non pas pour remplacer les relations humaines, mais pour les amplifier. Chaque connexion créée par Nuply est pensée pour être utile, concrète et durable.",
    gradient: 'from-[#c081e3] to-[#823F91]',
  },
  {
    icon: <Target className="w-6 h-6 text-white" />,
    title: 'La précision avant tout',
    description:
      "Finis les échanges flous et les demandes mal qualifiées. Nuply structure chaque besoin pour que les bonnes personnes reçoivent les bonnes opportunités, au bon moment.",
    gradient: 'from-[#823F91] to-[#c081e3]',
  },
];

const values = [
  {
    icon: <Globe className="w-5 h-5" style={{ color: '#823F91' }} />,
    title: 'Inclusivité',
    description: 'Nous valorisons chaque culture, chaque expertise et chaque marché, sans exception.',
  },
  {
    icon: <Zap className="w-5 h-5" style={{ color: '#823F91' }} />,
    title: 'Efficacité',
    description: 'Chaque interaction doit avoir de la valeur. Nous optimisons chaque étape pour gagner du temps.',
  },
  {
    icon: <Heart className="w-5 h-5" style={{ color: '#823F91' }} />,
    title: 'Authenticité',
    description: 'Nous construisons des connexions réelles, basées sur des besoins et des compétences véritables.',
  },
  {
    icon: <Users className="w-5 h-5" style={{ color: '#823F91' }} />,
    title: 'Communauté',
    description: "Nuply, c'est avant tout une communauté de personnes qui croient en la richesse de la diversité.",
  },
];

const stats = [
  { value: '50+', label: 'Pays représentés' },
  { value: '100+', label: 'Cultures valorisées' },
  { value: '10×', label: 'Plus rapide qu'un réseau traditionnel' },
  { value: '0', label: 'Part de hasard dans le matching' },
];

export default function NotreVisionPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background" style={{ position: 'relative' }}>
      {/* Particles background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
        <Particles
          particleCount={200}
          particleSpread={10}
          speed={0.24}
          particleColors={['#823F91', '#c081e3', '#823F91']}
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
        <div className="mx-auto max-w-5xl">

          {/* ── Hero Header ── */}
          <motion.header
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            className="text-center mb-16 md:mb-20"
          >
            <motion.div variants={fadeInUp} className="mb-5">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border"
                style={{ color: '#823F91', backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#c081e3' }}
              >
                <Star className="w-3.5 h-3.5" />
                Notre mission
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-6"
              style={{ color: '#823F91' }}
            >
              Notre vision
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium"
              style={{ color: 'hsl(var(--beige-800))' }}
            >
              Connecter les bonnes demandes aux bonnes personnes, au bon moment.
            </motion.p>

            <motion.p
              variants={fadeInUp}
              className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed mt-4 text-slate-500"
            >
              Chez Nuply, nous pensons que l&apos;accès aux bonnes opportunités ne devrait pas dépendre du hasard, du réseau ou de la géographie.
            </motion.p>
          </motion.header>

          {/* ── Stats ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/30 shadow-md"
              >
                <p className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: '#823F91' }}>
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-slate-500 leading-tight">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* ── Pillars ── */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: '#823F91' }}>
              Les piliers de notre vision
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {pillars.map((pillar, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-md"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${pillar.gradient}`}
                  >
                    {pillar.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-slate-800">{pillar.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm md:text-base">{pillar.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Problem & Solution ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-10 border border-white/20 mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#823F91' }}>
              Le constat qui nous a motivés
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">Le problème</h3>
                <p className="text-base md:text-lg leading-relaxed text-slate-600">
                  Le monde est de plus en plus{' '}
                  <span className="font-semibold text-slate-800">multiculturel</span>, mais les talents, les expertises
                  et les besoins restent trop dispersés. Trop de demandes ne sont pas qualifiées, trop d&apos;échanges
                  manquent de clarté, et trop de temps est perdu.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">Notre réponse</h3>
                <p className="text-base md:text-lg leading-relaxed text-slate-600">
                  Une approche qui combine{' '}
                  <span className="font-semibold text-slate-800">intelligence artificielle</span>,{' '}
                  <span className="font-semibold text-slate-800">centralisation intelligente</span> et{' '}
                  <span className="font-semibold text-slate-800">qualification des demandes</span> pour créer des
                  connexions utiles, concrètes et efficaces.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-widest">
                Ce que cela signifie concrètement
              </p>
              <ul className="space-y-3">
                {[
                  "Comprendre rapidement un besoin réel, sans ambiguïté.",
                  "Identifier les profils et partenaires les plus pertinents, parmi des milliers.",
                  "Faciliter des échanges plus fluides entre cultures, métiers et marchés.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700 md:text-lg">
                    <span
                      className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(to right, #c081e3, #823F91)' }}
                    >
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>

          {/* ── Values ── */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: '#823F91' }}>
              Nos valeurs
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {values.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/30 shadow-md"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: 'rgba(130, 63, 145, 0.1)' }}
                  >
                    {value.icon}
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">{value.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Manifesto ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-8 md:p-14 text-center mb-16 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #823F91, #c081e3)' }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '36px 36px',
              }}
            />
            <p className="relative text-2xl md:text-4xl font-extrabold text-white leading-snug">
              Nuply, c&apos;est la rencontre entre la diversité humaine et la précision de l&apos;IA.
            </p>
            <p className="relative text-white/75 mt-4 text-base md:text-lg">
              Une plateforme. Des milliers de connexions authentiques.
            </p>
          </motion.div>

          {/* ── CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-slate-500 mb-6 text-base md:text-lg">
              Envie de rejoindre l&apos;aventure Nuply ?
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: 'linear-gradient(to right, #823F91, #c081e3)' }}
            >
              Rejoindre Nuply
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
