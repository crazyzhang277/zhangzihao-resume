import { describe, expect, it } from 'vitest'

import { filterAndMapGitHubRepositories } from '../src/data/github'

describe('filterAndMapGitHubRepositories', () => {
  it('excludes the permanent slug, forks, and archived repositories', () => {
    const projects = filterAndMapGitHubRepositories([
      repository({ id: 1, name: 'zeroaigen-auto-mention' }),
      repository({ id: 2, name: 'forked-project', fork: true }),
      repository({ id: 3, name: 'archived-project', archived: true }),
      repository({ id: 4, name: 'kept-project' }),
    ])

    expect(projects.map((project) => project.name)).toEqual(['kept-project'])
  })

  it('maps GitHub fields and sorts featured projects before recent projects', () => {
    const projects = filterAndMapGitHubRepositories(
      [
        repository({ id: 1, name: 'recent-unfeatured', html_url: 'https://github.com/crazyzhang277/recent-unfeatured', updated_at: '2026-08-03T00:00:00.000Z' }),
        repository({ id: 2, name: 'featured-later', html_url: 'https://github.com/crazyzhang277/featured-later', updated_at: '2026-08-01T00:00:00.000Z' }),
        repository({ id: 3, name: 'featured-first', html_url: 'https://github.com/crazyzhang277/featured-first', updated_at: '2026-08-02T00:00:00.000Z' }),
      ],
      [
        { githubId: 2, featuredRank: 2, manualTitle: 'Later', manualDescription: null, visible: true },
        { githubId: 3, featuredRank: 1, manualTitle: null, manualDescription: 'First', visible: true },
      ],
    )

    expect(projects.map((project) => project.name)).toEqual([
      'featured-first',
      'featured-later',
      'recent-unfeatured',
    ])
    expect(projects[0]).toMatchObject({
      githubId: 3,
      htmlUrl: 'https://github.com/crazyzhang277/featured-first',
      language: 'TypeScript',
      topics: ['aigc'],
      stars: 8,
      forks: 2,
      featuredRank: 1,
      manualDescription: 'First',
    })
  })
})

function repository(overrides: Record<string, unknown>) {
  return {
    id: 0,
    name: 'project',
    description: 'A project',
    html_url: 'https://github.com/crazyzhang277/project',
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
