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
        ease: [0.16, 1, 0.3, 1] // Custom easing pour un effet plus fluide
      }}
      whileHover={{ 
        y: -4, 
        scale: 1.02,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      className="h-full"
      {...props}
    >
      <Card
        className={cn(
          'h-full rounded-2xl border transition-all duration-300',
          'border-border/10 hover:border-border/20',
          'hover:shadow-xl hover:shadow-purple-500/10',
          'bg-card/50 backdrop-blur-sm',
          glassmorphism && 'backdrop-blur-md bg-purple-500/5 border-purple-500/20',
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
      ease: [0.16, 1, 0.3, 1],
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

