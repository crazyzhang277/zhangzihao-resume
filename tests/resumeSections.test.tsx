import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PublicResume } from '../src/App'
import { fallbackProjects, fallbackResume } from '../src/data/profile'

describe('complete resume sections', () => {
  afterEach(() => cleanup())

  it('renders every supplied resume fact and each visible GitHub project from local fallbacks', () => {
    render(<PublicResume reducedMotion />)

    expect(screen.getByRole('heading', { name: 'Zhang Zihao AIGC Resume' })).toBeVisible()
    expect(screen.getByText(`${fallbackResume.profile.name} / ${fallbackResume.profile.englishName}`)).toBeVisible()
    expect(screen.getByText(fallbackResume.profile.location, { exact: false })).toBeVisible()
    expect(screen.getByText(`Born ${fallbackResume.profile.birth}`)).toBeVisible()
    expect(screen.getByText(fallbackResume.profile.bio)).toBeVisible()
    for (const role of fallbackResume.profile.targetRoles) expect(screen.getByText(role)).toBeVisible()

    for (const metric of fallbackResume.impact) {
      expect(screen.getAllByText(metric.number, { exact: false }).length).toBeGreaterThan(0)
      expect(screen.getByText(metric.title)).toBeVisible()
      expect(screen.getByText(metric.subtitle)).toBeVisible()
      expect(screen.getByText(metric.description)).toBeVisible()
    }
    for (const experience of fallbackResume.experience) {
      const entry = screen.getByText(experience.company).closest('article')!
      expect(within(entry).getByText(experience.department, { exact: false })).toBeVisible()
      expect(within(entry).getByText(experience.role, { exact: false })).toBeVisible()
      expect(within(entry).getByText(experience.period, { exact: false })).toBeVisible()
      expect(within(entry).getByText(experience.status, { exact: false })).toBeVisible()
      for (const duty of experience.duties) {
        expect(within(entry).getByText(duty.title)).toBeVisible()
        expect(within(entry).getByText(duty.description)).toBeVisible()
      }
    }
    for (const step of fallbackResume.sop) {
      expect(screen.getByText(step.title)).toBeVisible()
      expect(screen.getByText(step.description)).toBeVisible()
    }
    for (const group of fallbackResume.skills) {
      const tab = screen.getByRole('tab', { name: group.name })
      fireEvent.click(tab)
      const panel = document.getElementById(tab.getAttribute('aria-controls')!)!
      for (const skill of group.skills) {
        expect(within(panel).getByText(skill.name)).toBeVisible()
        expect(within(panel).getByText(skill.tag)).toBeVisible()
      }
    }
    for (const education of fallbackResume.education) {
      expect(screen.getByText(education.school)).toBeVisible()
      expect(screen.getByText(education.major, { exact: false })).toBeVisible()
      for (const course of education.courses) expect(screen.getByText(course)).toBeVisible()
    }
    for (const award of fallbackResume.awards) {
      expect(screen.getByText(award.title)).toBeVisible()
      expect(screen.getByText(award.level, { exact: false })).toBeVisible()
      expect(screen.getByText(award.description)).toBeVisible()
    }
    for (const project of fallbackProjects.filter((item) => item.visible)) {
      const card = screen.getByRole('heading', { name: project.manualTitle ?? project.name }).closest('article')!
      expect(within(card).getByText(project.language ?? 'Repository')).toBeVisible()
      const stars = within(card).getByText('Stars').closest('div')!
      const forks = within(card).getByText('Forks').closest('div')!
      expect(within(stars).getByText(String(project.stars))).toBeVisible()
      expect(within(forks).getByText(String(project.forks))).toBeVisible()
    }
    for (const project of fallbackResume.projects) {
      expect(screen.getByText(project.title)).toBeVisible()
      expect(screen.getByText(project.role, { exact: false })).toBeVisible()
      expect(screen.getByText(project.description)).toBeVisible()
      expect(screen.getByText(project.highlights[0])).toBeVisible()
    }
    expect(screen.getByRole('link', { name: new RegExp(fallbackResume.profile.email) })).toBeVisible()
    expect(screen.getByRole('link', { name: new RegExp(fallbackResume.profile.phone) })).toBeVisible()
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

  it('keeps fallback resume content when only the project refresh succeeds', async () => {
    const syncedProject = fallbackProjects[1]
    const excludedProject = { ...fallbackProjects[0], githubId: -1, name: 'zeroaigen-auto-mention' }
    const repository = {
      getResume: vi.fn().mockRejectedValue(new Error('offline')),
      getProjects: vi.fn().mockResolvedValue([syncedProject, excludedProject]),
    }
    render(<PublicResume reducedMotion repository={repository} />)

    await waitFor(() => expect(screen.getByRole('heading', { name: syncedProject.name })).toBeVisible())

    expect(screen.getByText(`Born ${fallbackResume.profile.birth}`)).toBeVisible()
    expect(screen.queryByRole('heading', { name: fallbackProjects[0].name })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: excludedProject.name })).not.toBeInTheDocument()
  })

  it('keeps fallback projects when only the resume refresh succeeds', async () => {
    const remoteResume = { ...fallbackResume, impact: [fallbackResume.impact[1]] }
    const repository = {
      getResume: vi.fn().mockResolvedValue(remoteResume),
      getProjects: vi.fn().mockRejectedValue(new Error('offline')),
    }
    render(<PublicResume reducedMotion repository={repository} />)

    await waitFor(() => expect(screen.queryByText(fallbackResume.impact[0].title)).not.toBeInTheDocument())

    expect(screen.getByText(remoteResume.impact[0].description)).toBeVisible()
    expect(screen.getByRole('heading', { name: fallbackProjects[0].name })).toBeVisible()
  })
})
