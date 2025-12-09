"use client";

import React from "react";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "NUPLY nous a permis de trouver une négafa qui comprenait parfaitement nos traditions franco-algériennes. Notre mariage était exactement comme nous l'avions rêvé !",
    image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=100&h=100&fit=crop",
    name: "Sarah & Karim",
    role: "Mariage franco-algérien",
  },
  {
    text: "En tant que couple mixte, trouver des prestataires qui respectent nos deux cultures était un défi. NUPLY a rendu cela si simple !",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=100&h=100&fit=crop",
    name: "Priya & Thomas",
    role: "Mariage indo-français",
  },
  {
    text: "Le DJ que nous avons trouvé via NUPLY maîtrisait parfaitement la dabké et la variété française. Nos invités étaient ravis !",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=100&h=100&fit=crop",
    name: "Layla & Marc",
    role: "Mariage libano-français",
  },
  {
    text: "La messagerie intégrée nous a permis de communiquer facilement avec tous nos prestataires. Tout s'est déroulé à la perfection !",
    image: "https://images.unsplash.com/photo-1518621012428-ef8be442a055?w=100&h=100&fit=crop",
    name: "Amina & David",
    role: "Mariage maroco-français",
  },
  {
    text: "Grâce à NUPLY, nous avons trouvé un traiteur qui proposait des menus végétariens indiens ET français. Un vrai bonheur !",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=100&h=100&fit=crop",
    name: "Meera & Lucas",
    role: "Mariage indo-français",
  },
  {
    text: "L'IA de matching a vraiment compris nos besoins culturels spécifiques. Nous recommandons NUPLY à tous les couples multiculturels !",
    image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=100&h=100&fit=crop",
    name: "Fatima & Jean",
    role: "Mariage tuniso-français",
  },
];

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full" key={i}>
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed">{text}</div>
                  <div className="flex items-center gap-2 mt-5">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5 text-gray-900 dark:text-gray-100">{name}</div>
                      <div className="leading-5 opacity-60 tracking-tight text-gray-600 dark:text-gray-400">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

