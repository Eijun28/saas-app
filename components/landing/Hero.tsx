'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-24 md:pt-28 pb-12 md:pb-16 flex items-center justify-center overflow-hidden bg-transparent px-4 md:px-6">
      <div className="container mx-auto text-center max-w-4xl relative z-10">
        {/* Titre - beige foncé */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-[3.5rem] md:text-[4.5rem] font-extrabold leading-tight mb-6 text-foreground"
          style={{ color: 'rgba(139, 90, 159, 1)' }}
        >
          Votre mariage,
          <br />
          vos racines.
        </motion.h1>

        {/* Sous-texte - beige moyen */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'hsl(var(--beige-800))' }}
        >
          Trouvez ceux qui comprennent d'où vous venez, pas juste où vous allez.
        </motion.p>

        {/* CTA - Violet */}
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
              className="px-8 py-3.5 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
              style={{
                backgroundColor: 'hsl(var(--violet-500))',
                boxShadow: '0 4px 12px hsl(var(--violet-500) / 0.25)',
                color: 'rgba(255, 255, 255, 1)'
              }}
            >
              Commencer gratuitement
            </motion.button>
          </Link>
        </motion.div>

        {/* Texte sous bouton - beige clair */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="text-sm text-center mt-4"
          style={{ color: 'hsl(var(--beige-700))' }}
        >
          Rejoignez la révolution du mariage
        </motion.p>
      </div>
    </section>
  );
}
