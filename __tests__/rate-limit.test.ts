/**
 * Tests pour le système de rate limiting
 */

// Mock lru-cache avant l'import
jest.mock('lru-cache', () => {
  return {
    LRUCache: jest.fn().mockImplementation(() => {
      const store = new Map<string, unknown>();
      return {
        get: (key: string) => store.get(key),
        set: (key: string, value: unknown) => store.set(key, value),
        has: (key: string) => store.has(key),
        delete: (key: string) => store.delete(key),
        clear: () => store.clear(),
      };
    }),
  };
});

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      body,
      status: init?.status ?? 200,
      headers: init?.headers ?? {},
    }),
  },
}));

import { chatbotLimiter, authLimiter, apiLimiter, formLimiter, getClientIp } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  describe('chatbotLimiter (10 req/min)', () => {
    it('should allow requests under the limit', () => {
      const ip = 'test-chatbot-1';
      for (let i = 0; i < 10; i++) {
        expect(chatbotLimiter.check(ip)).toBe(true);
      }
    });

    it('should block requests over the limit', () => {
      const ip = 'test-chatbot-2';
      for (let i = 0; i < 10; i++) {
        chatbotLimiter.check(ip);
      }
      expect(chatbotLimiter.check(ip)).toBe(false);
    });

    it('should track different IPs independently', () => {
      const ip1 = 'test-chatbot-3a';
      const ip2 = 'test-chatbot-3b';

      // Fill up ip1
      for (let i = 0; i < 10; i++) {
        chatbotLimiter.check(ip1);
      }

      // ip2 should still be allowed
      expect(chatbotLimiter.check(ip2)).toBe(true);
      // ip1 should be blocked
      expect(chatbotLimiter.check(ip1)).toBe(false);
    });
  });

  describe('authLimiter (5 req/min)', () => {
    it('should allow 5 requests then block', () => {
      const ip = 'test-auth-1';
      for (let i = 0; i < 5; i++) {
        expect(authLimiter.check(ip)).toBe(true);
      }
      expect(authLimiter.check(ip)).toBe(false);
    });
  });

  describe('apiLimiter (30 req/min)', () => {
    it('should allow 30 requests then block', () => {
      const ip = 'test-api-1';
      for (let i = 0; i < 30; i++) {
        expect(apiLimiter.check(ip)).toBe(true);
      }
      expect(apiLimiter.check(ip)).toBe(false);
    });
  });

  describe('formLimiter (3 req/min)', () => {
    it('should allow 3 requests then block', () => {
      const ip = 'test-form-1';
      for (let i = 0; i < 3; i++) {
        expect(formLimiter.check(ip)).toBe(true);
      }
      expect(formLimiter.check(ip)).toBe(false);
    });
  });

  describe('getResetTime', () => {
    it('should return 0 for unknown IP', () => {
      expect(chatbotLimiter.getResetTime('unknown-ip-xyz')).toBe(0);
    });

    it('should return positive value for rate-limited IP', () => {
      const ip = 'test-reset-1';
      for (let i = 0; i < 10; i++) {
        chatbotLimiter.check(ip);
      }
      expect(chatbotLimiter.getResetTime(ip)).toBeGreaterThan(0);
    });
  });

  describe('getRemaining', () => {
    it('should return max for unknown IP', () => {
      // The chatbot limiter has 10 max requests
      expect(chatbotLimiter.getRemaining('fresh-ip-xyz')).toBe(10);
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '1.2.3.4, 5.6.7.8';
            return null;
          },
        },
      } as unknown as import('next/server').NextRequest;

      expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('should extract IP from x-real-ip', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-real-ip') return '10.0.0.1';
            return null;
          },
        },
      } as unknown as import('next/server').NextRequest;

      expect(getClientIp(request)).toBe('10.0.0.1');
    });

    it('should return unknown when no IP headers', () => {
      const request = {
        headers: {
          get: () => null,
        },
      } as unknown as import('next/server').NextRequest;

      expect(getClientIp(request)).toBe('unknown');
    });
  });
});
