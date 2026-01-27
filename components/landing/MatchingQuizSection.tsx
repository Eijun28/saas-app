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
      query: "Je cherche un traiteur marocain + français, halal, pour 150 personnes. Budget 6000-7000€",
      result: "J'ai trouvé 3 traiteurs qui matchent ! Tous halal et bilingues. Budget : 6200-6800€. On les contacte ?"
    },
    {
      query: "Traiteur fusion indienne-française, végétarien, 80 personnes, max 4500€",
      result: "4 traiteurs trouvés ! Spécialisés fusion végé. Budget : 4000-4400€. Ça te va ?"
    },
    {
      query: "Traiteur libanais authentique, 200 invités, budget 8000€, région Marseille",
      result: "2 traiteurs parfaits ! Expérience mariages mixtes. Budget : 7800-8200€. Je les contacte ?"
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
    if (messagesContainerRef.current) {
      // Utiliser requestAnimationFrame pour éviter les sauts
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          // Scroll vers le bas pour voir les nouveaux messages (comme un vrai chat)
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
    }
  }, [displayedMessages.length, typedText]);

  useEffect(() => {
    if (!isInView) return;
    
    let typingTimeout: ReturnType<typeof setTimeout> | null = null;
    let responseTimeout: ReturnType<typeof setTimeout> | null = null;
    let coupleMessageTimeout: ReturnType<typeof setTimeout> | null = null;
    let sendTimeout: ReturnType<typeof setTimeout> | null = null;
    let finalMessageTimeout: ReturnType<typeof setTimeout> | null = null;
    let restartTimeout: ReturnType<typeof setTimeout> | null = null;
    
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
                    finalMessageTimeout = setTimeout(() => {
                      setDisplayedMessages(prev => [...prev, {
                        from: "ai",
                        text: "Demandes envoyées !",
                        avatar: "ai",
                        button: true
                      }]);
                      
                      // Attendre 4 secondes après l'affichage du message avec bouton avant de redémarrer
                      restartTimeout = setTimeout(() => {
                        // Passer au prochain set de conversation
                        setCurrentSet((prev) => (prev + 1) % conversationSets.length);
                      }, 4000);
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
    
    // Démarrer le cycle initial
    startCycle();

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
      if (responseTimeout) clearTimeout(responseTimeout);
      if (coupleMessageTimeout) clearTimeout(coupleMessageTimeout);
      if (sendTimeout) clearTimeout(sendTimeout);
      if (finalMessageTimeout) clearTimeout(finalMessageTimeout);
      if (restartTimeout) clearTimeout(restartTimeout);
    };
  }, [isInView, currentSet]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full max-w-7xl mx-auto h-full min-h-[400px] sm:min-h-[500px] bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl border border-gray-100 p-3 sm:p-4 md:p-6 lg:p-8 relative overflow-hidden flex flex-col"
    >
      <div className="absolute inset-0 blur-3xl opacity-5" style={{ background: 'linear-gradient(to bottom right, rgba(192, 129, 227, 0.1), rgba(130, 63, 145, 0.1), rgba(192, 129, 227, 0.1))' }} />
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {/* Conversation - messages qui apparaissent au-dessus du champ de saisie */}
        <div 
          ref={messagesContainerRef}
          className="flex flex-col space-y-1 pt-2 sm:pt-3 flex-1 min-h-0 overflow-y-auto scroll-smooth px-2 sm:px-3 bg-white"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-400">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 bg-gray-100 overflow-hidden">
                <img
                  src="/images/ai-assistant-avatar-3d.png"
                  alt="Assistant IA"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    // Fallback vers l'icône Sparkles si l'image ne charge pas
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.sparkles-fallback')) {
                      const sparkles = document.createElement('div');
                      sparkles.className = 'sparkles-fallback';
                      sparkles.innerHTML = '<svg class="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>';
                      parent.appendChild(sparkles.firstChild!);
                    }
                  }}
                />
              </div>
              <p className="text-sm sm:text-base font-medium mb-1 text-gray-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
                Commencez votre recherche
              </p>
            </div>
          ) : (
            <>
              {displayedMessages.map((msg, i) => (
                <div
                  key={`msg-${i}-${msg.from}`}
                  className={`flex items-start gap-2 sm:gap-3 ${msg.from === "couple" ? "justify-start" : "justify-end"} w-full mb-1`}
                >
                  {/* Avatar pour les messages de l'IA */}
                  {msg.from === "ai" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src="/images/ai-assistant-avatar-3d.png"
                        alt="Assistant IA"
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.sparkles-fallback')) {
                            const sparkles = document.createElement('div');
                            sparkles.className = 'sparkles-fallback';
                            sparkles.innerHTML = '<svg class="w-4 h-4 text-[#823F91]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>';
                            parent.appendChild(sparkles.firstChild!);
                          }
                        }}
                      />
                    </div>
                  )}
                  
                  <div 
                    className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${
                      msg.from === "ai" ? "" : ""
                    }`}
                  >
                    <div 
                      className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 break-words ${
                        msg.from === "couple" 
                          ? "bg-gray-100 text-gray-900 rounded-bl-sm" 
                          : "bg-[#823F91] text-white rounded-br-sm"
                      }`}
                      style={msg.from === "ai" ? { 
                        backgroundColor: '#823F91',
                        color: '#ffffff'
                      } : {}}
                    >
                      <p 
                        className={`text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                          msg.button ? 'mb-2' : ''
                        } ${msg.from === "ai" ? 'text-white' : ''}`}
                        style={{ 
                          fontFamily: msg.from === "ai" ? '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' : '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 400,
                          color: msg.from === "ai" ? '#ffffff' : undefined
                        }}
                      >
                        {msg.text}
                      </p>
                      {msg.button && (
                        <button
                          className="w-full bg-white text-gray-900 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors active:scale-95 mt-2"
                          onClick={() => {
                            // Action à définir
                          }}
                        >
                          Cliquer pour voir les messages envoyés
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Avatar pour les messages du couple */}
                  {msg.from === "couple" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#823F91] text-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Zone de frappe - style iMessage */}
        <div className="flex-shrink-0 pt-2 sm:pt-3 border-t border-gray-200/50 bg-white">
          <div className="flex items-end gap-2 px-2 pb-2">
            <div className="flex-1 relative">
              <div 
                className={`rounded-3xl border transition-all duration-200 px-3 sm:px-4 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] flex items-center ${
                  isTyping || typedText 
                    ? "bg-white border-gray-300" 
                    : isSending
                    ? "bg-gray-100 border-gray-200 opacity-60"
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                <div className="flex-1 relative min-h-[24px] flex items-center">
                  <div className="w-full relative">
                    <div 
                      className="w-full bg-transparent text-sm sm:text-[15px] text-gray-900 py-1 min-h-[24px] flex items-center"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        lineHeight: '1.4',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word'
                      }}
                    >
                      {typedText || (isTyping ? '' : '')}
                      {isTyping && (
                        <span className="inline-block w-0.5 h-4 bg-[#823F91] ml-1 animate-pulse" style={{ animationDuration: '1s' }} />
                      )}
                    </div>
                    {!typedText && !isTyping && (
                      <div className="absolute inset-0 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-sm sm:text-[15px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
                          Tapez votre demande...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {showSendButton && (
              <button
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 bg-[#823F91] text-white transition-all hover:bg-[#6D3478] active:scale-95 shadow-sm"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            {isSending && (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 bg-[#823F91]/60">
                <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" style={{ animationDuration: '1s' }} />
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
      className="min-h-screen flex flex-col py-8 sm:py-12 md:py-20 px-0 bg-background relative overflow-hidden scroll-mt-20"
    >
      <div className="flex-1 flex flex-col justify-center w-full">
        <div className="w-full mb-6 sm:mb-8 px-3 sm:px-6 max-w-7xl mx-auto">
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

        {/* Section Matching intelligent - Même largeur que BentoGrid */}
        <div className="flex-1 flex items-center justify-center w-full px-3 sm:px-6">
          <div className="w-full max-w-7xl mx-auto h-full">
            <SkeletonMatchingFullWidth />
          </div>
        </div>

        <div className="w-full mt-8 sm:mt-12 px-3 sm:px-6 max-w-7xl mx-auto">
          {/* Cartes explicatives */}
          <div className="mb-8 sm:mb-12">
            <MatchingExplainerCards />
          </div>

          {/* Bouton CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center justify-center w-full mb-8 sm:mb-10"
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
      </div>
    </section>
  )
}
