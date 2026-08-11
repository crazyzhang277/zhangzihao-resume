import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PrintableResume } from '../src/components/print/PrintableResume'
import { fallbackProjects, fallbackResume } from '../src/data/profile'

describe('PrintableResume', () => {
  it('renders a one-page A4 resume with the priority facts and compact GitHub proof', () => {
    render(<PrintableResume projects={fallbackProjects} resume={fallbackResume} />)

    const document = screen.getByTestId('printable-resume')
    expect(document).toHaveAttribute('data-page-count', '1')
    expect(document).toHaveAttribute('data-page-size', 'A4 portrait')
    expect(document).toHaveStyle({ height: '297mm', width: '210mm' })
    expect(within(document).getByText(`${fallbackResume.experience[0].department} | ${fallbackResume.experience[0].role}`)).toBeVisible()
    expect(within(document).getByText(fallbackResume.experience[0].company)).toBeVisible()
    expect(within(document).getByText(fallbackResume.profile.email)).toBeVisible()
    expect(within(document).getByText(fallbackResume.profile.phone)).toBeVisible()

    for (const metric of fallbackResume.impact) {
      expect(within(document).getByText(metric.number, { exact: false })).toBeVisible()
      expect(within(document).getByText(metric.title)).toBeVisible()
    }
    for (const step of fallbackResume.sop) expect(within(document).getByText(step.title)).toBeVisible()
    for (const project of fallbackProjects.filter((item) => item.visible)) {
      expect(within(document).getByRole('link', { name: project.manualTitle ?? project.name })).toHaveAttribute('href', project.htmlUrl)
    }

    expect(within(document).queryByText('zeroaigen-auto-mention')).not.toBeInTheDocument()
  })
})
