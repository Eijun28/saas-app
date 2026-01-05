"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const Menu = ({
  setActive,
  children,
  className,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <nav
      className={cn("relative flex justify-center space-x-3", className)}
    >
      {children}
    </nav>
  );
};

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
  href,
}: {
  setActive: (item: string | null) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
  href?: string;
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (href) {
      if (href.startsWith('/#')) {
        e.preventDefault();
        // Vérifier que nous sommes côté client
        if (typeof window !== 'undefined') {
          const targetId = href.replace('/#', '');
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
      setActive(null);
    }
  };

  const content = href ? (
    <Link
      href={href}
      onClick={handleClick}
      className="cursor-pointer text-black hover:opacity-[0.9] text-sm font-medium flex items-center h-8"
    >
      {item}
    </Link>
  ) : (
    <motion.p
      transition={{ duration: 0.3 }}
      className="cursor-pointer text-black hover:opacity-[0.9] text-sm font-medium flex items-center h-8"
    >
      {item}
    </motion.p>
  );

  return (
    <div 
      onMouseEnter={() => setActive(item)}
      onMouseLeave={() => setActive(null)}
      className="relative"
    >
      {content}
      {active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.5, stiffness: 260, damping: 20 }}
          onMouseEnter={() => setActive(item)}
          onMouseLeave={() => setActive(null)}
        >
          {active === item && (
            <div className="absolute top-[calc(100%_+_0.5rem)] left-1/2 transform -translate-x-1/2 pt-2">
              {/* Pont invisible pour maintenir le hover */}
              <div className="absolute top-0 left-0 right-0 h-2 -translate-y-2" />
              <motion.div
                transition={{ type: "spring", duration: 0.5, stiffness: 260, damping: 20 }}
                layoutId="active"
                className="bg-white rounded-2xl overflow-hidden border border-black/[0.1] shadow-xl"
                onMouseEnter={() => setActive(item)}
                onMouseLeave={() => setActive(null)}
              >
                <motion.div layout className="w-max h-full p-4">
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const HoveredLink = ({
  children,
  className,
  href,
  ...rest
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      // Vérifier que nous sommes côté client
      if (typeof window !== 'undefined') {
        const targetId = href.replace('#', '');
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      {...rest}
      className={cn(
        "text-neutral-700 hover:text-black",
        className
      )}
    >
      {children}
    </Link>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  src,
}: {
  title: string;
  description: string;
  href: string;
  src: string;
}) => {
  return (
    <Link href={href} className="flex space-x-2">
      <img
        src={src}
        alt={title}
        className="flex-shrink-0 rounded-md shadow-2xl w-[140px] h-[70px] object-cover"
      />
      <div>
        <h4 className="text-xl font-bold mb-1 text-black">
          {title}
        </h4>
        <p className="text-neutral-700 text-sm max-w-[10rem]">
          {description}
        </p>
      </div>
    </Link>
  );
};

