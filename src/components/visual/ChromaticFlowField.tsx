import { useEffect, useRef } from 'react'

type ChromaticFlowFieldProps = {
  reducedMotion: boolean
}

const colors = ['#df493e', '#f2ca4f', '#3c9a70', '#3c73c2']

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
    let visible = !document.hidden
    let width = 0
    let height = 0

    const stop = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = 0
    }

    const start = () => {
      if (visible && !animationFrame) animationFrame = window.requestAnimationFrame(draw)
    }

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const draw = (time: number) => {
      if (!visible) {
        animationFrame = 0
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

      animationFrame = window.requestAnimationFrame(draw)
    }

    const onVisibilityChange = () => {
      visible = !document.hidden
      if (visible) start()
      else stop()
    }

    const onViewportChange = () => {
      if (compactViewport.matches) {
        stop()
        return
      }
      resize()
      start()
    }

    resize()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('resize', resize, { passive: true })
    compactViewport.addEventListener('change', onViewportChange)
    start()

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
