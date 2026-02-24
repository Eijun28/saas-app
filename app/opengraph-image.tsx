import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Nuply — Plateforme de mariage multiculturel'
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
        {/* Cercles décoratifs */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(130, 63, 145, 0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(130, 63, 145, 0.06)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#823F91',
              letterSpacing: '-2px',
            }}
          >
            NUPLY
          </div>
        </div>

        {/* Titre principal */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: '#2C1810',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '24px',
            maxWidth: '900px',
          }}
        >
          Votre mariage, vos racines
        </div>

        {/* Sous-titre */}
        <div
          style={{
            fontSize: '28px',
            color: '#8B7866',
            textAlign: 'center',
            maxWidth: '780px',
            lineHeight: 1.4,
            marginBottom: '48px',
          }}
        >
          Trouvez des prestataires qui comprennent votre culture et vos traditions
        </div>

        {/* Pill / badge */}
        <div
          style={{
            display: 'flex',
            padding: '14px 36px',
            background: '#823F91',
            borderRadius: '100px',
            fontSize: '22px',
            color: 'white',
            fontWeight: 600,
            letterSpacing: '0.3px',
          }}
        >
          Mariage multiculturel · Matching IA · Prestataires vérifiés
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
