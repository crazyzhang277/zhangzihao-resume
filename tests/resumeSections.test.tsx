import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PublicResume } from '../src/App'
import { fallbackProjects, fallbackResume } from '../src/data/profile'

describe('complete resume sections', () => {
  afterEach(() => cleanup())

  it('renders every supplied resume fact and each visible GitHub project from local fallbacks', () => {
    render(<PublicResume reducedMotion />)

    expect(screen.getByRole('heading', { name: 'Zhang Zihao AIGC Resume' })).toBeVisible()
    expect(screen.getByText(`Born ${fallbackResume.profile.birth}`)).toBeVisible()

    for (const metric of fallbackResume.impact) expect(screen.getAllByText(metric.number, { exact: false }).length).toBeGreaterThan(0)
    for (const experience of fallbackResume.experience) {
      expect(screen.getByText(experience.company)).toBeVisible()
      for (const duty of experience.duties) expect(screen.getByText(duty.title)).toBeVisible()
    }
    for (const step of fallbackResume.sop) expect(screen.getByText(step.title)).toBeVisible()
    for (const group of fallbackResume.skills) expect(screen.getByRole('tab', { name: group.name })).toBeVisible()
    for (const education of fallbackResume.education) expect(screen.getByText(education.school)).toBeVisible()
    for (const award of fallbackResume.awards) expect(screen.getByText(award.title)).toBeVisible()
    for (const project of fallbackProjects.filter((item) => item.visible)) {
      expect(screen.getByRole('heading', { name: project.manualTitle ?? project.name })).toBeVisible()
    }
    for (const project of fallbackResume.projects) expect(screen.getByText(project.title)).toBeVisible()
  })

  it('expands project details through a keyboard-accessible control without rendering the excluded repository', () => {
    render(<PublicResume reducedMotion />)

    const project = fallbackProjects.find((item) => item.topics.length > 0)!
    const card = screen.getByRole('heading', { name: project.name }).closest('article')!
    const details = within(card).getByRole('button', { name: /details/i })
    fireEvent.click(details)

    expect(within(card).getByText(project.description)).toBeVisible()
    expect(screen.queryByText('zeroaigen-auto-mention')).not.toBeInTheDocument()
  })

  it('switches skill categories with arrow keys and reports successful contact copying', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<PublicResume reducedMotion />)

    const tabs = screen.getAllByRole('tab')
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' })
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getAllByRole('button', { name: /copy email/i })[0])
    expect(await screen.findByText(/copied/i)).toBeVisible()
    expect(writeText).toHaveBeenCalledWith(fallbackResume.profile.email)
  })

  it('offers a print command that invokes the browser print action', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    render(<PublicResume reducedMotion />)

    fireEvent.click(screen.getByRole('button', { name: /print resume/i }))

    expect(print).toHaveBeenCalledOnce()
  })

  it('keeps local fallback content visible when a repository refresh rejects', async () => {
    const repository = {
      getResume: vi.fn().mockRejectedValue(new Error('offline')),
      getProjects: vi.fn().mockRejectedValue(new Error('offline')),
    }
    render(<PublicResume reducedMotion repository={repository} />)

    await waitFor(() => expect(repository.getResume).toHaveBeenCalledOnce())
    expect(screen.getByRole('heading', { name: 'Zhang Zihao AIGC Resume' })).toBeVisible()
    expect(screen.getByRole('heading', { name: fallbackProjects[0].name })).toBeVisible()
  })
})
