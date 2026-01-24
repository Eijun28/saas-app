import confetti from 'canvas-confetti'

export const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#823F91', '#9D5FA8', '#6D3478']
  })
}
