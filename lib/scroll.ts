import Lenis from 'lenis'

const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  (navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches)

export const initSmoothScroll = () => {
  if (typeof window === 'undefined') return null

  // Scroll natif plus fluide sur mobile/tablette — Lenis crée du lag sur touch
  if (isTouchDevice()) return null

  // Respecter la préférence système "réduire les animations"
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
    infinite: false,
  })

  let rafId: number

  function raf(time: number) {
    lenis.raf(time)
    rafId = requestAnimationFrame(raf)
  }

  rafId = requestAnimationFrame(raf)

  // Exposer le cancel pour le cleanup
  ;(lenis as Lenis & { _rafId?: number })._rafId = rafId

  return lenis
}

export const destroySmoothScroll = (lenis: Lenis | null) => {
  if (!lenis) return
  const id = (lenis as Lenis & { _rafId?: number })._rafId
  if (id) cancelAnimationFrame(id)
  lenis.destroy()
}
