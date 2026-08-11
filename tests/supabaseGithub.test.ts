import { describe, expect, it } from 'vitest'

import { mapRepository, shouldSyncRepository, type GitHubRepository } from '../supabase/functions/_shared/github'

describe('GitHub sync helpers', () => {
  it('rejects forks, archived repositories, the permanent slug, and configured IDs', () => {
    const exclusions = new Set<number | string>([88, 'other-excluded'])

    expect(shouldSyncRepository(repository({ id: 1, name: 'kept-project' }), exclusions)).toBe(true)
    expect(shouldSyncRepository(repository({ id: 2, name: 'forked-project', fork: true }), exclusions)).toBe(false)
    expect(shouldSyncRepository(repository({ id: 3, name: 'archived-project', archived: true }), exclusions)).toBe(false)
    expect(shouldSyncRepository(repository({ id: 4, name: 'zeroaigen-auto-mention' }), exclusions)).toBe(false)
    expect(shouldSyncRepository(repository({ id: 88, name: 'stable-id-exclusion' }), exclusions)).toBe(false)
    expect(shouldSyncRepository(repository({ id: 5, name: 'other-excluded' }), exclusions)).toBe(false)
  })

  it('maps GitHub fields into an upsert payload without manual project fields', () => {
    expect(mapRepository(repository({
      id: 42,
      name: 'resume-site',
      html_url: 'https://github.com/crazyzhang277/resume-site',
      description: null,
      language: null,
      topics: undefined,
      stargazers_count: 9,
      forks_count: 3,
      updated_at: '2026-08-11T12:00:00.000Z',
    }))).toEqual({
      githubId: 42,
      name: 'resume-site',
      description: '',
      htmlUrl: 'https://github.com/crazyzhang277/resume-site',
      language: null,
      topics: [],
      stars: 9,
      forks: 3,
      updatedAt: '2026-08-11T12:00:00.000Z',
      source: 'github',
    })
  })
})

function repository(overrides: Partial<GitHubRepository>): GitHubRepository {
  return {
    id: 0,
    name: 'project',
    full_name: 'crazyzhang277/project',
    html_url: 'https://github.com/crazyzhang277/project',
    description: 'A project',
    language: 'TypeScript',
    topics: ['aigc'],
    stargazers_count: 8,
    forks_count: 2,
    updated_at: '2026-08-01T00:00:00.000Z',
    fork: false,
    archived: false,
    ...overrides,
  }
}
