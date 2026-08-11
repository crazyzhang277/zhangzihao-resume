import { ChevronDown, ExternalLink, GitFork, Star } from 'lucide-react'
import { useRef, type PointerEvent } from 'react'

import type { Project } from '../../types/content'
import { ProjectDetails } from './ProjectDetails'

export type ProjectCardProps = {
  project: Project
  expanded: boolean
  onToggle: () => void
}

export function ProjectCard({ project, expanded, onToggle }: ProjectCardProps) {
  const cardRef = useRef<HTMLElement>(null)
  const title = project.manualTitle ?? project.name
  const updatedDate = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(project.updatedAt))

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const card = cardRef.current
    if (!card || event.pointerType === 'touch') return
    const bounds = card.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    card.style.setProperty('--card-rotate-x', `${y * -2.8}deg`)
    card.style.setProperty('--card-rotate-y', `${x * 2.8}deg`)
    card.style.setProperty('--card-glow-x', `${(x + 0.5) * 100}%`)
    card.style.setProperty('--card-glow-y', `${(y + 0.5) * 100}%`)
  }

  function resetPointer() {
    const card = cardRef.current
    card?.style.removeProperty('--card-rotate-x')
    card?.style.removeProperty('--card-rotate-y')
  }

  return (
    <article className="project-card" onPointerLeave={resetPointer} onPointerMove={handlePointerMove} ref={cardRef}>
      <div className="project-card__topline"><span>{project.language ?? 'Repository'}</span><time dateTime={project.updatedAt}>Updated {updatedDate}</time></div>
      <h3>{title}</h3>
      {project.topics.length > 0 ? <ul aria-label={`${title} topics`} className="tag-list">{project.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul> : null}
      <dl className="project-card__metadata">
        <div><dt><Star aria-hidden="true" size={15} /> Stars</dt><dd>{project.stars}</dd></div>
        <div><dt><GitFork aria-hidden="true" size={15} /> Forks</dt><dd>{project.forks}</dd></div>
      </dl>
      <div className="action-row">
        <a className="icon-text-button" href={project.htmlUrl} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" size={16} /> GitHub</a>
        <button aria-controls={`project-${project.githubId}-details`} aria-expanded={expanded} className="icon-text-button" onClick={onToggle} type="button">
          <ChevronDown aria-hidden="true" size={16} /> {expanded ? 'Hide details' : 'View details'}
        </button>
      </div>
      {expanded ? <ProjectDetails project={project} /> : null}
    </article>
  )
}
