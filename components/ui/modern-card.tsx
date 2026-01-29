'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ModernCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  delay?: number;
  glassmorphism?: boolean;
}

export function ModernCard({ 
  children, 
  className, 
  delay = 0,
  glassmorphism = false,
  ...props 
}: ModernCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.16, 1, 0.3, 1] as const // Custom easing pour un effet plus fluide
      }}
      whileHover={{ 
        y: -2, 
        scale: 1.01,
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      className="h-full"
      {...props}
    >
      <Card
        className={cn(
          'h-full rounded-xl transition-all duration-300 border-0 shadow-sm',
          'hover:shadow-md',
          'bg-white gap-4 py-4',
          glassmorphism && 'backdrop-blur-md bg-purple-500/5',
          className
        )}
      >
        {children}
      </Card>
    </motion.div>
  );
}

// Variants d'animation réutilisables
export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

export const hoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
};

