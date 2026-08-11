import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { Reveal } from './components/layout/Reveal'
import { ScrollMotion } from './components/layout/ScrollMotion'
import { SiteHeader } from './components/layout/SiteHeader'
import { useActiveSection, type SectionLink } from './components/layout/SectionNav'
import { ChromaticFlowField } from './components/visual/ChromaticFlowField'
import { EditorialGrid } from './components/visual/EditorialGrid'

const publicSections: SectionLink[] = [
  { id: 'hero', label: 'Profile' },
  { id: 'impact', label: 'Impact' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education and awards' },
  { id: 'contact', label: 'Contact' },
]
const publicSectionIds = publicSections.map((section) => section.id)

function getReducedMotionPreference() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(getReducedMotionPreference)

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reducedMotion
}

export function PublicResume({ reducedMotion: reducedMotionOverride }: { reducedMotion?: boolean }) {
  const preferredReducedMotion = useReducedMotion()
  const reducedMotion = reducedMotionOverride ?? preferredReducedMotion
  const activeSection = useActiveSection(publicSectionIds)
  const contentRef = useRef<HTMLElement>(null)
  const activeSectionIndex = Math.max(0, publicSectionIds.indexOf(activeSection))
  const activeSectionNumber = activeSectionIndex + 1
  const activeSectionLabel = publicSections[activeSectionIndex]?.label ?? publicSections[0].label
  const progressStyle = { '--section-progress': activeSectionNumber / publicSections.length } as CSSProperties

  return (
    <div className={reducedMotion ? 'resume-shell is-reduced-motion' : 'resume-shell'}>
      <ChromaticFlowField reducedMotion={reducedMotion} />
      <EditorialGrid />
      <SiteHeader activeSection={activeSection} sections={publicSections} />
      <div
        aria-label={`Section progress: ${activeSectionLabel}`}
        aria-valuemax={publicSections.length}
        aria-valuemin={1}
        aria-valuenow={activeSectionNumber}
        aria-valuetext={`Section ${activeSectionNumber} of ${publicSections.length}: ${activeSectionLabel}`}
        className="reading-progress"
        role="progressbar"
        style={progressStyle}
      />
      <main aria-label="Public resume" className="resume-content" ref={contentRef}>
        {publicSections.map((section, index) => (
          <section aria-labelledby={`${section.id}-heading`} className={`resume-section resume-section--${section.id}`} id={section.id} key={section.id}>
            <Reveal delayMs={Math.min(index * 50, 180)}>
              {section.id === 'hero' ? <h1 id="hero-heading">Zhang Zihao AIGC Resume</h1> : <h2 id={`${section.id}-heading`}>{section.label}</h2>}
              <p className="resume-section__index">{String(index + 1).padStart(2, '0')}</p>
            </Reveal>
          </section>
        ))}
      </main>
      <ScrollMotion containerRef={contentRef} reducedMotion={reducedMotion} />
    </div>
  )
}

function AdminSurface() {
  return (
    <main aria-label="Resume administration">
      <h1>Resume administration</h1>
    </main>
  )
}

export function App() {
  return window.location.pathname.startsWith('/admin') ? <AdminSurface /> : <PublicResume />
}
