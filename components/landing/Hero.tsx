'use client';

import { motion } from 'framer-motion';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AvatarCircles } from '@/components/ui/avatar-circles';
import { RippleButton } from '@/components/ui/ripple-button';
import { HeroVideoDialog } from '@/components/ui/hero-video-dialog';

export default function Hero() {
  // Animation variants optimisés pour Next.js 15
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  const gradientVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.4 + custom * 0.1,
        duration: 0.5,
      },
    }),
  };

  // Avatars pour social proof
  const avatars = [
    {
      imageUrl: "https://avatars.githubusercontent.com/u/16860528",
      profileUrl: "https://github.com/dillionverma",
    },
    {
      imageUrl: "https://avatars.githubusercontent.com/u/20110627",
      profileUrl: "https://github.com/tomonarifeehan",
    },
    {
      imageUrl: "https://avatars.githubusercontent.com/u/106103625",
      profileUrl: "https://github.com/BankkRoll",
    },
    {
      imageUrl: "https://avatars.githubusercontent.com/u/59228569",
      profileUrl: "https://github.com/safethecode",
    },
    {
      imageUrl: "https://avatars.githubusercontent.com/u/59442788",
      profileUrl: "https://github.com/sanjay-mali",
    },
    {
      imageUrl: "https://avatars.githubusercontent.com/u/89768406",
      profileUrl: "https://github.com/itsarghyadas",
    },
  ];

  return (
    <section className="relative pt-24 md:pt-28 lg:pt-32 pb-10 md:pb-14 lg:pb-16 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-violet-50/30">
      {/* Background decoration avec blur optimisé */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#823F91]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9D5FA8]/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        className="container mx-auto px-4 sm:px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="flex justify-center mb-4 md:mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8D4EF]/80 border border-[#823F91]/30 backdrop-blur-sm shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#823F91]" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-medium text-[#823F91]">
              ✨ La première plateforme de son genre en France
            </span>
          </div>
        </motion.div>

        {/* Titre principal */}
        <motion.h1
          variants={itemVariants}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 md:mb-6 leading-[1.2] max-w-4xl mx-auto"
        >
          <span 
            className="bg-gradient-to-r from-[#823F91] via-[#9D5FA8] to-[#823F91] bg-clip-text text-transparent inline-block"
            style={{
              backgroundSize: '200% auto',
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          >
            Trouvez vos prestataires de mariage en 5 minutes grâce à l'IA multiculturelle
          </span>
        </motion.h1>

        {/* Sous-titre */}
        <motion.p
          variants={itemVariants}
          className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-6 md:mb-8 leading-relaxed font-normal"
        >
          Photographe qui saisit l'importance du henné. Traiteur qui maîtrise vos épices. DJ qui connaît vos classiques. Notre IA les trouve en 5 minutes. Vous économisez 3 mois de recherche.
        </motion.p>

        {/* Microcopy avant CTA */}
        <motion.p
          variants={itemVariants}
          className="text-xs sm:text-sm text-slate-600 mb-4 md:mb-6"
        >
          Rejoignez les 127 couples qui ont trouvé leurs prestataires ce mois-ci
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-row gap-2 sm:gap-3 justify-center mb-4 md:mb-6 flex-wrap sm:flex-nowrap"
        >
          <Link href="/sign-up">
            <RippleButton
              className="group w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-[#823F91] hover:bg-[#6D3478] text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#823F91]/50 hover:-translate-y-0.5 flex items-center justify-center gap-1.5 border-0 text-xs sm:text-sm whitespace-nowrap"
              rippleColor="#ffffff"
            >
              Essai gratuit · Sans carte bancaire
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </RippleButton>
          </Link>
          <button
            onClick={() => {
              const videoSection = document.querySelector('#hero-video');
              videoSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-transparent hover:bg-[#E8D4EF]/50 text-[#823F91] font-semibold rounded-lg border-2 border-[#823F91]/30 hover:border-[#823F91] transition-all duration-300 text-xs sm:text-sm whitespace-nowrap"
          >
            Voir une démo
          </button>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center gap-2 mb-4 md:mb-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100">
            <AvatarCircles numPeople={3} avatarUrls={avatars.slice(0, 3)} />
            <span className="text-xs sm:text-sm font-medium text-slate-700">
              🎉 127 couples ont trouvé leurs prestataires ce mois-ci
            </span>
          </div>
        </motion.div>

        {/* Reassurance */}
        <motion.p
          variants={itemVariants}
          className="text-xs sm:text-sm text-slate-500 mb-8 md:mb-12"
        >
          ✓ Gratuit pour les couples  •  ✓ Sans engagement  •  ✓ Setup en 5 minutes
        </motion.p>

        {/* Section Vidéo Démo */}
        <motion.div
          id="hero-video"
          variants={gradientVariants}
          custom={2}
          className="w-full max-w-4xl mx-auto mb-8 md:mb-12"
        >
          <div className="space-y-4">
            {/* Badge "Nouveau" */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#823F91]/10 border border-[#823F91]/20">
                <span className="text-xs font-semibold text-[#823F91] uppercase tracking-wide">
                  Nouveau
                </span>
              </div>
            </div>

            {/* Composant Vidéo */}
            <HeroVideoDialog
              videoSrc="/videos/nuply-demo.mp4"
              thumbnailSrc="/images/hero-video-thumbnail.jpg"
              thumbnailAlt="Démo de la plateforme Nuply - Matching IA, messagerie et dashboard"
              videoType="mp4"
              animationStyle="from-center"
              className="w-full"
            />

            {/* Texte accompagnateur */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span>45 secondes de démo</span>
              </div>
              <p className="text-sm text-slate-500 max-w-md">
                Découvrez comment Nuply fonctionne : matching IA, messagerie intégrée et dashboard complet
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 text-xs sm:text-sm text-slate-600"
        >
          {/* Avatars stack */}
          <div className="flex items-center" aria-label="Couples satisfaits">
            <AvatarCircles numPeople={99} avatarUrls={avatars} />
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-3 font-medium">
            <span className="text-slate-700 whitespace-nowrap">127 mariages célébrés</span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-slate-700 whitespace-nowrap">250+ prestataires vérifiés</span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-amber-500" aria-hidden="true">★</span>
              <span className="text-slate-700">Note 4.9/5</span>
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border-2 border-slate-300 flex items-start justify-center p-1.5"
        >
          <div className="w-1 h-1 rounded-full bg-slate-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
