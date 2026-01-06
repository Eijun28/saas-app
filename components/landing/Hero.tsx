'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative py-20 lg:py-32 flex items-center justify-center overflow-hidden bg-gray-50 px-6">
      <div className="container mx-auto text-center max-w-6xl px-6">
        {/* Titre principal - Style Resend */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6 text-gray-900"
        >
          Votre mariage,
          <br />
          vos racines.
        </motion.h1>

        {/* Sous-texte accrocheur */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-xl lg:text-2xl font-normal text-gray-600 max-w-3xl mx-auto mt-6 leading-relaxed"
        >
          Trouvez ceux qui comprennent d'où vous venez, pas juste où vous allez.
        </motion.p>

        {/* CTA principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="flex justify-center items-center gap-4 mt-10"
        >
          <Link href="/sign-up">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-lg transition-all duration-200"
            >
              Commencer gratuitement
            </motion.button>
          </Link>
          <Link href="/tarifs">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold text-lg border border-gray-200 transition-all duration-200"
            >
              Voir les tarifs
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="mt-16 bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">500+</p>
              <p className="text-sm text-gray-600 mt-2">Prestataires vérifiés</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">1000+</p>
              <p className="text-sm text-gray-600 mt-2">Mariages organisés</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">98%</p>
              <p className="text-sm text-gray-600 mt-2">Satisfaction</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
