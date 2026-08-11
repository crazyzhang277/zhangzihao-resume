import { excludedRepositorySlug } from '../../data/github'
import type { Project, ResumeContent } from '../../types/content'

type PrintableResumeProps = {
  resume: ResumeContent
  projects: Project[]
}

const printableProjectProofLimit = 4

export function PrintableResume({ projects, resume }: PrintableResumeProps) {
  const visibleProjects = projects.filter((project) => project.visible && project.name.toLowerCase() !== excludedRepositorySlug)
  const proofProjects = visibleProjects.slice(0, printableProjectProofLimit)

  return (
    <section aria-label="Printable A4 resume" className="printable-resume" data-page-count={resume.print.pageCount} data-page-size={resume.print.pageSize} data-testid="printable-resume" style={{ height: '297mm', width: '210mm' }}>
      <header className="printable-resume__header">
        <div>
          <h1>{resume.profile.name} <span>{resume.profile.englishName}</span></h1>
          <p className="printable-resume__role">{resume.profile.targetRoles.join(' | ')}</p>
        </div>
        <address>
          <a href={`mailto:${resume.profile.email}`}>{resume.profile.email}</a>
          <a href={`tel:${resume.profile.phone}`}>{resume.profile.phone}</a>
          <a href={resume.profile.github}>{resume.profile.github.replace('https://', '')}</a>
          <span>{resume.profile.location} | {resume.profile.status}</span>
        </address>
      </header>

      <p className="printable-resume__bio">{resume.profile.bio}</p>

      <section className="printable-resume__section printable-resume__section--impact" aria-labelledby="print-impact-heading">
        <h2 id="print-impact-heading">Impact</h2>
        <div className="printable-resume__metrics">
          {resume.impact.map((metric) => <article key={`${metric.number}-${metric.title}`}><strong>{metric.number}</strong><span>{metric.unit}</span><b>{metric.title}</b><small>{metric.subtitle}</small></article>)}
        </div>
      </section>

      <section className="printable-resume__section printable-resume__experience" aria-labelledby="print-experience-heading">
        <h2 id="print-experience-heading">Experience</h2>
        {resume.experience.map((entry) => (
          <article key={`${entry.company}-${entry.period}`}>
            <div className="printable-resume__entry-heading"><div><h3>{entry.company}</h3><p>{entry.department} | {entry.role}</p></div><p>{entry.period}<br />{entry.status}</p></div>
            <ul>{entry.duties.map((duty) => <li key={duty.title}>{duty.title}</li>)}</ul>
          </article>
        ))}
        <div className="printable-resume__sop"><h3>Production SOP</h3><ol>{resume.sop.map((step) => <li key={step.title}>{step.title}</li>)}</ol></div>
      </section>

      <section className="printable-resume__section printable-resume__details" aria-labelledby="print-details-heading">
        <h2 id="print-details-heading">Skills, education and awards</h2>
        <div>
          <p className="printable-resume__skills">{resume.skills.map((group) => `${group.name}: ${group.skills.map((skill) => skill.name).join(' / ')}`).join(' | ')}</p>
          {resume.education.map((item) => <p key={`${item.school}-${item.period}`}><b>{item.school}</b> | {item.major} | {item.period}</p>)}
          {resume.awards.map((award) => <p key={`${award.title}-${award.date}`}><b>{award.title}</b> | {award.level} | {award.field} | {award.date}</p>)}
        </div>
      </section>

      <section className="printable-resume__section printable-resume__github" aria-labelledby="print-github-heading">
        <h2 id="print-github-heading">GitHub proof (top {printableProjectProofLimit})</h2>
        <ul>
          {proofProjects.map((project) => <li key={project.githubId}><a href={project.htmlUrl}>{project.manualTitle ?? project.name}</a><span>{project.language ?? 'Repository'} | {project.stars} stars | {project.forks} forks</span></li>)}
        </ul>
      </section>
    </section>
  )
}
