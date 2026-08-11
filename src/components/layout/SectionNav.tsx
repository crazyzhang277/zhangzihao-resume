import { useEffect, useState } from 'react'

export type SectionLink = {
  id: string
  label: string
}

type SectionNavProps = {
  sections: SectionLink[]
  activeSection: string
  onNavigate?: () => void
}

export function useActiveSection(sectionIds: string[]): string {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? '')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (visible) setActiveSection(visible.target.id)
    }, { rootMargin: '-24% 0px -58%', threshold: [0.05, 0.35, 0.7] })

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null)

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [sectionIds])

  return activeSection
}

export function SectionNav({ sections, activeSection, onNavigate }: SectionNavProps) {
  return (
    <nav aria-label="Resume sections" className="section-nav" id="section-navigation">
      <ol>
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              aria-current={activeSection === section.id ? 'location' : undefined}
              href={`#${section.id}`}
              onClick={onNavigate}
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              {section.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
