'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  // Animation variants optimisés - style Eden.so
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <section className="relative py-20 md:py-32 flex items-center justify-center overflow-hidden bg-transparent px-6">
      <motion.div
        className="container mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Titre principal - ÉNORME style Eden.so */}
        <motion.h1 
          variants={itemVariants}
          className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6 text-purple-900"
        >
          Votre mariage,
          <br />
          vos racines.
        </motion.h1>

        {/* Sous-titre accrocheur - Émotionnel */}
        <motion.p 
          variants={itemVariants}
          className="text-lg md:text-xl text-purple-600/70 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Trouvez ceux qui comprennent d'où vous venez, pas juste où vous allez.
        </motion.p>

        {/* CTA principal */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row gap-4 justify-center items-center"
        >
          <Link href="/sign-up" className="w-full md:w-auto">
            <button className="w-full md:w-auto px-8 py-4 bg-[#823F91] hover:bg-[#6D3478] text-white font-semibold text-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-[#823F91]/30 hover:scale-[1.02]">
              Commencer gratuitement
            </button>
          </Link>
          <Link href="/#comment-ca-marche" className="w-full md:w-auto">
            <button className="w-full md:w-auto px-8 py-4 bg-white/60 backdrop-blur-sm hover:bg-white/90 text-[#823F91] font-semibold text-lg rounded-xl border border-[#823F91]/20 hover:border-[#823F91]/40 transition-all duration-300">
              Découvrir la plateforme
            </button>
          </Link>
        </motion.div>

        {/* Stats en petit - discret */}
        <motion.div
          variants={itemVariants}
          className="mt-8 text-sm text-muted-foreground"
        >
          <span>127+ mariages</span>
          <span className="mx-2">•</span>
          <span>250 prestataires</span>
          <span className="mx-2">•</span>
          <span>Note 4.9/5</span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator - desktop uniquement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-purple-400/30 flex items-start justify-center p-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
