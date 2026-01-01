"use client";

import { cn } from "@/lib/utils";
import { Camera, UtensilsCrossed, Music, Flower2, Castle, Video } from "lucide-react";

import { AnimatedList } from "@/components/ui/animated-list";

interface Match {
  name: string;
  description: string;
  icon: 'camera' | 'food' | 'music' | 'flower' | 'venue' | 'video';
  color: string;
  time: string;
  matchScore: number;
}

let matches = [
  {
    name: "Sophie Martin",
    description: "Photographe trouvé",
    time: "Il y a 2 min",
    icon: "camera" as const,
    color: "#00C9A7",
    matchScore: 99,
  },
  {
    name: "Traiteur Le Gourmet",
    description: "Traiteur disponible",
    time: "Il y a 5 min",
    icon: "food" as const,
    color: "#FFB800",
    matchScore: 95,
  },
  {
    name: "DJ Laurent Dubois",
    description: "DJ trouvé",
    time: "Il y a 8 min",
    icon: "music" as const,
    color: "#FF3D71",
    matchScore: 92,
  },
  {
    name: "Fleuriste Roses & Co",
    description: "Fleuriste disponible",
    time: "Il y a 12 min",
    icon: "flower" as const,
    color: "#845EC2",
    matchScore: 97,
  },
  {
    name: "Château de Versailles",
    description: "Lieu de réception trouvé",
    time: "Il y a 15 min",
    icon: "venue" as const,
    color: "#FF6F91",
    matchScore: 88,
  },
  {
    name: "Vidéaste Pro Events",
    description: "Vidéaste disponible",
    time: "Il y a 18 min",
    icon: "video" as const,
    color: "#00D4FF",
    matchScore: 94,
  },
];

matches = Array.from({ length: 10 }, () => matches).flat();

const Match = ({ name, description, icon, color, time, matchScore }: Match) => {
  const IconComponent = {
    camera: Camera,
    food: UtensilsCrossed,
    music: Music,
    flower: Flower2,
    venue: Castle,
    video: Video,
  }[icon];

  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre text-lg font-medium dark:text-white ">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal dark:text-white/60">
            {description}
          </p>
        </div>
        <div className="ml-auto flex flex-col items-end">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold" style={{ color }}>
              {matchScore}%
            </span>
          </div>
          <span className="text-xs text-gray-500">compatibilité</span>
        </div>
      </div>
    </figure>
  );
};

export function AnimatedListNuply({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-[500px] w-full flex-col p-6 overflow-hidden rounded-lg border bg-background md:shadow-xl",
        className,
      )}
    >
      <AnimatedList>
        {matches.map((item, idx) => (
          <Match {...item} key={idx} />
        ))}
      </AnimatedList>
    </div>
  );
}

