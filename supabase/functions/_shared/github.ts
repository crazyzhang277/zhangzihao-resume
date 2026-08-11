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

type GitHubResponse = {
  ok: boolean
  status: number
  json: () => Promise<unknown>
  headers: { get: (name: string) => string | null }
}

export type GitHubRepositoryFetchResult =
  | {
    ok: true
    repositories: GitHubRepository[]
    fetched: number
    filtered: number
    error: null
  }
  | {
    ok: false
    repositories: null
    fetched: number
    filtered: number
    error: Error
  }

export async function fetchGitHubRepositories(
  initialUrl: string,
  fetchPage: (url: string) => Promise<GitHubResponse>,
  shouldInclude: (repository: GitHubRepository) => boolean,
): Promise<GitHubRepositoryFetchResult> {
  const repositories: GitHubRepository[] = []
  let fetched = 0
  let filtered = 0
  let url: string | null = initialUrl

  try {
    while (url) {
      const response = await fetchPage(url)
      if (!response.ok) throw new Error(`GitHub repository fetch failed with ${response.status}`)

      const page = await response.json()
      if (!Array.isArray(page)) throw new Error('GitHub repository response was not an array')

      if (!page.every(isGitHubRepository)) throw new Error('GitHub repository response contained an invalid repository record')

      const pageRepositories = page
      const includedRepositories = pageRepositories.filter(shouldInclude)
      fetched += pageRepositories.length
      filtered += pageRepositories.length - includedRepositories.length
      repositories.push(...includedRepositories)
      url = nextPageUrl(response.headers.get('link'))
    }
  } catch (error) {
    return {
      ok: false,
      repositories: null,
      fetched,
      filtered,
      error: error instanceof Error ? error : new Error('Unknown GitHub repository fetch failure'),
    }
  }

  return { ok: true, repositories, fetched, filtered, error: null }
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

function nextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
  return match?.[1] ?? null
}

function isGitHubRepository(value: unknown): value is GitHubRepository {
  if (!isRecord(value)) return false
  return typeof value.id === 'number'
    && typeof value.name === 'string'
    && typeof value.full_name === 'string'
    && typeof value.html_url === 'string'
    && (value.description === null || typeof value.description === 'string')
    && (value.language === null || typeof value.language === 'string')
    && (value.topics === undefined || (Array.isArray(value.topics) && value.topics.every((topic) => typeof topic === 'string')))
    && typeof value.stargazers_count === 'number'
    && typeof value.forks_count === 'number'
    && typeof value.updated_at === 'string'
    && typeof value.fork === 'boolean'
    && typeof value.archived === 'boolean'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
