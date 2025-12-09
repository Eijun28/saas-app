"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function FlipWords({
  words,
  duration = 3000,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    const startAnimation = () => {
      let currentIndex = 0;

      interval = setInterval(() => {
        setIsAnimating(true);

        timeout = setTimeout(() => {
          currentIndex = (currentIndex + 1) % words.length;
          setCurrentWord(words[currentIndex]);
          setIsAnimating(false);
        }, 150); // Half of the flip animation duration
      }, duration);
    };

    startAnimation();

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [words, duration]);

  return (
    <div className="relative inline-block">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentWord}
          initial={{ opacity: 0, y: 10, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -10, rotateX: 90 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className={cn("inline-block", className)}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

