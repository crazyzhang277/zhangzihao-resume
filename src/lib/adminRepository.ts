import type { SupabaseClient } from '@supabase/supabase-js'

import { mapProjectRecord, sortProjects } from '../data/github'
import { fallbackResume } from '../data/profile'
import type { Project, ResumeContent } from '../types/content'
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
      if (!data.session) return null
      const appMetadata = data.session.user.app_metadata
      return { appMetadata: isRecord(appMetadata) && typeof appMetadata.role === 'string' ? { role: appMetadata.role } : {} }
    },
    async getResume() {
      const configuredClient = requireClient(client)
      const { data, error } = await configuredClient.from('profile_content')
        .select('id, content, published')
        .order('updated_at', { ascending: false })
        .limit(1)
      if (error) throw error
      const record = Array.isArray(data) ? data[0] : null
      if (!isRecord(record) || typeof record.id !== 'string' || !isRecord(record.content)) return fallbackResume
      profileId = record.id
      return record.content as ResumeContent
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
      if (error) throw error
      if (!isSyncResult(data)) throw new Error('The sync service returned an invalid response.')
      return data
    },
  }
}

function requireClient(client: SupabaseClient | null): SupabaseClient {
  if (!client) throw new Error('Supabase browser configuration is unavailable.')
  return client
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
