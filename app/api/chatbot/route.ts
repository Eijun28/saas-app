
import { NextRequest, NextResponse } from 'next/server';
import { 
  isValidMessage, 
  isValidSessionId, 
  sanitizeMessage} from '@/lib/security';
import { chatbotLimiter, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_CHATBOT_URL;


export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    
    if (!chatbotLimiter.check(clientIp)) {
      const resetTime = chatbotLimiter.getResetTime(clientIp);
      logger.warn('Rate limit dépassé pour chatbot', { ip: clientIp });
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter.', retryAfter: resetTime },
        { status: 429, headers: { 'Retry-After': resetTime.toString() } }
      );
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!isValidMessage(message)) {
      return NextResponse.json(
        { error: 'Message invalide ou trop long (max 1000 caractères)' },
        { status: 400 }
      );
    }

    if (!isValidSessionId(sessionId)) {
      return NextResponse.json(
        { error: 'Session invalide' },
        { status: 400 }
      );
    }

    const sanitizedMessage = sanitizeMessage(message);

    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible' },
        { status: 503 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sanitizedMessage,  // ✅ Input sanitisé
          sessionId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!n8nResponse.ok) {
        return NextResponse.json(
          { error: 'Service temporairement indisponible' },
          { status: 503 }
        );
      }

      const data = await n8nResponse.json();
      const botResponse = data.response || data.output || data.message;

      if (!botResponse) {
        return NextResponse.json(
          { error: 'Erreur dans la génération de la réponse' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          response: botResponse,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'La requête a pris trop de temps. Veuillez réessayer.' },
          { status: 504 }
        );
      }

      if (error.message?.includes('fetch')) {
        return NextResponse.json(
          { error: 'Impossible de contacter le service.' },
          { status: 503 }
        );
      }

      throw error;
    }

  } catch (error) {
    logger.error('Erreur chatbot', error);
    return NextResponse.json(
      { error: 'Une erreur inattendue s\'est produite.' },
      { status: 500 }
    );
  }
}
