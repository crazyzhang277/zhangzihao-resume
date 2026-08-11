import type { Experience, SopStep } from '../../types/content'

export function ExperienceSection({ experience, sop }: { experience: Experience[]; sop: SopStep[] }) {
  return (
    <div className="experience-layout">
      <div className="experience-list">
        {experience.map((entry) => (
          <article className="experience-entry" key={`${entry.company}-${entry.period}`}>
            <p className="eyebrow">{entry.period} · {entry.status}</p>
            <h3>{entry.company}</h3>
            <p className="experience-entry__role">{entry.department} · {entry.role}</p>
            <ol className="duty-list">
              {entry.duties.map((duty) => <li key={duty.title}><strong>{duty.title}</strong><p>{duty.description}</p></li>)}
            </ol>
          </article>
        ))}
      </div>
      <aside aria-labelledby="sop-heading" className="sop-panel">
        <p className="eyebrow" id="sop-heading">Production SOP</p>
        <ol className="sop-list">
          {sop.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}
        </ol>
      </aside>
    </div>
  )
}
