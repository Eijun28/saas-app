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

const MAX_REQUESTS = 10; // Nombre maximum de requêtes par fenêtre
const WINDOW_MS = 60000; // 1 minute

class ChatbotRateLimiter {
  private cache: LRUCache<string, RateLimitEntry>;

  constructor() {
    this.cache = new LRUCache<string, RateLimitEntry>({
      max: 500, // Nombre maximum d'IPs à tracker
      ttl: WINDOW_MS,
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
        resetTime: now + WINDOW_MS,
      });
      return true;
    }

    // Vérifier si la fenêtre de temps est expirée
    if (now > entry.resetTime) {
      // Réinitialiser le compteur
      this.cache.set(ip, {
        count: 1,
        resetTime: now + WINDOW_MS,
      });
      return true;
    }

    // Vérifier si le nombre de requêtes est dépassé
    if (entry.count >= MAX_REQUESTS) {
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

// Instance singleton pour le rate limiting du chatbot
export const chatbotLimiter = new ChatbotRateLimiter();

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

