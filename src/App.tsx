import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { Reveal } from './components/layout/Reveal'
import { ScrollMotion } from './components/layout/ScrollMotion'
import { SiteHeader } from './components/layout/SiteHeader'
import { useActiveSection, type SectionLink } from './components/layout/SectionNav'
import { ContactSection } from './components/sections/ContactSection'
import { PrintableResume } from './components/print/PrintableResume'
import { AdminPage } from './components/admin/AdminPage'
import { EducationSection } from './components/sections/EducationSection'
import { ExperienceSection } from './components/sections/ExperienceSection'
import { HeroSection } from './components/sections/HeroSection'
import { ImpactSection } from './components/sections/ImpactSection'
import { ProjectsSection } from './components/sections/ProjectsSection'
import { SkillsSection } from './components/sections/SkillsSection'
import { ChromaticFlowField } from './components/visual/ChromaticFlowField'
import { EditorialGrid } from './components/visual/EditorialGrid'
import { fallbackProjects, fallbackResume } from './data/profile'
import { createContentRepository } from './lib/contentRepository'
import type { ContentRepository, Project, ResumeContent } from './types/content'

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

type PublicResumeProps = {
  reducedMotion?: boolean
  repository?: ContentRepository
}

type SectionRenderer = (resume: ResumeContent, projects: Project[]) => ReactNode

const sectionContent: Record<SectionLink['id'], SectionRenderer> = {
  hero: (resume: ResumeContent) => <HeroSection profile={resume.profile} />,
  impact: (resume: ResumeContent) => <ImpactSection metrics={resume.impact} />,
  experience: (resume: ResumeContent) => <ExperienceSection experience={resume.experience} sop={resume.sop} />,
  projects: (resume: ResumeContent, projects: Project[]) => <ProjectsSection portfolio={resume.projects} projects={projects} />,
  skills: (resume: ResumeContent) => <SkillsSection groups={resume.skills} />,
  education: (resume: ResumeContent) => <EducationSection awards={resume.awards} education={resume.education} />,
  contact: (resume: ResumeContent) => <ContactSection profile={resume.profile} />,
}

const defaultRepository = createContentRepository()

export function PublicResume({ reducedMotion: reducedMotionOverride, repository = defaultRepository }: PublicResumeProps) {
  const preferredReducedMotion = useReducedMotion()
  const reducedMotion = reducedMotionOverride ?? preferredReducedMotion
  const activeSection = useActiveSection(publicSectionIds)
  const contentRef = useRef<HTMLElement>(null)
  const [resume, setResume] = useState(fallbackResume)
  const [projects, setProjects] = useState(fallbackProjects)
  const [scrollProgress, setScrollProgress] = useState(0)
  const activeSectionIndex = Math.max(0, publicSectionIds.indexOf(activeSection))
  const activeSectionNumber = activeSectionIndex + 1
  const activeSectionLabel = publicSections[activeSectionIndex]?.label ?? publicSections[0].label
  const progressStyle = { '--section-progress': scrollProgress } as CSSProperties

  useEffect(() => {
    let frame = 0
    const updateProgress = () => {
      frame = 0
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const ratio = Math.min(1, Math.max(0, window.scrollY / totalHeight))
        setScrollProgress(ratio)
      } else {
        setScrollProgress(0)
      }
    }

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateProgress)
      }
    }

    updateProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    const root = document.documentElement
    let frame = 0
    let pointerX = window.innerWidth * 0.5
    let pointerY = window.innerHeight * 0.35

    const paintPointer = () => {
      frame = 0
      root.style.setProperty('--pointer-x', `${pointerX}px`)
      root.style.setProperty('--pointer-y', `${pointerY}px`)
    }

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX
      pointerY = event.clientY
      if (!frame) frame = window.requestAnimationFrame(paintPointer)
    }

    root.style.setProperty('--pointer-x', `${pointerX}px`)
    root.style.setProperty('--pointer-y', `${pointerY}px`)
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      if (frame) window.cancelAnimationFrame(frame)
      root.style.removeProperty('--pointer-x')
      root.style.removeProperty('--pointer-y')
    }
  }, [reducedMotion])

  useEffect(() => {
    let active = true
    void Promise.allSettled([repository.getResume(), repository.getProjects()]).then(([resumeResult, projectsResult]) => {
      if (!active) return
      if (resumeResult.status === 'fulfilled') setResume(resumeResult.value)
      if (projectsResult.status === 'fulfilled') setProjects(projectsResult.value)
    })
    return () => { active = false }
  }, [repository])

  return (
    <>
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
              {section.id === 'hero' ? sectionContent.hero(resume, projects) : <><h2 id={`${section.id}-heading`}>{section.label}</h2><p className="resume-section__index">{String(index + 1).padStart(2, '0')}</p>{sectionContent[section.id](resume, projects)}</>}
            </Reveal>
          </section>
        ))}
      </main>
        <ScrollMotion containerRef={contentRef} reducedMotion={reducedMotion} />
      </div>
      <PrintableResume projects={projects} resume={resume} />
    </>
  )
}

export function App() {
  return window.location.pathname.startsWith('/admin') ? <AdminPage /> : <PublicResume />
}
