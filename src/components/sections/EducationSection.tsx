import { Award, GraduationCap } from 'lucide-react'

import type { Award as AwardItem, Education } from '../../types/content'

export function EducationSection({ education, awards }: { education: Education[]; awards: AwardItem[] }) {
  return (
    <div className="education-layout">
      <div>
        <p className="section-lead"><GraduationCap aria-hidden="true" size={21} /> Education</p>
        {education.map((item) => (
          <article className="education-item" key={`${item.school}-${item.period}`}>
            <h3>{item.school}</h3>
            <p>{item.major} · {item.period}</p>
            <ul className="tag-list">{item.courses.map((course) => <li key={course}>{course}</li>)}</ul>
          </article>
        ))}
      </div>
      <div>
        <p className="section-lead"><Award aria-hidden="true" size={21} /> Awards</p>
        {awards.map((award) => (
          <article className="education-item" key={`${award.title}-${award.date}`}>
            <h3>{award.title}</h3>
            <p>{award.level} · {award.field} · {award.date}</p>
            <p>{award.description}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
