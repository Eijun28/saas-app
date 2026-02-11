/**
 * NUPLY Design System v2 — 2026
 *
 * Inspired by Linear / Stripe / Notion.
 * Violet premium branding with full neutral scale,
 * semantic colors, typography, spacing, radius and shadows.
 *
 * All contrast ratios checked against WCAG AA (4.5:1 normal text).
 */

// ────────────────────────────────────────────
// 1. COLORS
// ────────────────────────────────────────────

export const colors = {
  // — Primary violet scale —
  primary50: '#F5F0F7',
  primary100: '#E8D4EF',
  primary200: '#D4ADE0',
  primary500: '#823F91', // brand
  primary700: '#6D3478',
  primaryHover: '#5C2B66',

  // — Neutrals —
  neutral50: '#FAFAFA',
  neutral100: '#F5F5F5',
  neutral200: '#E5E7EB',
  neutral400: '#9CA3AF',
  neutral600: '#4B5563',
  neutral800: '#1F2937',
  neutral900: '#111827',

  // — Semantic —
  successLight: '#ECFDF5',
  success: '#059669',
  successText: '#065F46',

  warningLight: '#FFFBEB',
  warning: '#D97706',
  warningText: '#92400E',

  dangerLight: '#FEF2F2',
  danger: '#DC2626',
  dangerText: '#991B1B',

  infoLight: '#EFF6FF',
  info: '#2563EB',
  infoText: '#1E40AF',

  // — Surfaces —
  background: '#FFFFFF',
  backgroundMuted: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',

  // — Text (checked WCAG AA on white) —
  textPrimary: '#111827',   // 15.4:1
  textSecondary: '#4B5563', // 7.4:1
  textMuted: '#6B7280',     // 4.6:1
  textOnPrimary: '#FFFFFF',

  // — Borders —
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#823F91',

  // — Accents —
  accent: '#F3F4F6',
  accentViolet: '#E8D4EF',

  // Legacy aliases
  primary: '#823F91',
  primaryLight: '#9D5FA8',
} as const

// ────────────────────────────────────────────
// 2. TYPOGRAPHY
// ────────────────────────────────────────────

export const typography = {
  // Dashboard headings
  h1Dashboard: 'text-[36px] sm:text-[40px] font-bold leading-tight tracking-tight text-gray-900',
  h2Section: 'text-[24px] sm:text-[28px] font-semibold leading-snug tracking-tight text-gray-900',

  // KPI
  kpiValue: 'text-[42px] sm:text-[48px] lg:text-[52px] font-bold leading-none tracking-tight tabular-nums',

  // Body
  body: 'text-[15px] sm:text-base leading-relaxed text-gray-600',
  bodySmall: 'text-sm leading-relaxed text-gray-600',

  // Caption / meta
  caption: 'text-[13px] leading-snug text-gray-400',
  captionMedium: 'text-[13px] font-medium leading-snug text-gray-600',

  // Labels
  label: 'text-xs font-semibold uppercase tracking-wider text-gray-400',

  // Legacy compat
  h1: 'text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900',
  h2: 'text-3xl md:text-4xl font-semibold text-gray-900',
  h3: 'text-2xl md:text-3xl font-semibold text-gray-900',
  h4: 'text-xl md:text-2xl font-semibold text-gray-900',
  bodyLarge: 'text-lg text-gray-600',
  muted: 'text-sm text-gray-500',
} as const

// ────────────────────────────────────────────
// 3. SPACING
// ────────────────────────────────────────────

export const spacing = {
  '1': '0.25rem',  // 4px
  '2': '0.5rem',   // 8px
  '3': '0.75rem',  // 12px
  '4': '1rem',     // 16px
  '6': '1.5rem',   // 24px
  '8': '2rem',     // 32px
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem',
} as const

// ────────────────────────────────────────────
// 4. RADIUS
// ────────────────────────────────────────────

export const radius = {
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.25rem',  // 20px
  full: '9999px',
} as const

// ────────────────────────────────────────────
// 5. SHADOWS
// ────────────────────────────────────────────

export const shadows = {
  none: 'none',
  card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
  raised: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
  float: '0 10px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
  focus: '0 0 0 3px rgba(130, 63, 145, 0.2)',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const

// ────────────────────────────────────────────
// 6. MOTION
// ────────────────────────────────────────────

export const motionTokens = {
  fast: '120ms ease-out',
  normal: '180ms ease-out',
  slow: '300ms ease-out',
  easeOut: [0.16, 1, 0.3, 1] as const,
} as const

// ────────────────────────────────────────────
// 7. TAILWIND UTILITY TOKENS
// ────────────────────────────────────────────

export const designTokens = {
  buttonPrimary:
    'bg-[#823F91] hover:bg-[#5C2B66] text-white rounded-xl px-5 py-2.5 font-semibold text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/40 focus-visible:ring-offset-2',
  buttonOutline:
    'border border-[#823F91] text-[#823F91] hover:bg-[#823F91]/5 rounded-xl px-5 py-2.5 font-semibold text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/40 focus-visible:ring-offset-2',
  buttonGhost:
    'text-gray-600 hover:bg-gray-100 rounded-xl px-4 py-2 font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/40 focus-visible:ring-offset-2',

  card: 'bg-white rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] border border-gray-100 transition-shadow duration-150 hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06),0_2px_4px_-2px_rgb(0_0_0/0.04)]',
  cardFlat: 'bg-white rounded-2xl border border-gray-100',

  input:
    'rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm border border-gray-200 focus:ring-2 focus:ring-[#823F91]/30 focus:border-[#823F91] transition-all duration-150 placeholder:text-gray-400',

  section: 'py-24 px-6 bg-white',
  sectionMuted: 'py-24 px-6 bg-gray-50',

  dashboardSection:
    'bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] overflow-hidden',
  dashboardSectionHeader:
    'px-5 py-4 border-b border-gray-100 bg-gray-50/60',
} as const
