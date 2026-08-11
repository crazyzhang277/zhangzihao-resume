import { useEffect, useRef } from 'react'

type ChromaticFlowFieldProps = {
  reducedMotion: boolean
}

const colors = ['#df493e', '#f2ca4f', '#3c9a70', '#3c73c2']
const frameIntervalMs = 50

export function ChromaticFlowField({ reducedMotion }: ChromaticFlowFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reducedMotion || typeof window.matchMedia !== 'function') return

    const compactViewport = window.matchMedia('(max-width: 767px)')
    if (compactViewport.matches) return

    const context = canvas.getContext('2d')
    if (!context) return

    let animationFrame = 0
    let drawTimer: number | undefined
    let visible = !document.hidden
    let width = 0
    let height = 0

    const stop = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = 0
      if (drawTimer !== undefined) window.clearTimeout(drawTimer)
      drawTimer = undefined
    }

    const schedule = () => {
      if (!visible || compactViewport.matches || animationFrame || drawTimer !== undefined) return
      drawTimer = window.setTimeout(() => {
        drawTimer = undefined
        animationFrame = window.requestAnimationFrame(draw)
      }, frameIntervalMs)
    }

    const resize = () => {
      if (compactViewport.matches) return
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const draw = (time: number) => {
      animationFrame = 0
      if (!visible) {
        return
      }

      context.clearRect(0, 0, width, height)
      const radius = Math.max(width, height) * 0.52
      const centers = [
        [width * (0.1 + Math.sin(time * 0.00008) * 0.05), height * 0.16],
        [width * 0.79, height * (0.11 + Math.cos(time * 0.00007) * 0.04)],
        [width * (0.24 + Math.cos(time * 0.00006) * 0.04), height * 0.8],
        [width * 0.82, height * (0.78 + Math.sin(time * 0.00009) * 0.04)],
      ]

      centers.forEach(([x, y], index) => {
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
        gradient.addColorStop(0, `${colors[index]}1f`)
        gradient.addColorStop(0.64, `${colors[index]}08`)
        gradient.addColorStop(1, 'transparent')
        context.fillStyle = gradient
        context.fillRect(0, 0, width, height)
      })

      schedule()
    }

    const onVisibilityChange = () => {
      visible = !document.hidden
      if (visible) schedule()
      else stop()
    }

    const onViewportChange = () => {
      if (compactViewport.matches) {
        stop()
        return
      }
      resize()
      schedule()
    }

    resize()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('resize', resize, { passive: true })
    compactViewport.addEventListener('change', onViewportChange)
    schedule()

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('resize', resize)
      compactViewport.removeEventListener('change', onViewportChange)
    }
  }, [reducedMotion])

  return (
    <div className="chromatic-flow" aria-hidden="true">
      <canvas aria-hidden="true" className="chromatic-flow__canvas" data-testid="chromatic-flow-field" ref={canvasRef} />
      <div className="chromatic-flow__fallback" />
    </div>
  )
}
