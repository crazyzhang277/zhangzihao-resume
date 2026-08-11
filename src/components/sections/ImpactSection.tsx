import type { ImpactMetric } from '../../types/content'

export function ImpactSection({ metrics }: { metrics: ImpactMetric[] }) {
  return (
    <div className="impact-grid">
      {metrics.map((metric) => (
        <article className="impact-card" key={`${metric.number}-${metric.title}`}>
          <p className="impact-card__metric"><strong>{metric.number}</strong> <span>{metric.unit}</span></p>
          <h3>{metric.title}</h3>
          <p className="impact-card__subtitle">{metric.subtitle}</p>
          <p>{metric.description}</p>
        </article>
      ))}
    </div>
  )
}
