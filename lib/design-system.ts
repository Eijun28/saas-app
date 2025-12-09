/**
 * NUPLY Design System
 * 
 * Palette de couleurs premium violet
 * Design minimaliste et élégant
 */

export const colors = {
  // Violet premium
  primary: '#823F91',
  primaryLight: '#9D5FA8',
  primaryHover: '#6D3478',
  
  // Backgrounds
  background: '#FFFFFF',
  backgroundMuted: '#F7F7F7',
  
  // Text
  textPrimary: '#0F0F0F',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  
  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Accents
  accent: '#F3F4F6',
  accentViolet: '#E8D4EF',
} as const

export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const

export const radius = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const

export const typography = {
  h1: 'text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F0F0F]',
  h2: 'text-3xl md:text-4xl font-semibold text-[#0F0F0F]',
  h3: 'text-2xl md:text-3xl font-semibold text-[#0F0F0F]',
  h4: 'text-xl md:text-2xl font-semibold text-[#0F0F0F]',
  body: 'text-base text-[#374151]',
  bodyLarge: 'text-lg text-[#374151]',
  muted: 'text-sm text-[#6B7280]',
} as const

// Classes Tailwind réutilisables
export const designTokens = {
  // Buttons
  buttonPrimary: 'bg-[#823F91] hover:bg-[#6D3478] text-white rounded-lg px-6 py-2.5 font-medium transition-all duration-200',
  buttonOutline: 'border border-[#823F91] text-[#823F91] hover:bg-[#823F91]/5 rounded-lg px-6 py-2.5 font-medium transition-all duration-200',
  
  // Cards
  card: 'bg-white border border-[#E5E7EB] rounded-lg shadow-sm hover:shadow-md transition-all duration-200',
  
  // Inputs
  input: 'border border-[#E5E7EB] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#823F91] focus:border-[#823F91] transition-all',
  
  // Sections
  section: 'py-24 px-6 bg-white',
  sectionMuted: 'py-24 px-6 bg-[#F7F7F7]',
} as const

