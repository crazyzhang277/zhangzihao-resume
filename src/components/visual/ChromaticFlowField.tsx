import { useEffect, useRef } from 'react'

type ChromaticFlowFieldProps = {
  reducedMotion: boolean
}

const colors = ['#df493e', '#f2ca4f', '#3c9a70', '#3c73c2']
const frameIntervalMs = 1000 / 30

function colorWithAlpha(hex: string, alpha: number) {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
}

export function ChromaticFlowField({ reducedMotion }: ChromaticFlowFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reducedMotion || typeof window.matchMedia !== 'function') {
      if (canvas) canvas.dataset.motionState = reducedMotion ? 'reduced' : 'fallback'
      return
    }

    const compactViewport = window.matchMedia('(max-width: 767px)')
    const context = canvas.getContext('2d')
    if (!context) return

    let animationFrame = 0
    let visible = !document.hidden
    let width = 0
    let height = 0
    let lastFrame = 0

    const stop = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      animationFrame = 0
    }

    const schedule = () => {
      if (!visible || animationFrame) return
      canvas.dataset.motionState = 'running'
      animationFrame = window.requestAnimationFrame(draw)
    }

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, compactViewport.matches ? 1.25 : 1.75)
      width = Math.max(1, window.innerWidth)
      height = Math.max(1, window.innerHeight)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const draw = (time: number) => {
      animationFrame = 0
      if (!visible) {
        return
      }

      if (time - lastFrame < frameIntervalMs) {
        schedule()
        return
      }
      lastFrame = time

      context.clearRect(0, 0, width, height)
      const compact = compactViewport.matches
      const radius = Math.max(width, height) * (compact ? 0.7 : 0.58)
      const centers = [
        [width * (0.08 + Math.sin(time * 0.00016) * 0.08), height * (0.16 + Math.cos(time * 0.00011) * 0.08)],
        [width * (0.82 + Math.cos(time * 0.00013) * 0.08), height * (0.2 + Math.sin(time * 0.00009) * 0.1)],
        [width * (0.18 + Math.cos(time * 0.0001) * 0.08), height * (0.82 + Math.sin(time * 0.00012) * 0.08)],
        [width * (0.8 + Math.sin(time * 0.00014) * 0.08), height * (0.78 + Math.cos(time * 0.0001) * 0.1)],
      ]

      centers.forEach(([x, y], index) => {
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
        if (gradient) {
          gradient.addColorStop(0, colorWithAlpha(colors[index], compact ? 0.16 : 0.22))
          gradient.addColorStop(0.58, colorWithAlpha(colors[index], compact ? 0.08 : 0.12))
          gradient.addColorStop(1, 'transparent')
          context.fillStyle = gradient
          context.fillRect(0, 0, width, height)
        }
      })

      centers.slice(0, compact ? 3 : centers.length).forEach(([x, y], index) => {
        const drift = Math.sin(time * (0.00022 + index * 0.000018) + index) * height * 0.07
        context.beginPath()
        context.moveTo(-width * 0.1, y + drift)
        context.bezierCurveTo(
          width * 0.22,
          y - height * (0.14 + index * 0.025) + drift,
          width * 0.68,
          y + height * (0.14 - index * 0.02) - drift,
          width * 1.08,
          y - drift,
        )
        context.strokeStyle = colorWithAlpha(colors[index], compact ? 0.2 : 0.27)
        context.lineWidth = Math.max(compact ? 8 : 12, width * (compact ? 0.015 : 0.012))
        context.lineCap = 'round'
        context.stroke()

        context.beginPath()
        context.moveTo(-width * 0.1, y + drift - 2)
        context.bezierCurveTo(
          width * 0.22,
          y - height * (0.14 + index * 0.025) + drift - 2,
          width * 0.68,
          y + height * (0.14 - index * 0.02) - drift - 2,
          width * 1.08,
          y - drift - 2,
        )
        context.strokeStyle = colorWithAlpha(colors[index], compact ? 0.42 : 0.5)
        context.lineWidth = compact ? 1.5 : 2
        context.stroke()
      })

      schedule()
    }

    const onVisibilityChange = () => {
      visible = !document.hidden
      if (visible) schedule()
      else {
        canvas.dataset.motionState = 'paused'
        stop()
      }
    }

    const onViewportChange = () => {
      resize()
      schedule()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('resize', resize, { passive: true })
    compactViewport.addEventListener('change', onViewportChange)
    resize()
    schedule()

    return () => {
      canvas.dataset.motionState = 'stopped'
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('resize', resize)
      compactViewport.removeEventListener('change', onViewportChange)
    }
  }, [reducedMotion])

  return (
    <div className="chromatic-flow" aria-hidden="true">
      <canvas aria-hidden="true" className="chromatic-flow__canvas" data-motion-state={reducedMotion ? 'reduced' : 'idle'} data-testid="chromatic-flow-field" ref={canvasRef} />
      <div className="chromatic-flow__fallback" />
    </div>
  )
}
