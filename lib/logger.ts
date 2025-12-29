/**
 * Système de logging structuré pour Nuply
 * - En développement : logs dans la console
 * - En production : logs structurés (prêt pour Sentry, LogRocket, etc.)
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMeta {
  [key: string]: unknown;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log un message d'information
   */
  info(message: string, meta?: LogMeta): void {
    if (!this.isProduction) {
      console.log(`ℹ️ ${message}`, meta || '');
    }
    // En production, envoyer à un service de monitoring
    // Exemple: Sentry.captureMessage(message, { level: 'info', extra: meta });
  }

  /**
   * Log un message de debug (uniquement en développement)
   */
  debug(message: string, meta?: LogMeta): void {
    if (!this.isProduction) {
      console.log(`🔍 ${message}`, meta || '');
    }
  }

  /**
   * Log un avertissement
   */
  warn(message: string, meta?: LogMeta): void {
    console.warn(`⚠️ ${message}`, meta || '');
    // En production, envoyer à un service de monitoring
    // Exemple: Sentry.captureMessage(message, { level: 'warning', extra: meta });
  }

  /**
   * Log une erreur
   * Les erreurs sont toujours loggées, même en production
   */
  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    const errorDetails = error instanceof Error 
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : error;

    console.error(`❌ ${message}`, {
      ...meta,
      error: errorDetails,
    });

    // En production, envoyer à un service de monitoring
    // Exemple: Sentry.captureException(error, { extra: { message, ...meta } });
  }

  /**
   * Log une opération API
   */
  api(method: string, path: string, status: number, meta?: LogMeta): void {
    const emoji = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢';
    if (!this.isProduction) {
      console.log(`${emoji} ${method} ${path} - ${status}`, meta || '');
    }
    // En production, envoyer à un service de monitoring
  }
}

// Instance singleton
export const logger = new Logger();

