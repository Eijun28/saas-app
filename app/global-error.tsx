'use client'

import { useEffect } from 'react'

/**
 * Composant de gestion d'erreur globale pour Next.js
 * Capture les erreurs non gérées dans l'application
 * Note: Ce composant doit rester simple et éviter les dépendances
 * de l'app router (Link, etc.) car il s'exécute en dehors du contexte normal.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GLOBAL ERROR]', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#FAF9F6',
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            border: '1px solid rgba(130, 63, 145, 0.2)',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{
                margin: '0 auto 1rem',
                height: '4rem',
                width: '4rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(130,63,145,0.2), rgba(157,95,168,0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                ⚠️
              </div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #823F91, #9D5FA8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem',
              }}>
                Erreur serveur
              </h1>
              <p style={{ color: '#4A4A4A', marginBottom: '1.5rem' }}>
                Une erreur critique s&apos;est produite. Veuillez réessayer ou contacter le support si le problème persiste.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={reset}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(to right, #823F91, #9D5FA8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Réessayer
                </button>
                <a
                  href="/"
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid rgba(130, 63, 145, 0.2)',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: '#4A4A4A',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textAlign: 'center',
                  }}
                >
                  Retour à l&apos;accueil
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
