/**
 * Rate limiting simple basé sur LRU Cache
 * Limite le nombre de requêtes par IP
 */

import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterConfig {
  max: number;
  windowMs: number;
  maxIps?: number;
}

class RateLimiter {
  private cache: LRUCache<string, RateLimitEntry>;
  private maxRequests: number;
  private windowMs: number;

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.max;
    this.windowMs = config.windowMs;
    this.cache = new LRUCache<string, RateLimitEntry>({
      max: config.maxIps || 500,
      ttl: config.windowMs,
    });
  }

  /**
   * Vérifie si une IP peut faire une requête
   * @param ip - L'adresse IP du client
   * @returns true si la requête est autorisée, false si rate limited
   */
  check(ip: string): boolean {
    const now = Date.now();
    const entry = this.cache.get(ip);

    if (!entry) {
      // Première requête de cette IP
      this.cache.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // Vérifier si la fenêtre de temps est expirée
    if (now > entry.resetTime) {
      // Réinitialiser le compteur
      this.cache.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // Vérifier si le nombre de requêtes est dépassé
    if (entry.count >= this.maxRequests) {
      return false; // Rate limited
    }

    // Incrémenter le compteur
    entry.count++;
    this.cache.set(ip, entry);
    return true;
  }

  /**
   * Récupère le temps de réinitialisation pour une IP
   * @param ip - L'adresse IP du client
   * @returns Le nombre de secondes avant la réinitialisation
   */
  getResetTime(ip: string): number {
    const entry = this.cache.get(ip);
    if (!entry) {
      return 0;
    }

    const now = Date.now();
    const remaining = Math.ceil((entry.resetTime - now) / 1000);
    return Math.max(0, remaining);
  }
}

// Rate limiters pour différents types d'endpoints
export const chatbotLimiter = new RateLimiter({
  max: 10,
  windowMs: 60000, // 1 minute
});

export const apiLimiter = new RateLimiter({
  max: 50,
  windowMs: 60000, // 1 minute
});

export const uploadLimiter = new RateLimiter({
  max: 5,
  windowMs: 60000, // 1 minute
});

export const inviteLimiter = new RateLimiter({
  max: 10,
  windowMs: 3600000, // 1 heure
});

export const pdfLimiter = new RateLimiter({
  max: 10,
  windowMs: 60000, // 1 minute
});

/**
 * Récupère l'adresse IP depuis une requête Next.js
 */
export function getClientIp(request: NextRequest): string {
  // Essayer de récupérer l'IP depuis les headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback (ne devrait jamais arriver en production)
  return 'unknown';
}

// Exports pour compatibilité (dépréciés)
/**
 * @deprecated Utiliser chatbotLimiter.check() à la place
 */
export function checkRateLimit(ip: string): boolean {
  return chatbotLimiter.check(ip);
}

/**
 * @deprecated Utiliser getClientIp() à la place
 */
export function getClientIP(request: NextRequest): string {
  return getClientIp(request);
}

