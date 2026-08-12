import { FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js'

import { mapProjectRecord, sortProjects } from '../data/github'
import { fallbackResume } from '../data/profile'
import type { Project, ResumeContent } from '../types/content'
import { isResumeContent } from './contentRepository'
import { supabase } from './supabase'

export type SyncRunResult = {
  status: 'success' | 'error'
  fetched: number
  written: number
  filtered: number
  error: string | null
}

export type SyncRun = SyncRunResult & { finishedAt: string }

export type AdminSession = {
  appMetadata: { role?: string }
}

export interface AdminRepository {
  isConfigured: boolean
  getSession(): Promise<AdminSession | null>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  subscribeToAuthStateChange(subscriber: (session: AdminSession | null) => void): () => void
  getResume(): Promise<ResumeContent>
  getProjects(): Promise<Project[]>
  getLatestSyncRun(): Promise<SyncRun | null>
  saveResume(content: ResumeContent): Promise<void>
  saveProjectSettings(githubId: number, visible: boolean, featuredRank: number | null, manualTitle: string | null, manualDescription: string | null): Promise<void>
  updateProjectVisibility(githubId: number, visible: boolean, featuredRank: number | null): Promise<void>
  updateProjectOverrides(githubId: number, manualTitle: string | null, manualDescription: string | null): Promise<void>
  triggerGitHubSync(): Promise<SyncRunResult>
}

export function createAdminRepository(client: SupabaseClient | null = supabase): AdminRepository {
  let profileId: string | null = null

  return {
    isConfigured: client !== null,
    async getSession() {
      const configuredClient = requireClient(client)
      const { data, error } = await configuredClient.auth.getSession()
      if (error) throw error
      return mapAdminSession(data.session)
    },
    async signIn(email, password) {
      const configuredClient = requireClient(client)
      const { error } = await configuredClient.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signOut() {
      const configuredClient = requireClient(client)
      const { error } = await configuredClient.auth.signOut()
      if (error) throw error
    },
    subscribeToAuthStateChange(subscriber) {
      const configuredClient = requireClient(client)
      const { data } = configuredClient.auth.onAuthStateChange((_event, session) => subscriber(mapAdminSession(session)))
      return () => data.subscription.unsubscribe()
    },
    async getResume() {
      const configuredClient = requireClient(client)
      const { data, error } = await configuredClient.from('profile_content')
        .select('id, content, published')
        .order('updated_at', { ascending: false })
        .limit(1)
      if (error) throw error
      const record = Array.isArray(data) ? data[0] : null
      if (!isRecord(record) || typeof record.id !== 'string' || !isResumeContent(record.content)) return fallbackResume
      profileId = record.id
      return record.content
    },
    async getProjects() {
      const configuredClient = requireClient(client)
      const { data, error } = await configuredClient.from('projects').select('*')
        .order('featured_rank', { ascending: true, nullsFirst: false })
        .order('updated_at', { ascending: false })
      if (error) throw error
      if (!Array.isArray(data)) return []
      return sortProjects(data.filter(isRecord).map(mapProjectRecord).filter((project): project is Project => project !== null))
    },
    async getLatestSyncRun() {
      const configuredClient = requireClient(client)
      const { data, error } = await configuredClient.from('sync_runs').select('*').order('finished_at', { ascending: false }).limit(1)
      if (error) throw error
      const record = Array.isArray(data) ? data[0] : null
      return mapSyncRun(record)
    },
    async saveResume(content) {
      const configuredClient = requireClient(client)
      if (!isResumeContent(content)) throw new Error('Resume content is invalid.')
      const payload = { content, published: true, updated_at: new Date().toISOString() }
      const query = profileId
        ? configuredClient.from('profile_content').update(payload).eq('id', profileId)
        : configuredClient.from('profile_content').insert(payload)
      const { error } = await query
      if (error) throw error
    },
    async saveProjectSettings(githubId, visible, featuredRank, manualTitle, manualDescription) {
      const configuredClient = requireClient(client)
      const { error } = await configuredClient.from('projects')
        .update({
          visible,
          featured_rank: featuredRank,
          manual_title: manualTitle,
          manual_description: manualDescription,
          record_updated_at: new Date().toISOString(),
        })
        .eq('github_id', githubId)
      if (error) throw error
    },
    async updateProjectVisibility(githubId, visible, featuredRank) {
      const configuredClient = requireClient(client)
      const { error } = await configuredClient.from('projects')
        .update({ visible, featured_rank: featuredRank, record_updated_at: new Date().toISOString() })
        .eq('github_id', githubId)
      if (error) throw error
    },
    async updateProjectOverrides(githubId, manualTitle, manualDescription) {
      const configuredClient = requireClient(client)
      const { error } = await configuredClient.from('projects')
        .update({ manual_title: manualTitle, manual_description: manualDescription, record_updated_at: new Date().toISOString() })
        .eq('github_id', githubId)
      if (error) throw error
    },
    async triggerGitHubSync() {
      const configuredClient = requireClient(client)
      try {
        const { data, error } = await configuredClient.functions.invoke<SyncRunResult>('sync-github-projects', { method: 'POST' })
        if (isSyncResult(data)) return data
        const errorPayload = await readFunctionErrorPayload(error)
        if (isSyncResult(errorPayload)) return errorPayload
      } catch {
        // Fallback to client-side sync if Edge Function is unavailable
      }
      return await runClientSideGitHubSync(configuredClient)
    },
  }
}

async function runClientSideGitHubSync(supabase: SupabaseClient): Promise<SyncRunResult> {
  const githubAccount = 'crazyzhang277'
  const startedAt = new Date().toISOString()
  let fetched = 0
  let written = 0
  let filtered = 0

  try {
    const { data: exclusionRows } = await supabase.from('project_exclusions').select('github_id, repository_slug')
    const exclusions = new Set<number | string>()
    for (const row of exclusionRows ?? []) {
      if (typeof row.github_id === 'number') exclusions.add(row.github_id)
      if (typeof row.repository_slug === 'string') exclusions.add(row.repository_slug.toLowerCase())
    }

    const res = await fetch(`https://api.github.com/users/${githubAccount}/repos?per_page=100&type=owner&sort=updated`)
    if (!res.ok) throw new Error(`GitHub API fetch failed with status ${res.status}`)

    const repos: unknown = await res.json()
    if (!Array.isArray(repos)) throw new Error('GitHub API returned invalid data format.')

    fetched = repos.length
    const validRepos = repos.filter((r: Record<string, unknown>) => {
      const slug = typeof r.name === 'string' ? r.name.toLowerCase() : ''
      const id = typeof r.id === 'number' ? r.id : 0
      return !r.fork && !r.archived && slug !== 'zeroaigen-auto-mention' && !exclusions.has(id) && !exclusions.has(slug)
    })
    filtered = fetched - validRepos.length

    const now = new Date().toISOString()
    const projectRows = validRepos.map((r: Record<string, unknown>) => ({
      github_id: r.id,
      name: r.name,
      description: typeof r.description === 'string' ? r.description : '',
      html_url: r.html_url,
      language: r.language ?? null,
      topics: Array.isArray(r.topics) ? r.topics : [],
      stars: typeof r.stargazers_count === 'number' ? r.stargazers_count : 0,
      forks: typeof r.forks_count === 'number' ? r.forks_count : 0,
      updated_at: r.updated_at,
      source: 'github',
      fork: Boolean(r.fork),
      archived: Boolean(r.archived),
      stale: false,
      last_synced_at: now,
      record_updated_at: now,
    }))

    const { error: syncError } = await supabase.from('projects').upsert(projectRows, { onConflict: 'github_id' })
    if (syncError) throw syncError
    written = projectRows.length

    const result: SyncRunResult = { status: 'success', fetched, written, filtered, error: null }
    await supabase.from('sync_runs').insert({
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: 'success',
      fetched,
      written,
      filtered,
      error: null,
    })
    return result
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Sync request failed.'
    const result: SyncRunResult = { status: 'error', fetched, written, filtered, error: errorMsg }
    await supabase.from('sync_runs').insert({
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: 'error',
      fetched,
      written,
      filtered,
      error: errorMsg,
    })
    return result
  }
}

function requireClient(client: SupabaseClient | null): SupabaseClient {
  if (!client) throw new Error('Supabase browser configuration is unavailable.')
  return client
}

function mapAdminSession(session: { user: { app_metadata: unknown } } | null): AdminSession | null {
  if (!session) return null
  const appMetadata = session.user.app_metadata
  return { appMetadata: isRecord(appMetadata) && typeof appMetadata.role === 'string' ? { role: appMetadata.role } : {} }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSyncResult(value: unknown): value is SyncRunResult {
  return isRecord(value)
    && (value.status === 'success' || value.status === 'error')
    && typeof value.fetched === 'number'
    && typeof value.written === 'number'
    && typeof value.filtered === 'number'
    && (typeof value.error === 'string' || value.error === null)
}

async function readFunctionErrorPayload(error: unknown): Promise<Record<string, unknown> | null> {
  if (!(error instanceof FunctionsHttpError) || !isRecord(error.context)) return null
  const response = error.context
  if (typeof response.clone !== 'function') return null
  const copy = response.clone()
  if (typeof copy.json !== 'function') return null
  try {
    const payload: unknown = await copy.json()
    return isRecord(payload) ? payload : null
  } catch {
    return null
  }
}

function mapSyncRun(value: unknown): SyncRun | null {
  if (!isRecord(value)) return null
  const finishedAt = value.finished_at
  if (!isSyncResult(value) || typeof finishedAt !== 'string') return null
  return {
    status: value.status,
    fetched: value.fetched,
    written: value.written,
    filtered: value.filtered,
    error: value.error,
    finishedAt,
  }
}
