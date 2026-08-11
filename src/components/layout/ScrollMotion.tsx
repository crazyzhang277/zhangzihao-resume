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

    gsap.registerPlugin(ScrollTrigger)
    const media = gsap.matchMedia()
    media.add('(min-width: 768px)', () => {
      const context = gsap.context(() => {
        const hero = container.querySelector<HTMLElement>('.resume-section--hero')
        const projects = container.querySelector<HTMLElement>('.resume-section--projects')

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
    })

    return () => media.revert()
  }, [containerRef, reducedMotion])

  return null
}
