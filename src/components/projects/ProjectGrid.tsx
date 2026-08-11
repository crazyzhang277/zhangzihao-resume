import { useState } from 'react'

import { isPublicProject } from '../../data/github'
import type { Project } from '../../types/content'
import { ProjectCard } from './ProjectCard'

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null)
  const visibleProjects = projects.filter(isPublicProject)

  return (
    <div className="project-grid">
      {visibleProjects.map((project) => (
        <ProjectCard expanded={expandedProjectId === project.githubId} key={project.githubId} onToggle={() => setExpandedProjectId((id) => id === project.githubId ? null : project.githubId)} project={project} />
      ))}
    </div>
  )
}
