import { ExternalLink, Github, KeyRound } from 'lucide-react'

import type { PortfolioProject, Project } from '../../types/content'
import { ProjectGrid } from '../projects/ProjectGrid'

export function ProjectsSection({ projects, portfolio }: { projects: Project[]; portfolio: PortfolioProject[] }) {
  return (
    <div className="projects-section">
      <div className="section-lead"><p>Live GitHub work</p><Github aria-hidden="true" size={22} /></div>
      <ProjectGrid projects={projects} />
      <div className="section-lead"><p>Production proof</p></div>
      <div className="portfolio-grid">
        {portfolio.map((project) => (
          <article className="portfolio-proof" key={project.id}>
            <p className="eyebrow">{project.category}</p>
            <h3>{project.title}</h3>
            <p><strong>{project.role}</strong> · {project.metrics}</p>
            <p>{project.description}</p>
            <ul className="tag-list">{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
            <ul className="highlight-list">{project.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
            <div className="action-row">
              {project.githubUrl ? <a className="icon-text-button" href={project.githubUrl} rel="noreferrer" target="_blank"><Github aria-hidden="true" size={16} /> GitHub</a> : null}
              {project.portfolioUrl ? <a className="icon-text-button" href={project.portfolioUrl} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" size={16} /> Portfolio</a> : null}
              {project.portfolioPass ? <span className="access-code"><KeyRound aria-hidden="true" size={15} /> Access code: {project.portfolioPass}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
