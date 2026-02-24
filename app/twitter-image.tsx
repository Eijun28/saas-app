import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Nuply — Mariage multiculturel'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #FAF9F6 0%, #F3E8F7 60%, #E8D4EF 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Cercle décoratif */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'rgba(130, 63, 145, 0.08)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '36px',
          }}
        >
          <div
            style={{
              fontSize: '44px',
              fontWeight: 900,
              color: '#823F91',
              letterSpacing: '-2px',
            }}
          >
            NUPLY
          </div>
        </div>

        {/* Titre */}
        <div
          style={{
            fontSize: '58px',
            fontWeight: 800,
            color: '#2C1810',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '24px',
            maxWidth: '860px',
          }}
        >
          Votre mariage, vos racines
        </div>

        {/* Sous-titre */}
        <div
          style={{
            fontSize: '26px',
            color: '#8B7866',
            textAlign: 'center',
            maxWidth: '720px',
            lineHeight: 1.4,
            marginBottom: '40px',
          }}
        >
          Prestataires multiculturels vérifiés · Matching IA
        </div>

        {/* Pill */}
        <div
          style={{
            display: 'flex',
            padding: '12px 32px',
            background: '#823F91',
            borderRadius: '100px',
            fontSize: '20px',
            color: 'white',
            fontWeight: 600,
          }}
        >
          nuply.fr
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
