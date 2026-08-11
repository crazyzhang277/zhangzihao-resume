import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, type RefObject } from 'react'

type ScrollMotionProps = {
  containerRef: RefObject<HTMLElement | null>
  reducedMotion: boolean
}

export function ScrollMotion({ containerRef, reducedMotion }: ScrollMotionProps) {
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || reducedMotion || typeof window.matchMedia !== 'function') return

    const desktop = window.matchMedia('(min-width: 768px)')
    if (!desktop.matches) return

    gsap.registerPlugin(ScrollTrigger)
    const context = gsap.context(() => {
      const progress = document.querySelector<HTMLElement>('.reading-progress')
      const hero = container.querySelector<HTMLElement>('.resume-section--hero')
      const projects = container.querySelector<HTMLElement>('.resume-section--projects')

      if (progress) {
        gsap.to(progress, {
          ease: 'none',
          scaleX: 1,
          scrollTrigger: { end: 'max', scrub: 0.2, start: 'top top' },
        })
      }

      if (hero) {
        gsap.to(hero, {
          ease: 'none',
          yPercent: -4,
          scrollTrigger: { end: 'bottom top', scrub: 0.35, start: 'top top' },
        })
      }

      if (projects) {
        gsap.to(projects, {
          ease: 'none',
          yPercent: -2,
          scrollTrigger: { end: 'bottom top', scrub: 0.3, start: 'top bottom' },
        })
      }
    }, container)

    return () => context.revert()
  }, [containerRef, reducedMotion])

  return null
}
