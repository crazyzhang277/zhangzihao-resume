import type { SupabaseClient } from '@supabase/supabase-js'

import { mapProjectRecord, sortProjects } from '../data/github'
import { fallbackProjects, fallbackResume } from '../data/profile'
import type { ContentRepository, Project, ResumeContent } from '../types/content'
import { supabase } from './supabase'

export function createContentRepository(client: SupabaseClient | null = supabase): ContentRepository {
  return {
    async getResume() {
      if (!client) return fallbackResume
      try {
        const { data, error } = await client.from('profile_content').select('*').eq('published', true).maybeSingle()
        const resume = mapResumeRecord(data)
        return error || resume === null ? fallbackResume : resume
      } catch {
        return fallbackResume
      }
    },
    async getProjects() {
      if (!client) return fallbackProjects
      try {
        const { data, error } = await client.from('projects').select('*').eq('visible', true)
          .order('featured_rank', { ascending: true, nullsFirst: false })
          .order('updated_at', { ascending: false })
        if (error || !Array.isArray(data)) return fallbackProjects
        const projects = data
          .filter(isRecord)
          .map(mapProjectRecord)
          .filter((project): project is Project => project !== null && project.visible)
        return sortProjects(projects)
      } catch {
        return fallbackProjects
      }
    },
  }
}

function isResumeContent(value: unknown): value is ResumeContent {
  if (!isRecord(value)) return false
  return isRecord(value.profile)
    && Array.isArray(value.impact)
    && Array.isArray(value.experience)
    && Array.isArray(value.sop)
    && Array.isArray(value.projects)
    && Array.isArray(value.skills)
    && Array.isArray(value.education)
    && Array.isArray(value.awards)
    && isRecord(value.print)
}

function mapResumeRecord(record: unknown): ResumeContent | null {
  if (isResumeContent(record)) return record
  return isRecord(record) && isResumeContent(record.content) ? record.content : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
