import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AdminContentForm } from '../src/components/admin/AdminContentForm'
import { AdminPage } from '../src/components/admin/AdminPage'
import { fallbackProjects, fallbackResume } from '../src/data/profile'
import { createAdminRepository, type AdminRepository, type AdminSession } from '../src/lib/adminRepository'

type AuthSubscriber = (session: AdminSession | null) => void
type TestRepository = AdminRepository & {
  subscribeToAuthStateChange(subscriber: AuthSubscriber): () => void
}

function ownerRepository(overrides: Partial<TestRepository> = {}): TestRepository {
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
    signIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    saveProjectSettings: vi.fn().mockResolvedValue(undefined),
    updateProjectVisibility: vi.fn().mockResolvedValue(undefined),
    updateProjectOverrides: vi.fn().mockResolvedValue(undefined),
    triggerGitHubSync: vi.fn().mockResolvedValue({ status: 'success', fetched: 8, written: 6, filtered: 2, error: null }),
    subscribeToAuthStateChange: vi.fn().mockReturnValue(vi.fn()),
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

  it('denies a non-owner before loading any owner data', async () => {
    const repository = ownerRepository({ getSession: vi.fn().mockResolvedValue({ appMetadata: { role: 'editor' } }) })

    render(<AdminPage repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Owner access required' })).toBeVisible()
    expect(repository.getResume).not.toHaveBeenCalled()
    expect(repository.getProjects).not.toHaveBeenCalled()
    expect(repository.getLatestSyncRun).not.toHaveBeenCalled()
  })

  it('removes owner controls and cleans up the auth listener when the owner session is invalidated', async () => {
    let subscriber: AuthSubscriber | undefined
    const unsubscribe = vi.fn()
    const repository = ownerRepository({
      subscribeToAuthStateChange: vi.fn((callback: AuthSubscriber) => {
        subscriber = callback
        return unsubscribe
      }),
    })
    const view = render(<AdminPage repository={repository} />)

    expect(await screen.findByRole('button', { name: 'Run GitHub sync' })).toBeVisible()
    expect(repository.subscribeToAuthStateChange).toHaveBeenCalledOnce()

    subscriber?.(null)

    expect(await screen.findByRole('heading', { name: 'Sign in required' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Run GitHub sync' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save resume content' })).not.toBeInTheDocument()

    view.unmount()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('removes owner controls when an auth event removes the owner claim', async () => {
    let subscriber: AuthSubscriber | undefined
    const repository = ownerRepository({
      subscribeToAuthStateChange: vi.fn((callback: AuthSubscriber) => {
        subscriber = callback
        return vi.fn()
      }),
    })
    render(<AdminPage repository={repository} />)

    expect(await screen.findByRole('button', { name: 'Run GitHub sync' })).toBeVisible()
    subscriber?.({ appMetadata: { role: 'editor' } })

    expect(await screen.findByRole('heading', { name: 'Owner access required' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Run GitHub sync' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save resume content' })).not.toBeInTheDocument()
  })

  it('loads owner data when an auth event gains the owner claim', async () => {
    let subscriber: AuthSubscriber | undefined
    const repository = ownerRepository({
      getSession: vi.fn().mockResolvedValue(null),
      subscribeToAuthStateChange: vi.fn((callback: AuthSubscriber) => {
        subscriber = callback
        return vi.fn()
      }),
    })
    render(<AdminPage repository={repository} />)

    expect(await screen.findByRole('heading', { name: 'Sign in required' })).toBeVisible()
    subscriber?.({ appMetadata: { role: 'owner' } })

    expect(await screen.findByRole('button', { name: 'Run GitHub sync' })).toBeVisible()
    expect(repository.getResume).toHaveBeenCalledOnce()
    expect(repository.getProjects).toHaveBeenCalledOnce()
    expect(repository.getLatestSyncRun).toHaveBeenCalledOnce()
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

    await waitFor(() => expect(repository.saveProjectSettings).toHaveBeenCalledWith(project.githubId, false, 3, 'Curated title', 'Curated description'))
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

  it('renders typed server sync failure counts returned through the Functions HTTP error response', async () => {
    const response = new Response(JSON.stringify({ status: 'error', fetched: 2, written: 0, filtered: 1, error: 'GitHub unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
    const syncRepository = createAdminRepository({
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: null,
          error: new FunctionsHttpError(response),
          response,
        }),
      },
    } as never)
    const repository = ownerRepository({ triggerGitHubSync: syncRepository.triggerGitHubSync })
    render(<AdminPage repository={repository} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Run GitHub sync' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('GitHub unavailable')
    expect(screen.getByText('Fetched: 2')).toBeVisible()
  })
})

describe('AdminContentForm', () => {
  afterEach(() => cleanup())

  it.each([
    ['nested skill fields', { ...fallbackResume, skills: [{ name: 'AI', skills: [{ name: 'Prompting', tag: 42 }] }] }],
    ['nested experience duties', { ...fallbackResume, experience: [{ ...fallbackResume.experience[0], duties: [{ title: 'Delivery', description: 42 }] }] }],
    ['profile target roles', { ...fallbackResume, profile: { ...fallbackResume.profile, targetRoles: ['AI', 42] } }],
  ])('does not save invalid %s', async (_label, content) => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<AdminContentForm content={content as never} onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: 'Save resume content' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Resume content is invalid.')
    expect(onSave).not.toHaveBeenCalled()
  })
})
