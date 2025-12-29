"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Sparkles, MessageSquare, PiggyBank, Shield, Calendar } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { FadeInOnScroll } from '@/components/landing/animations';

// Skeleton Matching IA - Rotation conversation toutes les 10s
const SkeletonMatching = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  
  const conversationSets = [
    [
      { from: "couple", text: "Cherchons negafa franco-algérienne", avatar: "👰" },
      { from: "ai", text: "3 prestataires trouvés !", avatar: "✨" },
    ],
    [
      { from: "couple", text: "DJ qui fait dabké et variété française ?", avatar: "👰" },
      { from: "ai", text: "2 DJs spécialisés multiculturel !", avatar: "✨" },
    ],
    [
      { from: "couple", text: "Traiteur végétarien indien + français", avatar: "👰" },
      { from: "ai", text: "5 traiteurs disponibles !", avatar: "✨" },
    ],
  ];

  const [currentSet, setCurrentSet] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setCurrentSet((prev) => (prev + 1) % conversationSets.length);
    }, 10000); // Change toutes les 10 secondes

    return () => clearInterval(interval);
  }, [isInView, conversationSets.length]);

  return (
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] bg-gradient-to-br from-[#823F91]/5 via-[#9D5FA8]/5 to-[#823F91]/5 flex-col space-y-3 p-4 relative rounded-lg">
      <div className="relative z-10 flex flex-col space-y-3 h-full justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSet}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {conversationSets[currentSet].map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.from === "couple" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.5, duration: 0.5 }}
                className={`flex ${msg.from === "couple" ? "justify-start" : "justify-end"}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] ${
                  msg.from === "ai" ? "flex-row-reverse space-x-reverse" : ""
                }`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] flex items-center justify-center shrink-0 text-sm">
                    {msg.avatar}
                  </div>
                  <div className={`rounded-2xl p-3 ${
                    msg.from === "couple" 
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                      : "bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white"
                  }`}>
                    <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Skeleton Messagerie - Rotation threads toutes les 10s
const SkeletonMessaging = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  
  const messageThreads = [
    [
      { text: "Bonjour, disponible samedi ?", sender: "couple" },
      { text: "Oui ! 14h-18h possible", sender: "vendor" },
    ],
    [
      { text: "Budget pour 150 invités ?", sender: "couple" },
      { text: "Entre 3500€ et 4200€", sender: "vendor" },
    ],
    [
      { text: "Menu halal + végétarien ?", sender: "couple" },
      { text: "Absolument, on s'adapte !", sender: "vendor" },
    ],
  ];

  const [currentThread, setCurrentThread] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setCurrentThread((prev) => (prev + 1) % messageThreads.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isInView, messageThreads.length]);

  return (
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] bg-gradient-to-br from-[#823F91]/5 via-[#9D5FA8]/5 to-[#823F91]/5 flex-col space-y-2 p-4 relative rounded-lg">
      <div className="relative z-10 flex flex-col space-y-2 h-full justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentThread}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            {messageThreads[currentThread].map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.sender === "couple" ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.3, duration: 0.4 }}
                className={`flex ${msg.sender === "couple" ? "justify-start" : "justify-end"}`}
              >
                <div className={`rounded-lg px-3 py-2 max-w-[80%] ${
                  msg.sender === "couple"
                    ? "bg-[#E8D4EF] dark:bg-[#823F91]/30 text-[#823F91] dark:text-[#E8D4EF]"
                    : "bg-[#E8D4EF] dark:bg-[#9D5FA8]/30 text-[#6D3478] dark:text-[#E8D4EF]"
                }`}>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Skeleton Budget - Gradient animé circulaire (SkeletonThree style)
const SkeletonBudget = () => {
  const variants = {
    initial: {
      scale: 1,
      rotate: 0,
    },
    animate: {
      scale: 1.1,
      rotate: 5,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 flex-col space-y-2 items-center justify-center relative rounded-lg"
    >
      <motion.div
        variants={variants}
        className="relative w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center"
      >
        <svg className="absolute inset-0 w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * 0.35}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="text-white font-bold text-xs">65%</div>
      </motion.div>
    </motion.div>
  );
};

// Skeleton Paiements - Animation escrow avec flux de paiement
const SkeletonPayments = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  
  const [animationStep, setAnimationStep] = useState(0);
  
  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4);
    }, 2000); // Change d'étape toutes les 2 secondes
    
    return () => clearInterval(interval);
  }, [isInView]);
  
  const steps = [
    { label: "Vous payez", icon: "👰", color: "from-[#823F91] to-[#9D5FA8]" },
    { label: "Sécurisé", icon: "🔒", color: "from-green-500 to-emerald-600" },
    { label: "Service rendu", icon: "✅", color: "from-blue-500 to-cyan-600" },
    { label: "Prestataire payé", icon: "🎵", color: "from-pink-500 to-rose-600" },
  ];
  
  const currentStep = steps[animationStep];
  
  return (
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 flex-col justify-center items-center p-4 space-y-3 relative rounded-lg overflow-hidden">
      {/* Flux visuel : Couple → Escrow → Prestataire */}
      <div className="w-full flex items-center justify-between relative">
        {/* Couple */}
        <motion.div
          animate={{
            scale: animationStep === 0 ? 1.1 : 1,
            opacity: animationStep === 0 ? 1 : 0.6,
          }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center z-10"
        >
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${steps[0].color} flex items-center justify-center mb-1 shadow-md`}>
            <span className="text-sm">{steps[0].icon}</span>
          </div>
          <p className="text-[10px] text-gray-600 dark:text-gray-400 text-center">Couple</p>
        </motion.div>
        
        {/* Flèche animée 1 */}
        <motion.div
          animate={{
            scaleX: animationStep >= 1 ? 1 : 0.3,
            opacity: animationStep >= 1 ? 1 : 0.3,
          }}
          transition={{ duration: 0.5 }}
          className="flex-1 h-0.5 bg-gradient-to-r from-[#823F91] to-green-500 mx-2 relative"
        >
          {animationStep === 1 && (
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "100%" }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-2 h-full bg-white rounded-full shadow-sm"
            />
          )}
        </motion.div>
        
        {/* Escrow (centre) */}
        <motion.div
          animate={{
            scale: animationStep === 1 ? 1.15 : animationStep === 2 ? 1.1 : 1,
            opacity: animationStep >= 1 && animationStep <= 2 ? 1 : 0.7,
          }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center z-10 relative"
        >
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${steps[1].color} flex items-center justify-center mb-1 shadow-lg border-2 border-white dark:border-gray-800`}>
            <span className="text-base">{steps[1].icon}</span>
          </div>
          <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 text-center">Escrow</p>
          <motion.div
            animate={{
              opacity: animationStep === 1 ? 1 : 0.5,
            }}
            className="text-[9px] text-green-600 dark:text-green-400 font-medium mt-0.5"
          >
            2 450€
          </motion.div>
        </motion.div>
        
        {/* Flèche animée 2 */}
        <motion.div
          animate={{
            scaleX: animationStep >= 3 ? 1 : 0.3,
            opacity: animationStep >= 3 ? 1 : 0.3,
          }}
          transition={{ duration: 0.5 }}
          className="flex-1 h-0.5 bg-gradient-to-r from-green-500 to-pink-500 mx-2 relative"
        >
          {animationStep === 3 && (
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "100%" }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-2 h-full bg-white rounded-full shadow-sm"
            />
          )}
        </motion.div>
        
        {/* Prestataire */}
        <motion.div
          animate={{
            scale: animationStep === 3 ? 1.1 : 1,
            opacity: animationStep === 3 ? 1 : 0.6,
          }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center z-10"
        >
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${steps[3].color} flex items-center justify-center mb-1 shadow-md`}>
            <span className="text-sm">{steps[3].icon}</span>
          </div>
          <p className="text-[10px] text-gray-600 dark:text-gray-400 text-center">Prestataire</p>
        </motion.div>
      </div>
      
      {/* Label étape actuelle */}
      <AnimatePresence mode="wait">
        <motion.div
          key={animationStep}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium bg-gradient-to-r ${currentStep.color} text-white shadow-sm`}>
            {currentStep.label}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Skeleton Timeline - Rotation événements toutes les 10s
