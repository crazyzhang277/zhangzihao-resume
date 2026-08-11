import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import {
  fetchGitHubRepositories,
  mapRepository,
  shouldSyncRepository,
  type SyncRunResult,
} from '../_shared/github.ts'

const githubAccount = 'crazyzhang277'
const githubPageSize = 100

type RuntimeConfig = {
  githubToken: string
  supabaseUrl: string
  serviceRoleKey: string
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const config = runtimeConfig()
    const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    if (!await isAuthorized(request, supabase, config.serviceRoleKey)) return json({ error: 'Forbidden' }, 403)

    const result = await syncGitHubProjects(supabase, config.githubToken)
    return json(result, result.status === 'success' ? 200 : 500)
  } catch (error) {
    return json({ error: errorMessage(error) }, 500)
  }
})

async function syncGitHubProjects(supabase: ReturnType<typeof createClient>, githubToken: string): Promise<SyncRunResult> {
  const startedAt = new Date().toISOString()
  let fetched = 0
  let written = 0
  let filtered = 0
  let result: SyncRunResult

  try {
    const { data: exclusionRows, error: exclusionsError } = await supabase
      .from('project_exclusions')
      .select('github_id, repository_slug')
    if (exclusionsError) throw exclusionsError

    const exclusions = new Set<number | string>()
    for (const row of exclusionRows ?? []) {
      if (typeof row.github_id === 'number') exclusions.add(row.github_id)
      if (typeof row.repository_slug === 'string') exclusions.add(row.repository_slug.toLowerCase())
    }

    const repositoryResult = await fetchGitHubRepositories(
      `https://api.github.com/users/${githubAccount}/repos?per_page=${githubPageSize}&page=1&type=owner&sort=updated`,
      (url) => fetch(url, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${githubToken}`,
          'User-Agent': 'aigc-resume-github-sync',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }),
      (repository) => shouldSyncRepository(repository, exclusions),
    )
    fetched = repositoryResult.fetched
    filtered = repositoryResult.filtered
    if (!repositoryResult.ok) throw repositoryResult.error

    const now = new Date().toISOString()
    const projectRows = repositoryResult.repositories.map((repository) => {
      const project = mapRepository(repository)
      return {
        github_id: project.githubId,
        name: project.name,
        description: project.description,
        html_url: project.htmlUrl,
        language: project.language,
        topics: project.topics,
        stars: project.stars,
        forks: project.forks,
        updated_at: project.updatedAt,
        source: project.source,
        fork: repository.fork,
        archived: repository.archived,
        stale: false,
        last_synced_at: now,
        record_updated_at: now,
      }
    })

    if (projectRows.length > 0) {
      const { error: upsertError } = await supabase.from('projects').upsert(projectRows, { onConflict: 'github_id' })
      if (upsertError) throw upsertError
    }
    written = projectRows.length

    let staleQuery = supabase
      .from('projects')
      .update({ stale: true, visible: false, record_updated_at: now })
      .eq('source', 'github')
    if (projectRows.length > 0) staleQuery = staleQuery.not('github_id', 'in', `(${projectRows.map((project) => project.github_id).join(',')})`)
    const { error: staleError } = await staleQuery
    if (staleError) throw staleError

    result = {
      status: 'success',
      fetched,
      written,
      filtered,
      error: null,
    }
  } catch (error) {
    result = { status: 'error', fetched, written, filtered, error: errorMessage(error) }
  }

  const { error: logError } = await supabase.from('sync_runs').insert({
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    status: result.status,
    fetched: result.fetched,
    written: result.written,
    filtered: result.filtered,
    error: result.error,
  })
  if (logError) return { ...result, status: 'error', error: `Sync log write failed: ${logError.message}` }

  return result
}

async function isAuthorized(request: Request, supabase: ReturnType<typeof createClient>, serviceRoleKey: string): Promise<boolean> {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return false

  const token = authorization.slice('Bearer '.length).trim()
  if (token === serviceRoleKey) return true

  const { data, error } = await supabase.auth.getUser(token)
  return !error && data.user?.app_metadata?.role === 'owner'
}

function runtimeConfig(): RuntimeConfig {
  return {
    githubToken: requiredSecret('GITHUB_TOKEN'),
    supabaseUrl: requiredSecret('SUPABASE_URL'),
    serviceRoleKey: requiredSecret('SUPABASE_SERVICE_ROLE_KEY'),
  }
}

function requiredSecret(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required Edge Function secret: ${name}`)
  return value
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown sync failure'
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}
