"use client"

import { useState } from "react"
import { Play, XIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"

import { cn } from "@/lib/utils"

type AnimationStyle =
  | "from-bottom"
  | "from-center"
  | "from-top"
  | "from-left"
  | "from-right"
  | "fade"
  | "top-in-bottom-out"
  | "left-in-right-out"

interface HeroVideoProps {
  animationStyle?: AnimationStyle
  videoSrc: string
  thumbnailSrc: string
  thumbnailAlt?: string
  className?: string
  videoType?: "iframe" | "mp4" // Type de vidéo: iframe (YouTube/Vimeo) ou mp4 (local)
}

const animationVariants = {
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  "from-left": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  "from-right": {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "top-in-bottom-out": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "left-in-right-out": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
}

export function HeroVideoDialog({
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video thumbnail",
  className,
  videoType = "iframe", // Par défaut iframe pour compatibilité
}: HeroVideoProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)
  const selectedAnimation = animationVariants[animationStyle]

  // Détecter automatiquement le type de vidéo si non spécifié
  const detectedVideoType = videoType === "iframe" 
    ? (videoSrc.includes("youtube.com") || videoSrc.includes("youtu.be") || videoSrc.includes("vimeo.com") ? "iframe" : "mp4")
    : videoType

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Play video"
        className="group relative cursor-pointer border-0 bg-transparent p-0 w-full"
        onClick={() => setIsVideoOpen(true)}
      >
        <div className="relative w-full aspect-video overflow-hidden rounded-lg border shadow-2xl transition-all duration-300 ease-out group-hover:brightness-[0.85] group-hover:scale-[1.02] group-hover:shadow-[#823F91]/20">
          {!thumbnailError && thumbnailSrc ? (
            <Image
              src={thumbnailSrc}
              alt={thumbnailAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 900px"
              priority={false}
              loading="lazy"
              onError={() => setThumbnailError(true)}
            />
          ) : (
            // Placeholder avec gradient si l'image n'existe pas
            <div className="absolute inset-0 bg-gradient-to-br from-[#823F91]/20 via-[#9D5FA8]/20 to-[#E8D4EF]/30 flex items-center justify-center">
              <div className="text-center space-y-4 px-8">
                <div className="text-4xl font-bold text-[#823F91] mb-2">Nuply</div>
                <div className="text-lg text-slate-600 font-medium">Démo en 45 secondes</div>
                <div className="text-sm text-slate-500">Voir comment ça marche</div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="bg-[#823F91]/20 flex size-28 items-center justify-center rounded-full backdrop-blur-md border border-white/20">
              <div className="from-[#823F91]/40 to-[#823F91] relative flex size-20 items-center justify-center rounded-full bg-gradient-to-b shadow-xl transition-all duration-300 ease-out group-hover:scale-110">
                <Play
                  className="size-10 fill-white text-white transition-transform duration-300 ease-out group-hover:scale-110 ml-1"
                  style={{
                    filter:
                      "drop-shadow(0 4px 3px rgb(0 0 0 / 0.3)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.2))",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </button>
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                setIsVideoOpen(false)
              }
            }}
            onClick={() => setIsVideoOpen(false)}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              {...selectedAnimation}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative mx-4 aspect-video w-full max-w-4xl md:mx-0"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button 
                onClick={() => setIsVideoOpen(false)}
                className="absolute -top-16 right-0 rounded-full bg-white/10 p-2 text-xl text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-white/20 transition-colors"
                aria-label="Fermer la vidéo"
              >
                <XIcon className="size-5" />
              </motion.button>
              <div className="relative isolate z-[1] size-full overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl">
                {detectedVideoType === "mp4" ? (
                  <video
                    src={videoSrc}
                    autoPlay
                    controls
                    muted
                    playsInline
                    className="size-full rounded-2xl"
                    onEnded={() => setIsVideoOpen(false)}
                  >
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                ) : (
                  <iframe
                    src={videoSrc}
                    title="Hero Video player"
                    className="size-full rounded-2xl"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  ></iframe>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
