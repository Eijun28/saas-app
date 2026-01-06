'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-24 md:pt-28 pb-12 md:pb-16 flex items-center justify-center overflow-hidden bg-transparent px-4 md:px-6">
      <div className="container mx-auto text-center max-w-4xl">
        {/* Titre principal - Style Eden.so */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-[3.5rem] md:text-[4.5rem] font-bold leading-tight mb-6 text-[#823F91]"
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
          className="text-lg text-gray-600/80 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Trouvez ceux qui comprennent d'où vous venez, pas juste où vous allez.
        </motion.p>

        {/* CTA principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="flex justify-center items-center mb-4"
        >
          <Link href="/sign-up">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3.5 bg-[#823F91] hover:bg-[#6D3478] text-white font-semibold rounded-full transition-all duration-300 shadow-lg shadow-[#823F91]/20 hover:shadow-xl hover:shadow-[#823F91]/30"
            >
              Commencer gratuitement
            </motion.button>
          </Link>
        </motion.div>

        {/* Texte sous le bouton */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="text-sm text-gray-500 text-center mt-4"
        >
          Rejoignez la révolution du mariage
        </motion.p>
      </div>
    </section>
  );
}
