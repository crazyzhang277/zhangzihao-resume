import { useEffect, useState } from 'react'

import type { Project } from '../../types/content'

type AdminProjectsProps = {
  projects: Project[]
  onSaveVisibility(githubId: number, visible: boolean, featuredRank: number | null): Promise<void>
  onSaveOverrides(githubId: number, manualTitle: string | null, manualDescription: string | null): Promise<void>
}

export function AdminProjects({ projects, onSaveVisibility, onSaveOverrides }: AdminProjectsProps) {
  return (
    <section className="admin-projects" aria-labelledby="admin-projects-heading">
      <header><h2 id="admin-projects-heading">GitHub projects</h2><p>Control public visibility, feature ordering, and display overrides without changing synced repository data.</p></header>
      <aside className="admin-exclusion" aria-label="Permanent project exclusion">zeroaigen-auto-mention is permanently excluded from sync and cannot be changed here.</aside>
      <div className="admin-project-list">
        {projects.map((project) => <ProjectControls key={project.githubId} onSaveOverrides={onSaveOverrides} onSaveVisibility={onSaveVisibility} project={project} />)}
      </div>
    </section>
  )
}

type ProjectControlsProps = Omit<AdminProjectsProps, 'projects'> & { project: Project }

function ProjectControls({ project, onSaveVisibility, onSaveOverrides }: ProjectControlsProps) {
  const [visible, setVisible] = useState(project.visible)
  const [featuredRank, setFeaturedRank] = useState(project.featuredRank?.toString() ?? '')
  const [manualTitle, setManualTitle] = useState(project.manualTitle ?? '')
  const [manualDescription, setManualDescription] = useState(project.manualDescription ?? '')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setVisible(project.visible)
    setFeaturedRank(project.featuredRank?.toString() ?? '')
    setManualTitle(project.manualTitle ?? '')
    setManualDescription(project.manualDescription ?? '')
  }, [project])

  async function save() {
    const parsedRank = featuredRank.trim() === '' ? null : Number(featuredRank)
    if (parsedRank !== null && (!Number.isInteger(parsedRank) || parsedRank < 0)) {
      setError('Featured rank must be a non-negative whole number.')
      return
    }
    setIsSaving(true)
    setStatus(null)
    setError(null)
    try {
      await onSaveVisibility(project.githubId, visible, parsedRank)
      await onSaveOverrides(project.githubId, manualTitle.trim() || null, manualDescription.trim() || null)
      setStatus('Project settings saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save project settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <fieldset className="admin-project" aria-label={project.name}>
      <legend>{project.name}</legend>
      <p>{project.htmlUrl}</p>
      <div className="admin-project__controls">
        <label><input checked={visible} onChange={(event) => setVisible(event.target.checked)} type="checkbox" />Visible {project.name}</label>
        <label>Featured rank {project.name}<input min="0" onChange={(event) => setFeaturedRank(event.target.value)} type="number" value={featuredRank} /></label>
        <label>Manual title {project.name}<input onChange={(event) => setManualTitle(event.target.value)} value={manualTitle} /></label>
        <label>Manual description {project.name}<textarea onChange={(event) => setManualDescription(event.target.value)} rows={3} value={manualDescription} /></label>
      </div>
      {error ? <p className="admin-feedback admin-feedback--error" role="alert">{error}</p> : null}
      {status ? <p className="admin-feedback" role="status">{status}</p> : null}
      <button className="admin-button" disabled={isSaving} onClick={() => void save()} type="button">{isSaving ? 'Saving project...' : `Save ${project.name}`}</button>
    </fieldset>
  )
}
