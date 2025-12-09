/**
 * Variants d'animation réutilisables pour Framer Motion
 * Inspirés de Linear, Stripe et Notion
 */

import { Variants } from 'framer-motion';

// Animation d'entrée pour les cartes
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1], // Custom easing curve
    },
  }),
};

// Animation de hover pour les cartes
export const cardHover: Variants = {
  rest: { 
    scale: 1, 
    y: 0,
  },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { 
      duration: 0.3, 
      ease: 'easeOut' 
    }
  },
};

// Animation pour les boutons
export const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2, ease: 'easeOut' }
};

// Animation pour les icônes
export const iconHover = {
  scale: 1.1,
  rotate: 5,
  transition: { duration: 0.2 }
};

// Animation de compteur (pour les chiffres)
export const counterAnimation = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

// Animation de typing indicator (3 points)
export const typingIndicator = {
  animate: {
    opacity: [0.4, 1, 0.4],
  },
  transition: {
    repeat: Infinity,
    duration: 1.5,
    ease: 'easeInOut',
  },
};

// Animation de slide in depuis la droite (notifications)
export const slideInRight = {
  initial: { x: 300, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 300, opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

// Animation de pulse pour les badges
export const pulseBadge = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
  },
  transition: {
    repeat: Infinity,
    duration: 2,
    ease: 'easeInOut',
  },
};

// Animation de glow effect
export const glowEffect = {
  animate: {
    boxShadow: [
      '0 0 0px rgba(139, 92, 246, 0)',
      '0 0 20px rgba(139, 92, 246, 0.3)',
      '0 0 0px rgba(139, 92, 246, 0)',
    ],
  },
  transition: {
    repeat: Infinity,
    duration: 2,
    ease: 'easeInOut',
  },
};
