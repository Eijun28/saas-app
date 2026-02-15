/**
 * Rate limiting basé sur LRU Cache
 * Limite le nombre de requêtes par IP, configurable par route
 */

import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  maxIps?: number;
}

class RateLimiter {
  private cache: LRUCache<string, RateLimitEntry>;
  private maxRequests: number;
  private windowMs: number;

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
    this.cache = new LRUCache<string, RateLimitEntry>({
      max: config.maxIps ?? 500,
      ttl: config.windowMs,
    });
  }

  check(key: string): boolean {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (!entry || now > entry.resetTime) {
      this.cache.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    this.cache.set(key, entry);
    return true;
  }

  getResetTime(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return 0;
    return Math.max(0, Math.ceil((entry.resetTime - Date.now()) / 1000));
  }

  getRemaining(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return this.maxRequests;
    return Math.max(0, this.maxRequests - entry.count);
  }
}

// --- Limiteurs par contexte ---

// Chatbot : 10 req/min (IA coûteuse)
export const chatbotLimiter = new RateLimiter({ maxRequests: 10, windowMs: 60_000 });

// Auth : 5 req/min (protection brute-force)
export const authLimiter = new RateLimiter({ maxRequests: 5, windowMs: 60_000 });

// API générale : 30 req/min
export const apiLimiter = new RateLimiter({ maxRequests: 30, windowMs: 60_000 });

// Messaging : 20 req/min
export const messagingLimiter = new RateLimiter({ maxRequests: 20, windowMs: 60_000 });

// Devis/Factures : 10 req/min
export const devisLimiter = new RateLimiter({ maxRequests: 10, windowMs: 60_000 });

// Contact/Form : 3 req/min
export const formLimiter = new RateLimiter({ maxRequests: 3, windowMs: 60_000 });

/**
 * Récupère l'adresse IP depuis une requête Next.js
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;

  return 'unknown';
}

/**
 * Helper : appliquer le rate limiting dans une route API
 * Retourne une NextResponse 429 si limité, ou null si OK
 */
export function withRateLimit(
  request: NextRequest,
  limiter: RateLimiter
): NextResponse | null {
  const ip = getClientIp(request);
  const allowed = limiter.check(ip);

  if (!allowed) {
    const resetTime = limiter.getResetTime(ip);
    return NextResponse.json(
      {
        error: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
        retryAfter: resetTime,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(resetTime),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return null;
}

// Exports de compatibilité
/** @deprecated Utiliser chatbotLimiter.check() */
export function checkRateLimit(ip: string): boolean {
  return chatbotLimiter.check(ip);
}

/** @deprecated Utiliser getClientIp() */
export function getClientIP(request: NextRequest): string {
  return getClientIp(request);
}
