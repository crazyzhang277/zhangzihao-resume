import type { Project } from '../types/content'

export const excludedRepositorySlug = 'zeroaigen-auto-mention'

export type GitHubRepository = {
  id: number
  name: string
  description: string | null
  html_url: string
  language: string | null
  topics: string[]
  stargazers_count: number
  forks_count: number
  updated_at: string
  fork: boolean
  archived: boolean
}

export type ProjectOverride = Pick<Project, 'githubId' | 'visible' | 'featuredRank' | 'manualTitle' | 'manualDescription'>

export function filterAndMapGitHubRepositories(repositories: GitHubRepository[], overrides: ProjectOverride[] = []): Project[] {
  const overridesById = new Map(overrides.map((override) => [override.githubId, override]))

  return sortProjects(repositories
    .filter((repository) => !repository.fork && !repository.archived && repository.name.toLowerCase() !== excludedRepositorySlug)
    .map((repository) => {
      const override = overridesById.get(repository.id)
      return {
        githubId: repository.id,
        name: repository.name,
        description: repository.description ?? '',
        htmlUrl: repository.html_url,
        language: repository.language,
        topics: repository.topics,
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        updatedAt: repository.updated_at,
        visible: override?.visible ?? true,
        featuredRank: override?.featuredRank ?? null,
        manualTitle: override?.manualTitle ?? null,
        manualDescription: override?.manualDescription ?? null,
      }
    })
    .filter((project) => project.visible))
}

export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((left, right) => {
    if (left.featuredRank !== null || right.featuredRank !== null) {
      if (left.featuredRank === null) return 1
      if (right.featuredRank === null) return -1
      if (left.featuredRank !== right.featuredRank) return left.featuredRank - right.featuredRank
    }
    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  })
}

export function mapProjectRecord(record: Record<string, unknown>): Project | null {
  const githubId = numberValue(record.github_id ?? record.githubId)
  const name = stringValue(record.name)
  const htmlUrl = stringValue(record.html_url ?? record.htmlUrl)
  const updatedAt = stringValue(record.updated_at ?? record.updatedAt)
  if (githubId === null || name === null || htmlUrl === null || updatedAt === null || booleanValue(record.fork) === true || booleanValue(record.archived) === true || name.toLowerCase() === excludedRepositorySlug) return null

  return {
    githubId,
    name,
    description: stringValue(record.description) ?? '',
    htmlUrl,
    language: stringValue(record.language),
    topics: stringArrayValue(record.topics),
    stars: numberValue(record.stars ?? record.stargazers_count) ?? 0,
    forks: numberValue(record.forks ?? record.forks_count) ?? 0,
    updatedAt,
    visible: booleanValue(record.visible) ?? true,
    featuredRank: numberValue(record.featured_rank ?? record.featuredRank),
    manualTitle: stringValue(record.manual_title ?? record.manualTitle),
    manualDescription: stringValue(record.manual_description ?? record.manualDescription),
  }
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function booleanValue(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function stringArrayValue(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : []
}