const SkeletonTimeline = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  
  const timelineSets = [
    [
      { title: "RDV DJ Karim", time: "Aujourd'hui 14h", color: "purple" },
      { title: "Dégustation traiteur", time: "Demain 10h30", color: "pink" },
    ],
    [
      { title: "Essayage tenue", time: "15 Mars 15h", color: "purple" },
      { title: "Visite salle", time: "18 Mars 11h", color: "pink" },
    ],
    [
      { title: "Test maquillage", time: "22 Mars 14h", color: "purple" },
      { title: "Confirmation DJ", time: "25 Mars 16h", color: "pink" },
    ],
  ];

  const [currentSet, setCurrentSet] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setCurrentSet((prev) => (prev + 1) % timelineSets.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isInView, timelineSets.length]);

  return (
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-rose-950/20 flex-col space-y-3 p-4 relative rounded-lg">
      <div className="relative z-10 flex flex-col space-y-3 h-full justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSet}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {timelineSets[currentSet].map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2, duration: 0.4 }}
                className="flex items-start space-x-3"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  event.color === "purple" ? "bg-purple-600" : "bg-pink-600"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{event.time}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const items = [
  {
    title: "Trouvez vos prestataires en 5 minutes, pas 5 semaines",
    description: "Notre intelligence artificielle analyse 250+ prestataires et vous propose les 3-5 parfaits pour chaque catégorie. Fini les dizaines d'onglets ouverts et les comparaisons Excel interminables.",
    header: <SkeletonMatching />,
    className: "md:col-span-2",
    icon: <Sparkles className="h-4 w-4 text-purple-600" />,
  },
  {
    title: "Toutes vos conversations au même endroit (enfin !)",
    description: "Plus besoin de jongler entre 15 emails, 8 WhatsApp et 3 Instagram DM. Gérez tous vos prestataires depuis un seul dashboard. Avec historique, partage de documents et notifications intelligentes.",
    header: <SkeletonMessaging />,
    className: "md:col-span-1",
    icon: <MessageSquare className="h-4 w-4 text-purple-600" />,
  },
  {
    title: "Économisez jusqu'à 3 000€ (et dormez tranquille)",
    description: "Comparez automatiquement les tarifs de dizaines de prestataires. Suivez vos dépenses en temps réel. Recevez des alertes avant de dépasser votre budget. Nos couples économisent en moyenne 2 800€.",
    header: <SkeletonBudget />,
    className: "md:col-span-1",
    icon: <PiggyBank className="h-4 w-4 text-purple-600" />,
  },
  {
    title: "100% authenticité culturelle. Zéro arnaque. Garantie.",
    description: "Chaque prestataire est vérifié : documents pros, portfolio, 3+ références clients, ET formation spécifique à vos traditions. Résultat ? Zéro malentendu culturel, zéro déception le jour J.",
    header: <SkeletonPayments />,
    className: "md:col-span-1",
    icon: <Shield className="h-4 w-4 text-purple-600" />,
  },
  {
    title: "N'oubliez plus jamais une deadline importante",
    description: "Le jour J approche ? Nuply vous rappelle automatiquement : dernier paiement traiteur dans 7 jours, essayage robe dans 2 semaines, confirmation DJ demain. Avec checklist personnalisée selon votre type de mariage.",
    header: <SkeletonTimeline />,
    className: "md:col-span-1",
    icon: <Calendar className="h-4 w-4 text-purple-600" />,
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 md:py-28 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <FadeInOnScroll className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0B0E12] mb-4">
            Pourquoi les couples adorent Nuply
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Parce qu'organiser un mariage multiculturel ne devrait pas être un casse-tête de 6 mois
          </p>
        </FadeInOnScroll>

        <BentoGrid className="max-w-7xl mx-auto">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              className={item.className}
              icon={item.icon}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
