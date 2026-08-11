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

        Array.from(container.querySelectorAll<HTMLElement>('.resume-section')).forEach((section, index) => {
          const reveal = section.querySelector<HTMLElement>('.reveal')
          if (!reveal) return
          gsap.to(reveal, {
            ease: 'none',
            rotate: index % 2 === 0 ? -0.18 : 0.18,
            yPercent: index % 2 === 0 ? -1.5 : 1.5,
            scrollTrigger: { end: 'bottom 18%', scrub: 0.65, start: 'top 88%', trigger: section },
          })
        })
      }, container)

      return () => context.revert()
    })

    return () => media.revert()
  }, [containerRef, reducedMotion])

  return null
}
