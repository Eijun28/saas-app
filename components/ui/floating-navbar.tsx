"use client";
import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: React.ReactElement;
  }[];
  className?: string;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Toujours visible après 100px de scroll
          if (currentScrollY > 100) {
            setVisible(true);
          } else {
            setVisible(false);
          }
          
          lastScrollY = currentScrollY;
          ticking = false;
        });
        
        ticking = true;
      }
    };

    // Initial check
    if (window.scrollY > 100) {
      setVisible(true);
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (link: string, e: React.MouseEvent) => {
    if (link.startsWith('#')) {
      e.preventDefault();
      const targetId = link.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{
            opacity: 0,
            y: -100,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          exit={{
            y: -100,
            opacity: 0,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className={cn(
            "flex max-w-fit fixed top-10 inset-x-0 mx-auto border border-purple-200 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-xl z-[5000] px-8 py-2 items-center justify-center space-x-4 shadow-lg",
            className
          )}
        >
        {navItems.map((navItem: any, idx: number) => (
          <Link
            key={`link=${idx}`}
            href={navItem.link}
            onClick={(e) => handleLinkClick(navItem.link, e)}
            className={cn(
              "relative dark:text-neutral-50 items-center flex space-x-1 text-neutral-600 dark:hover:text-neutral-300 hover:text-purple-600 transition-colors"
            )}
          >
            <span className="block sm:hidden">{navItem.icon}</span>
            <span className="hidden sm:block text-sm">{navItem.name}</span>
          </Link>
        ))}
        <Link
          href="/sign-up"
          className="border text-sm font-medium relative border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-500 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 transition-colors"
        >
          <span>Commencer</span>
        </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

