'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Sparkles, Users, Send, HeartHandshake } from 'lucide-react'
import { useRouter } from 'next/navigation'
import MatchingExplainerCards from './MatchingExplainerCards'

// Composant SkeletonMatching adapté pour pleine largeur
const SkeletonMatchingFullWidth = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  
  const conversationSets = [
    {
      query: "Traiteur spécialisé cuisine marocaine traditionnelle (couscous, tajine) + menu français gastronomique • 150 invités • Budget 6000-7000€ • Halal certifié • Service à table avec personnel bilingue arabe-français • Région Île-de-France • Date : 15 juin 2026",
      result: "3 traiteurs parfaitement matchés ! Tous certifiés halal, bilingues, expérience mariages mixtes. Budget : 6200-6800€. Voulez-vous les contacter ?"
    },
    {
      query: "Traiteur fusion indienne-française • Menu 100% végétarien avec options vegan • 80 personnes • Budget max 4500€ • Présentation moderne • Doit gérer allergies (gluten, lactose) • Dégustation gratuite avant mariage • Disponible août 2026 • Lyon et alentours",
      result: "4 traiteurs experts trouvés ! Spécialistes fusion végé + gestion allergies. Tous proposent dégustation incluse. Budget : 4000-4400€. Voulez-vous les contacter ?"
    },
    {
      query: "Traiteur buffet libanais authentique (mezze, grillades) + desserts pâtisserie orientale française • 200 invités • Budget 8000€ • Service traiteur + location vaisselle orientale • Animation live cuisson pain • Mariage mixte libano-français • Marseille • Septembre 2026",
      result: "2 traiteurs ultra-spécialisés ! Équipement animation live inclus, vaisselle orientale fournie. Expérience mariages mixtes confirmée. Budget : 7800-8200€. Voulez-vous les contacter ?"
    },
  ];

  const [currentSet, setCurrentSet] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSendButton, setShowSendButton] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<Array<{from: string, text: string, avatar: string, button?: boolean}>>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Plus besoin de gérer la hauteur du textarea car on utilise un div maintenant

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesContainerRef.current && displayedMessages.length > 0) {
      // Utiliser requestAnimationFrame pour éviter les sauts
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
    }
  }, [displayedMessages.length]);

  useEffect(() => {
    if (!isInView) return;
    
    let typingTimeout: ReturnType<typeof setTimeout> | null = null;
    let responseTimeout: ReturnType<typeof setTimeout> | null = null;
    let cycleTimeout: ReturnType<typeof setInterval> | null = null;
    let coupleMessageTimeout: ReturnType<typeof setTimeout> | null = null;
    let sendTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const startCycle = () => {
      const current = conversationSets[currentSet];
      
      // Réinitialiser l'état et vider les messages pour une nouvelle conversation complète
      setTypedText("");
      setIsTyping(false);
      setShowSendButton(false);
      setIsSending(false);
      // Vider les messages pour recommencer avec une nouvelle conversation (4 messages : couple -> IA -> couple -> IA)
      setDisplayedMessages([]);
      
      // D'abord commencer à taper le message du couple dans la zone de frappe
      setIsTyping(true);
      let index = 0;
      
      // Fonction pour obtenir la vitesse de frappe (variable selon le caractère)
      const getTypingSpeed = (char: string, nextChar?: string) => {
        if (char === ' ') return 15; // Espaces plus rapides
        if (char === '•') return 40; // Pause après les puces
        if (nextChar === ' ') return 20; // Avant un espace
        return 20 + Math.random() * 15; // Variation naturelle (plus rapide)
      };
      
      // Simuler la frappe du message du couple avec vitesse variable
      const typeNextChar = () => {
        if (index < current.query.length) {
          const char = current.query[index];
          const nextChar = index < current.query.length - 1 ? current.query[index + 1] : undefined;
          setTypedText(current.query.slice(0, index + 1));
          index++;
          
          const speed = getTypingSpeed(char, nextChar);
          typingTimeout = setTimeout(typeNextChar, speed);
        } else {
          // Fin de la frappe
          setIsTyping(false);
          setShowSendButton(true);
          
          // Attendre un peu puis animer l'envoi
          sendTimeout = setTimeout(() => {
            setIsSending(true);
            setShowSendButton(false);
            
            // Animation d'envoi puis afficher le message dans la conversation
            setTimeout(() => {
              setIsSending(false);
              
              // Afficher le message du couple dans la conversation avec animation
              coupleMessageTimeout = setTimeout(() => {
                setDisplayedMessages(prev => [...prev, {
                  from: "couple",
                  text: current.query,
                  avatar: "couple"
                }]);
                
                // Vider la zone de frappe après l'affichage du message
                setTimeout(() => {
                  setTypedText("");
                }, 200);
                
                // Ensuite afficher la réponse de l'IA après un délai
                responseTimeout = setTimeout(() => {
                  setDisplayedMessages(prev => [...prev, {
                    from: "ai",
                    text: current.result,
                    avatar: "ai"
                  }]);
                  
                  // Après la réponse de l'IA, ajouter le message "oui" du couple
                  setTimeout(() => {
                    setDisplayedMessages(prev => [...prev, {
                      from: "couple",
                      text: "Oui",
                      avatar: "couple"
                    }]);
                    
                    // Puis la réponse finale de l'IA avec le bouton
                    setTimeout(() => {
                      setDisplayedMessages(prev => [...prev, {
                        from: "ai",
                        text: "Demandes envoyées !",
                        avatar: "ai",
                        button: true
                      }]);
                    }, 1500);
                  }, 2000);
                }, 2000);
              }, 300);
            }, 400);
          }, 800);
        }
      };
      
      typeNextChar();
    };

    // Calculer le temps total pour une conversation complète
    const getConversationDuration = (query: string) => {
      // Temps de frappe : ~50ms par caractère en moyenne (avec variations)
      const typingTime = query.length * 60; // Un peu plus pour être sûr
      // Temps d'envoi et affichage message 1 : ~700ms
      const sendTime = 700;
      // Délai avant message 2 : 2000ms
      const delayBeforeMsg2 = 2000;
      // Délai avant message 3 : 2000ms
      const delayBeforeMsg3 = 2000;
      // Délai avant message 4 : 1500ms
      const delayBeforeMsg4 = 1500;
      // Temps d'affichage final avant de recommencer : 3000ms
      const finalDisplayTime = 3000;
      
      return typingTime + sendTime + delayBeforeMsg2 + delayBeforeMsg3 + delayBeforeMsg4 + finalDisplayTime;
    };
    
    // Démarrer le cycle initial
    startCycle();
    
    // Changer de set après le temps nécessaire pour chaque conversation complète
    // Le timing est calculé pour chaque conversation individuellement
    const currentDuration = getConversationDuration(conversationSets[currentSet].query);
    cycleTimeout = setTimeout(() => {
      setCurrentSet((prev) => (prev + 1) % conversationSets.length);
    }, currentDuration);

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
      if (responseTimeout) clearTimeout(responseTimeout);
      if (cycleTimeout) clearTimeout(cycleTimeout);
      if (coupleMessageTimeout) clearTimeout(coupleMessageTimeout);
      if (sendTimeout) clearTimeout(sendTimeout);
    };
  }, [isInView, currentSet]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 relative overflow-hidden"
    >
      <div className="absolute inset-0 blur-3xl opacity-5" style={{ background: 'linear-gradient(to bottom right, rgba(192, 129, 227, 0.1), rgba(130, 63, 145, 0.1), rgba(192, 129, 227, 0.1))' }} />
      <div className="relative z-10 flex flex-col space-y-4">
        {/* Titre et description */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md" style={{ background: 'linear-gradient(to right, #c081e3, #823F91)' }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Matching intelligent</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Matchez avec des prestataires qui vous ressemblent en 10 secondes</p>
          </div>
        </div>

        {/* Conversation - toujours visible */}
        <div 
          ref={messagesContainerRef}
          className="flex flex-col space-y-6 pt-6 border-t border-gray-200 min-h-[250px] max-h-[500px] overflow-y-auto scroll-smooth px-1"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(130, 63, 145, 0.3) transparent' }}
        >
          {displayedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-gray-400">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-gray-50" style={{ background: 'linear-gradient(to right, rgba(192, 129, 227, 0.1), rgba(130, 63, 145, 0.1))' }}>
                <Sparkles className="w-8 h-8" style={{ color: '#c081e3' }} />
              </div>
              <p className="text-sm font-medium mb-1">Commencez votre recherche</p>
              <p className="text-xs text-gray-500">Ex: Traiteur halal spécialisé cuisine libanaise + française, 120 invités, Paris...</p>
            </div>
          ) : (
            <>
              {displayedMessages.map((msg, i) => (
                <div
                  key={`msg-${i}-${msg.from}`}
                  className={`flex ${msg.from === "couple" ? "justify-start" : "justify-end"} w-full`}
                >
                  <div className={`flex items-start ${
                    msg.from === "ai" 
                      ? "flex-row-reverse space-x-reverse max-w-[70%] sm:max-w-[65%] gap-4 sm:gap-5" 
                      : "max-w-[85%] sm:max-w-[80%] space-x-4 sm:space-x-5"
                  }`}>
                    <div 
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm" 
                      style={{ background: 'linear-gradient(to right, #c081e3, #823F91)' }}
                    >
                      {msg.avatar === "couple" ? (
                        <Users className="w-5 h-5 text-white" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div 
                      className={`rounded-2xl px-5 py-4 break-words shadow-sm ${
                        msg.from === "couple" 
                          ? "bg-gray-50 text-gray-900 border border-gray-100" 
                          : "text-white"
                      }`}
                      style={msg.from === "ai" ? { 
                        background: 'linear-gradient(to right, #c081e3, #823F91)',
                        boxShadow: '0 2px 8px rgba(130, 63, 145, 0.2)',
                        color: '#ffffff'
                      } : {}}
                    >
                      <p 
                        className={`text-sm sm:text-base font-medium leading-relaxed whitespace-pre-wrap break-words ${
                          msg.button ? 'mb-3' : ''
                        } ${
                          msg.from === "ai" ? "text-white" : ""
                        }`}
                        style={msg.from === "ai" ? { color: '#ffffff' } : {}}
                      >
                        {msg.text}
                      </p>
                      {msg.button && (
                        <button
                          className="w-full bg-white text-gray-900 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
                          onClick={() => {
                            // Action à définir
                            console.log('Voir les messages envoyés');
                          }}
                        >
                          Cliquer pour voir les messages envoyés
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Zone de frappe - style ChatGPT/Cursor */}
        <div className="pt-5">
          <div 
            className={`flex items-end gap-3 rounded-2xl border transition-all duration-200 ${
              isTyping || typedText 
                ? "bg-white border-gray-300 shadow-lg ring-1 ring-gray-200" 
                : isSending
                ? "bg-gray-50 border-gray-200 opacity-60"
                : "bg-gray-50 border-gray-200 hover:border-gray-300"
            }`}
            style={{
              padding: '14px 18px',
              minHeight: '60px'
            }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ background: 'linear-gradient(to right, #c081e3, #823F91)' }}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 relative min-h-[36px] flex items-center">
              <div className="w-full relative">
                <div 
                  className="w-full bg-transparent text-sm sm:text-base text-gray-900 placeholder-gray-400 py-2 min-h-[36px] flex items-center"
                  style={{
                    minHeight: '36px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }}
                >
                  {typedText || (isTyping ? '' : '')}
                  {isTyping && (
                    <span className="inline-block w-0.5 h-5 bg-gray-400 ml-1.5 animate-pulse" style={{ animationDuration: '1s' }} />
                  )}
                </div>
                {!typedText && !isTyping && (
                  <div className="absolute inset-0 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm sm:text-base">Ex: Traiteur halal spécialisé cuisine libanaise + française, 120 invités, Paris...</span>
                  </div>
                )}
              </div>
            </div>
            {showSendButton && (
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white transition-all hover:scale-105 hover:shadow-md active:scale-95"
                style={{ background: 'linear-gradient(to right, #c081e3, #823F91)' }}
              >
                <Send className="w-5 h-5" />
              </button>
            )}
            {isSending && (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(to right, #c081e3, #823F91)' }}
              >
                <Send className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '1s' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function MatchingQuizSection() {
  const router = useRouter()
  
  // Pattern d'animation au scroll (existant dans le projet)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  return (
    <section
      id="trouver-un-prestataire"
      ref={sectionRef}
      className="py-8 sm:py-12 md:py-20 px-3 sm:px-4 bg-background relative overflow-hidden scroll-mt-20"
    >
      <div className="max-w-4xl mx-auto">
        {/* Rectangle avec icône HeartHandshake */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8 flex items-center justify-center"
        >
          <motion.div 
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg flex items-center justify-center"
            style={{ 
              backgroundColor: '#823F91',
              boxShadow: '0 0 30px rgba(130, 63, 145, 0.3), 0 0 60px rgba(130, 63, 145, 0.2), 0 0 90px rgba(130, 63, 145, 0.1)'
            }}
            animate={isVisible ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={{
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            <motion.div 
              className="text-white"
              animate={isVisible ? {
                rotate: [0, 5, -5, 0],
              } : {}}
              transition={{
                rotate: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              <HeartHandshake 
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                strokeWidth={2.5}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Titre principal (apparaît au scroll) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8 md:mb-12"
        >
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2"
            style={{ color: '#823F91' }}
          >
            Matchez vos prestataires en 2 minutes
          </h2>
        </motion.div>
      </div>

      {/* Section Matching intelligent */}
      <div className="w-full px-3 sm:px-4">
        <SkeletonMatchingFullWidth />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Cartes explicatives */}
        <div className="mb-8 sm:mb-12">
          <MatchingExplainerCards />
        </div>

        {/* Bouton CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center justify-center w-full mb-8 sm:mb-10 px-4"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => router.push('/tarifs')}
              type="button"
              className="text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 shadow-lg hover:shadow-xl w-full sm:w-auto rounded-lg font-semibold text-white transition-all"
              style={{
                backgroundColor: '#c081e3',
                color: 'white',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                Tester le matching
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
