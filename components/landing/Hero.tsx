'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { AvatarCircles } from '@/components/ui/avatar-circles';

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
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-violet-50/30">
      {/* Background decoration avec blur optimisé */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#823F91]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9D5FA8]/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        className="container mx-auto px-6 py-20 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8D4EF]/80 border border-[#823F91]/30 backdrop-blur-sm shadow-sm">
            <Sparkles className="w-4 h-4 text-[#823F91]" aria-hidden="true" />
            <span className="text-sm font-medium text-[#823F91]">
              La première plateforme de son genre en France
            </span>
          </div>
        </motion.div>

        {/* Titre principal */}
        <motion.h1
          variants={itemVariants}
          className="text-[192px] md:text-[256px] lg:text-[268px] xl:text-[400px] 2xl:text-[474px] font-black tracking-tight text-slate-900 mb-8 leading-[1.05] px-4 max-w-6xl mx-auto"
        >
          Votre mariage, vos racines.
          <br />
          <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
            Leurs traditions, leur expertise.
          </span>
        </motion.h1>

        {/* Sous-titre */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-normal px-4"
        >
          Des prestataires de mariage qui connaissent vos traditions sur le bout des doigts.{' '}
          Matching par culture, budget et dispo.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16 px-4"
        >
          <Link href="/sign-up">
            <button className="group w-full sm:w-auto px-8 py-4 bg-[#823F91] hover:bg-[#6D3478] text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-[#823F91]/50 hover:-translate-y-1 flex items-center justify-center gap-2">
              Commencer gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link href="/#comment-ca-marche">
            <button className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-[#E8D4EF] text-[#823F91] font-semibold rounded-xl border-2 border-[#823F91]/30 hover:border-[#823F91] transition-all duration-300">
              Découvrir la plateforme
            </button>
          </Link>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-600 px-4"
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-slate-300 flex items-start justify-center p-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
