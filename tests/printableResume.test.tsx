import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PrintableResume } from '../src/components/print/PrintableResume'
import { fallbackProjects, fallbackResume } from '../src/data/profile'

describe('PrintableResume', () => {
  it('renders a one-page A4 resume with the priority facts and bounded compact GitHub proof', () => {
    const excludedProject = {
      ...fallbackProjects[0],
      githubId: -1,
      name: 'zeroaigen-auto-mention',
      visible: true,
    }

    render(<PrintableResume projects={[...fallbackProjects, excludedProject]} resume={fallbackResume} />)

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
    const githubProof = within(document).getByRole('heading', { name: /GitHub proof/i }).closest('section')!
    const proofProjects = fallbackProjects.filter((item) => item.visible).slice(0, 4)
    expect(within(githubProof).getAllByRole('link')).toHaveLength(4)
    for (const project of proofProjects) {
      expect(within(githubProof).getByRole('link', { name: project.manualTitle ?? project.name })).toHaveAttribute('href', project.htmlUrl)
    }

    expect(within(document).queryByRole('link', { name: 'zeroaigen-auto-mention' })).not.toBeInTheDocument()
  })

  it('keeps the print stylesheet deterministic for one A4 page', async () => {
    const printStyles = await readFile(resolve(process.cwd(), 'src/styles/print.css'), 'utf8')

    expect(printStyles).toMatch(/@page\s*\{\s*size:\s*A4 portrait;\s*margin:\s*8mm 10mm;\s*\}/s)
    expect(printStyles).toMatch(/\.printable-resume\s*\{\s*display:\s*none;\s*\}/s)
    expect(printStyles).toMatch(/#root > \.resume-shell\s*\{\s*display:\s*none !important;\s*\}/s)
    expect(printStyles).toMatch(/height:\s*281mm !important;/)
    expect(printStyles).toMatch(/width:\s*190mm !important;/)
    expect(printStyles).toMatch(/\.printable-resume, \.printable-resume \*\s*\{\s*animation:\s*none !important;/s)
    expect(printStyles).toMatch(/background:\s*transparent !important;/)
  })
})
