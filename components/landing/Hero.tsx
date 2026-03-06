'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TypingAnimation } from '@/components/magicui/typing-animation';

export default function Hero() {
  return (
    <section className="relative pt-24 md:pt-28 pb-12 md:pb-16 flex items-center justify-center overflow-hidden bg-transparent px-4 md:px-6 min-h-[420px] sm:min-h-[480px] md:min-h-[520px]">
      <div className="container mx-auto text-center max-w-4xl relative z-10">
        {/* Titre - beige foncé */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-[42px] sm:text-[56px] md:text-[80px] lg:text-[100px] font-extrabold leading-[1.1] mb-6 text-foreground"
          style={{ color: '#823F91' }}
        >
          Votre mariage
          <br />
          vos <TypingAnimation words={['racines', 'traditions', 'envies']} speed={250} deleteSpeed={100} delay={1400} loop={true} />
        </motion.h1>

        {/* Sous-texte - beige moyen */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-base sm:text-lg md:text-xl lg:text-[25px] max-w-2xl mx-auto mb-10 leading-relaxed px-2"
          style={{ color: 'hsl(var(--beige-800))' }}
        >
          Le premier matching mariage qui comprend votre culture. Trouvez vos prestataires en 2 minutes.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="flex justify-center items-center gap-4 mb-4 flex-col sm:flex-row"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/sign-up"
              className="inline-block px-8 py-3.5 font-semibold rounded-xl transition-all duration-300 text-white shadow-lg shadow-[#823F91]/25 bg-[#823F91] hover:bg-[#6D3478]"
            >
              Commencer mon aventure
            </Link>
          </motion.div>
        </motion.div>

        {/* Texte sous bouton - beige clair */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="text-sm text-center mt-4"
          style={{ color: 'hsl(var(--beige-700))' }}
        >
          Gratuit pour les couples
        </motion.p>
      </div>
    </section>
  );
}
