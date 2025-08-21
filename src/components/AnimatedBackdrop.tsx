"use client"
import { useEffect, useRef } from 'react'

// Mature, minimal background: slow-moving blurred grayscale blobs
export default function AnimatedBackdrop() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    function resize() {
      canvas.width = Math.floor(canvas.clientWidth * dpr)
      canvas.height = Math.floor(canvas.clientHeight * dpr)
    }
    const onResize = () => { resize() }
    resize()
    window.addEventListener('resize', onResize)

    type Blob = { x: number; y: number; r: number; phase: number; speed: number; alpha: number }
    const blobs: Blob[] = []
    const count = 4
    for (let i = 0; i < count; i++) {
      blobs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 220 + 180,
        phase: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.1,
        alpha: 0.06 + Math.random() * 0.04,
      })
    }

    function tick() {
      const { width: w, height: h } = canvas
      ctx.clearRect(0, 0, w, h)

      // white background base already rendered by layout; add soft grayscale blobs
      for (const b of blobs) {
        b.phase += b.speed * 0.002
        const rx = Math.cos(b.phase) * 40 * dpr
        const ry = Math.sin(b.phase * 0.9) * 35 * dpr

        const gradient = ctx.createRadialGradient(b.x + rx, b.y + ry, b.r * 0.2, b.x + rx, b.y + ry, b.r)
        gradient.addColorStop(0, `rgba(0,0,0,${b.alpha})`)
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(b.x + rx, b.y + ry, b.r, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-70">
      <canvas ref={ref} className="h-full w-full" />
    </div>
  )
}


