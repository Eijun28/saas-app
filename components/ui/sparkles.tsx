"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  color: string;
}

interface SparklesProps {
  particleCount?: number;
  particleColors?: string[];
  speed?: number;
  className?: string;
}

export function Sparkles({
  particleCount = 200,
  particleColors = ["#823F91", "#c081e3", "#823F91"],
  speed = 0.24,
  className,
}: SparklesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparklesRef = useRef<Sparkle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();
    window.addEventListener("resize", resize);

    // Initialize sparkles
    const initSparkles = () => {
      const rect = container.getBoundingClientRect();
      sparklesRef.current = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * speed * 0.5 + speed * 0.5,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
      }));
    };

    initSparkles();

    const animate = () => {
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      timeRef.current += speed * 0.01;

      sparklesRef.current.forEach((sparkle) => {
        // Update position with floating motion
        sparkle.x += Math.sin(timeRef.current + sparkle.id) * 0.5;
        sparkle.y += Math.cos(timeRef.current * 0.7 + sparkle.id) * 0.5;

        // Wrap around edges
        if (sparkle.x < 0) sparkle.x = rect.width;
        if (sparkle.x > rect.width) sparkle.x = 0;
        if (sparkle.y < 0) sparkle.y = rect.height;
        if (sparkle.y > rect.height) sparkle.y = 0;

        // Twinkle effect
        const twinkle = Math.sin(timeRef.current * 2 + sparkle.id) * 0.3 + 0.7;
        const currentOpacity = sparkle.opacity * twinkle;

        // Draw sparkle
        ctx.beginPath();
        ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
        ctx.fillStyle = sparkle.color;
        ctx.globalAlpha = currentOpacity;
        ctx.fill();

        // Add glow effect
        const gradient = ctx.createRadialGradient(
          sparkle.x,
          sparkle.y,
          0,
          sparkle.x,
          sparkle.y,
          sparkle.size * 3
        );
        gradient.addColorStop(0, sparkle.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.globalAlpha = currentOpacity * 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particleCount, particleColors, speed]);

  return (
    <div ref={containerRef} className={cn("absolute inset-0 w-full h-full", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}
