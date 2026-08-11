import { describe, expect, it } from 'vitest'

import { fallbackProjects, fallbackResume } from '../src/data/profile'
import { createContentRepository } from '../src/lib/contentRepository'

function remoteClient(resume: unknown, projects: unknown, error: unknown = null) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: resume, error }),
          order: () => ({
            order: async () => ({ data: table === 'projects' ? projects : resume, error }),
          }),
        }),
      }),
    }),
  }
}

describe('ContentRepository', () => {
  it('uses published remote resume and visible projects when available', async () => {
    const remoteResume = {
      ...fallbackResume,
      profile: { ...fallbackResume.profile, status: '远程内容' },
    }
    const remoteProjects = [
      {
        github_id: 42,
        name: 'remote-project',
        description: 'Remote project',
        html_url: 'https://github.com/crazyzhang277/remote-project',
        language: 'TypeScript',
        topics: ['resume'],
        stars: 3,
        forks: 1,
        updated_at: '2026-08-01T00:00:00.000Z',
        visible: true,
        featured_rank: 1,
        manual_title: null,
        manual_description: null,
      },
    ]
    const repository = createContentRepository(remoteClient({ content: remoteResume }, remoteProjects) as never)

    await expect(repository.getResume()).resolves.toEqual(remoteResume)
    await expect(repository.getProjects()).resolves.toEqual([
      {
        githubId: 42,
        name: 'remote-project',
        description: 'Remote project',
        htmlUrl: 'https://github.com/crazyzhang277/remote-project',
        language: 'TypeScript',
        topics: ['resume'],
        stars: 3,
        forks: 1,
        updatedAt: '2026-08-01T00:00:00.000Z',
        visible: true,
        featuredRank: 1,
        manualTitle: null,
        manualDescription: null,
      },
    ])
  })

  it('returns complete local data when no remote client is configured', async () => {
    const repository = createContentRepository(null)
    const resume = await repository.getResume()

    expect(resume).toEqual(fallbackResume)
    expect(resume.profile.phone).toBe('17302787402')
    expect(resume.impact).toHaveLength(4)
    expect(resume.experience[0].duties).toHaveLength(5)
    expect(resume.sop).toHaveLength(4)
    expect(resume.skills).toHaveLength(4)
    expect(resume.education[0].courses).toHaveLength(4)
    expect(resume.awards[0].title).toContain('二等奖')
    expect(resume.projects).toHaveLength(4)
    expect(resume.projects.map((project) => project.id)).not.toContain('zeroaigen-auto-mention')
    expect(resume.print.pageSize).toBe('A4 portrait')
    expect(fallbackProjects.map((project) => project.name)).not.toContain('zeroaigen-auto-mention')
    await expect(repository.getProjects()).resolves.toEqual(fallbackProjects)
  })

  it('returns local data when the remote request fails', async () => {
    const repository = createContentRepository(remoteClient(null, null, new Error('offline')) as never)

    await expect(repository.getResume()).resolves.toEqual(fallbackResume)
    await expect(repository.getProjects()).resolves.toEqual(fallbackProjects)
  })

  it('excludes forked, archived, and permanently excluded remote projects', async () => {
    const repository = createContentRepository(remoteClient({ content: fallbackResume }, [
      projectRecord({ github_id: 1, name: 'kept-project' }),
      projectRecord({ github_id: 2, name: 'forked-project', fork: true }),
      projectRecord({ github_id: 3, name: 'archived-project', archived: true }),
      projectRecord({ github_id: 4, name: 'zeroaigen-auto-mention' }),
    ]) as never)

    await expect(repository.getProjects()).resolves.toMatchObject([
      { githubId: 1, name: 'kept-project' },
    ])
  })

  it('returns local content when a remote resume omits required field values', async () => {
    const malformedResume = {
      ...fallbackResume,
      profile: { ...fallbackResume.profile, phone: 17302787402 },
      impact: [{ number: '40%' }],
    }
    const repository = createContentRepository(remoteClient({ content: malformedResume }, []) as never)

    await expect(repository.getResume()).resolves.toEqual(fallbackResume)
  })
})

function projectRecord(overrides: Record<string, unknown>) {
  return {
    github_id: 0,
    name: 'project',
    description: 'Remote project',
    html_url: 'https://github.com/crazyzhang277/project',
    language: 'TypeScript',
    topics: ['resume'],
    stars: 0,
    forks: 0,
    updated_at: '2026-08-01T00:00:00.000Z',
    visible: true,
    featured_rank: null,
    manual_title: null,
    manual_description: null,
    fork: false,
    archived: false,
    ...overrides,
  }
}
