import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AdminPage } from '../src/components/admin/AdminPage'
import { fallbackProjects, fallbackResume } from '../src/data/profile'
import type { AdminRepository } from '../src/lib/adminRepository'

function ownerRepository(overrides: Partial<AdminRepository> = {}): AdminRepository {
  return {
    isConfigured: true,
    getSession: vi.fn().mockResolvedValue({ appMetadata: { role: 'owner' } }),
    getResume: vi.fn().mockResolvedValue(fallbackResume),
    getProjects: vi.fn().mockResolvedValue(fallbackProjects.slice(0, 1)),
    getLatestSyncRun: vi.fn().mockResolvedValue({
      status: 'success',
      fetched: 7,
      written: 5,
      filtered: 2,
      error: null,
      finishedAt: '2026-08-11T09:00:00.000Z',
    }),
    saveResume: vi.fn().mockResolvedValue(undefined),
    updateProjectVisibility: vi.fn().mockResolvedValue(undefined),
    updateProjectOverrides: vi.fn().mockResolvedValue(undefined),
    triggerGitHubSync: vi.fn().mockResolvedValue({ status: 'success', fetched: 8, written: 6, filtered: 2, error: null }),
    ...overrides,
  }
}

describe('AdminPage', () => {
  afterEach(() => cleanup())

  it('prompts an unauthenticated visitor to sign in', async () => {
    const repository = ownerRepository({ getSession: vi.fn().mockResolvedValue(null) })

    render(<AdminPage repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Sign in required' })).toBeVisible()
    expect(screen.getByText(/sign in through supabase/i)).toBeVisible()
  })

  it('lets an owner edit and save structured profile content', async () => {
    const repository = ownerRepository()
    render(<AdminPage repository={repository} />)

    const name = await screen.findByLabelText('Name')
    fireEvent.change(name, { target: { value: 'Updated name' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save resume content' }))

    await waitFor(() => expect(repository.saveResume).toHaveBeenCalledWith(expect.objectContaining({
      profile: expect.objectContaining({ name: 'Updated name' }),
    })))
    expect(screen.getByText('Resume content saved.')).toBeVisible()
    expect(screen.getByLabelText('Experience')).toBeVisible()
    expect(screen.getByLabelText('Skills')).toBeVisible()
    expect(screen.getByLabelText('Education')).toBeVisible()
    expect(screen.getByLabelText('Awards')).toBeVisible()
  })

  it('persists a project visibility, featured rank, and manual overrides', async () => {
    const project = fallbackProjects[0]
    const repository = ownerRepository()
    render(<AdminPage repository={repository} />)

    const controls = await screen.findByRole('group', { name: project.name })
    fireEvent.click(screen.getByLabelText(`Visible ${project.name}`))
    fireEvent.change(screen.getByLabelText(`Featured rank ${project.name}`), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText(`Manual title ${project.name}`), { target: { value: 'Curated title' } })
    fireEvent.change(screen.getByLabelText(`Manual description ${project.name}`), { target: { value: 'Curated description' } })
    fireEvent.click(screen.getByRole('button', { name: `Save ${project.name}` }))

    await waitFor(() => expect(repository.updateProjectVisibility).toHaveBeenCalledWith(project.githubId, false, 3))
    expect(repository.updateProjectOverrides).toHaveBeenCalledWith(project.githubId, 'Curated title', 'Curated description')
    expect(controls).toHaveTextContent('Project settings saved.')
    expect(screen.getByText(/zeroaigen-auto-mention is permanently excluded/i)).toBeVisible()
  })

  it('renders successful sync counts after a manual sync', async () => {
    const repository = ownerRepository()
    render(<AdminPage repository={repository} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Run GitHub sync' }))

    expect(await screen.findByText('Sync completed successfully.')).toBeVisible()
    expect(screen.getByText('Fetched: 8')).toBeVisible()
    expect(screen.getByText('Written: 6')).toBeVisible()
    expect(screen.getByText('Filtered: 2')).toBeVisible()
  })

  it('renders sync errors returned by the server', async () => {
    const repository = ownerRepository({
      triggerGitHubSync: vi.fn().mockResolvedValue({ status: 'error', fetched: 2, written: 0, filtered: 1, error: 'GitHub unavailable' }),
    })
    render(<AdminPage repository={repository} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Run GitHub sync' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('GitHub unavailable')
    expect(screen.getByText('Fetched: 2')).toBeVisible()
  })
})
