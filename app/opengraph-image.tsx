import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'NUPLY - Plateforme mariage next-gen'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #823F91 0%, #9D5FA8 100%)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Logo/Titre */}
        <div
          style={{
            display: 'flex',
            fontSize: 120,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.05em',
            marginBottom: 20,
          }}
        >
          NUPLY
        </div>

        {/* Sous-titre */}
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: 40,
          }}
        >
          La plateforme mariage next-gen
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: 'rgba(255, 255, 255, 0.85)',
            gap: 30,
          }}
        >
          <span>✨ Matching IA</span>
          <span>•</span>
          <span>💰 Budget</span>
          <span>•</span>
          <span>📅 Timeline</span>
          <span>•</span>
          <span>✅ Prestataires vérifiés</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

