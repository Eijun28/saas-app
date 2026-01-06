"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Sparkles, MessageSquare, PiggyBank, Shield, Calendar, Users, Lock, Music } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { FadeInOnScroll } from '@/components/landing/animations';

// Skeleton Matching IA - Rotation conversation toutes les 10s
const SkeletonMatching = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  
  const conversationSets = [
    [
      { from: "couple", text: "Cherchons negafa franco-algérienne", avatar: "couple" },
      { from: "ai", text: "3 prestataires trouvés !", avatar: "ai" },
    ],
    [
      { from: "couple", text: "DJ qui fait dabké et variété française ?", avatar: "couple" },
      { from: "ai", text: "2 DJs spécialisés multiculturel !", avatar: "ai" },
    ],
    [
      { from: "couple", text: "Traiteur végétarien indien + français", avatar: "couple" },
      { from: "ai", text: "5 traiteurs disponibles !", avatar: "ai" },
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
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] bg-gray-50 flex-col space-y-3 p-4 relative">
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
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                    {msg.avatar === "couple" ? (
                      <Users className="w-4 h-4 text-white" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`rounded-2xl p-3 ${
                    msg.from === "couple" 
                      ? "bg-white text-gray-900 border border-gray-200" 
                      : "bg-violet-600 text-white"
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
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] bg-gray-50 flex-col space-y-2 p-4 relative">
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
                    ? "bg-white text-gray-900 border border-gray-200"
                    : "bg-violet-50 text-violet-700 border border-violet-200"
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
      className="flex flex-1 w-full h-full min-h-[6rem] bg-gray-50 flex-col space-y-2 items-center justify-center relative"
    >
      <motion.div
        variants={variants}
        className="relative w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center relative z-10"
      >
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <svg className="absolute inset-0 w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgb(139, 92, 246)"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * 0.35}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="text-white font-bold text-sm">65%</div>
      </motion.div>
      <div className="flex flex-row space-x-2 mt-2 relative z-10">
        <div className="h-2 w-6 bg-violet-600 rounded-full" />
        <div className="h-2 w-6 bg-violet-500 rounded-full" />
        <div className="h-2 w-6 bg-violet-400 rounded-full" />
      </div>
    </motion.div>
  );
};

// Skeleton Paiements - Système tiers de confiance avec données
const SkeletonPayments = () => {
  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] bg-gray-50 flex-col justify-center items-center p-4 space-y-3 relative"
    >
      <div className="relative z-10 flex flex-col justify-center items-center space-y-3 w-full">
        {/* Montant en tiers de confiance */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-xs text-gray-500 mb-1">Montant sécurisé</p>
          <p className="text-2xl font-bold text-gray-900">2 450€</p>
        </motion.div>

        {/* Flow tiers de confiance */}
        <div className="w-full flex items-center justify-between text-xs">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-1">
              <Users className="w-5 h-5 text-gray-900" />
            </div>
            <p className="text-xs text-gray-600">Couple</p>
          </motion.div>

          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5 }}
            className="flex-1 h-0.5 bg-gray-300 mx-2"
          />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-1">
              <Lock className="w-5 h-5 text-gray-900" />
            </div>
            <p className="text-xs text-gray-600">Escrow</p>
          </motion.div>

          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9 }}
            className="flex-1 h-0.5 bg-gray-300 mx-2"
          />

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-center"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-1">
              <Music className="w-5 h-5 text-gray-900" />
            </div>
            <p className="text-xs text-gray-600">DJ</p>
          </motion.div>
        </div>

        {/* Badge SSL */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full inline-flex items-center gap-1 border border-gray-200">
            <Lock className="w-3 h-3" />
            SSL sécurisé
          </span>
        </motion.div>
      </div>
    </motion.div>
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
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] bg-gray-50 flex-col space-y-3 p-4 relative">
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
                  event.color === "purple" ? "bg-violet-600" : "bg-gray-400"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500 truncate">{event.time}</p>
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
    title: "Matching intelligent",
    description: "Notre IA connecte les couples avec des prestataires qui comprennent leurs traditions culturelles",
    header: <SkeletonMatching />,
    className: "md:col-span-2",
    icon: <Sparkles className="h-4 w-4 text-violet-600" />,
  },
  {
    title: "Messagerie sécurisée",
    description: "Échangez directement avec les prestataires, partagez vos attentes culturelles",
    header: <SkeletonMessaging />,
    className: "md:col-span-1",
    icon: <MessageSquare className="h-4 w-4 text-violet-600" />,
  },
  {
    title: "Gestion du budget",
    description: "Suivez vos dépenses par catégorie et prestataire",
    header: <SkeletonBudget />,
    className: "md:col-span-1",
    icon: <PiggyBank className="h-4 w-4 text-violet-600" />,
  },
  {
    title: "Paiements sécurisés",
    description: "Transactions protégées et acomptes gérés en toute confiance",
    header: <SkeletonPayments />,
    className: "md:col-span-1",
    icon: <Shield className="h-4 w-4 text-violet-600" />,
  },
  {
    title: "Timeline interactive",
    description: "Planifiez chaque étape avec des rappels intelligents",
    header: <SkeletonTimeline />,
    className: "md:col-span-1",
    icon: <Calendar className="h-4 w-4 text-violet-600" />,
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <FadeInOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="px-4 py-1.5 rounded-full text-xs uppercase text-gray-500 tracking-wider">
              Fonctionnalités
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Une plateforme complète pour organiser votre mariage multiculturel
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
