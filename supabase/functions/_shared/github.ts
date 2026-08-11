export const excludedRepositorySlug = 'zeroaigen-auto-mention'

export type GitHubRepository = {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  topics?: string[]
  stargazers_count: number
  forks_count: number
  updated_at: string
  fork: boolean
  archived: boolean
}

export type ProjectInsert = {
  githubId: number
  name: string
  description: string
  htmlUrl: string
  language: string | null
  topics: string[]
  stars: number
  forks: number
  updatedAt: string
  source: 'github'
}

export type SyncRunResult = {
  status: 'success' | 'error'
  fetched: number
  written: number
  filtered: number
  error: string | null
}

export function shouldSyncRepository(repository: GitHubRepository, exclusions: Set<number | string>): boolean {
  const slug = repository.name.toLowerCase()
  return !repository.fork
    && !repository.archived
    && slug !== excludedRepositorySlug
    && !exclusions.has(repository.id)
    && !exclusions.has(slug)
}

export function mapRepository(repository: GitHubRepository): ProjectInsert {
  return {
    githubId: repository.id,
    name: repository.name,
    description: repository.description ?? '',
    htmlUrl: repository.html_url,
    language: repository.language,
    topics: repository.topics ?? [],
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    updatedAt: repository.updated_at,
    source: 'github',
  }
}
