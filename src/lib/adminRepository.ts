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
  subscribeToAuthStateChange(subscriber: (session: AdminSession | null) => void): () => void
  getResume(): Promise<ResumeContent>
  getProjects(): Promise<Project[]>
  getLatestSyncRun(): Promise<SyncRun | null>
  saveResume(content: ResumeContent): Promise<void>
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
      const { data, error } = await configuredClient.functions.invoke<SyncRunResult>('sync-github-projects', { method: 'POST' })
      if (isSyncResult(data)) return data
      const errorPayload = await readFunctionErrorPayload(error)
      if (isSyncResult(errorPayload)) return errorPayload
      if (typeof errorPayload?.error === 'string') throw new Error(errorPayload.error)
      if (error) throw error
      throw new Error('The sync service returned an invalid response.')
    },
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
