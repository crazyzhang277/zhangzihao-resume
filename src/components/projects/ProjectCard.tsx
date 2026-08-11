import { ChevronDown, ExternalLink, GitFork, Star } from 'lucide-react'

import type { Project } from '../../types/content'
import { ProjectDetails } from './ProjectDetails'

export type ProjectCardProps = {
  project: Project
  expanded: boolean
  onToggle: () => void
}

export function ProjectCard({ project, expanded, onToggle }: ProjectCardProps) {
  const title = project.manualTitle ?? project.name
  const updatedDate = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(project.updatedAt))

  return (
    <article className="project-card">
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
