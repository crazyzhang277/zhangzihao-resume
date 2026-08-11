import type { Project } from '../../types/content'

export function ProjectDetails({ project }: { project: Project }) {
  const description = project.manualDescription ?? project.description
  return (
    <div className="project-details" id={`project-${project.githubId}-details`}>
      {description ? <p>{description}</p> : null}
      <dl>
        <div><dt>Language</dt><dd>{project.language ?? 'Not specified'}</dd></div>
        <div><dt>Updated</dt><dd>{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(project.updatedAt))}</dd></div>
      </dl>
    </div>
  )
}
