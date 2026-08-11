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

export function isResumeContent(value: unknown): value is ResumeContent {
  if (!isRecord(value)) return false
  return isProfile(value.profile)
    && isArrayOf(value.impact, isImpactMetric)
    && isArrayOf(value.experience, isExperience)
    && isArrayOf(value.sop, isSopStep)
    && isArrayOf(value.projects, isPortfolioProject)
    && isArrayOf(value.skills, isSkillGroup)
    && isArrayOf(value.education, isEducation)
    && isArrayOf(value.awards, isAward)
    && isPrintContent(value.print)
}

function mapResumeRecord(record: unknown): ResumeContent | null {
  if (isResumeContent(record)) return record
  return isRecord(record) && isResumeContent(record.content) ? record.content : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isArrayOf(value: unknown, guard: (item: unknown) => boolean): boolean {
  return Array.isArray(value) && value.every(guard)
}

function hasStrings(value: unknown, keys: string[]): value is Record<string, unknown> {
  return isRecord(value) && keys.every((key) => typeof value[key] === 'string')
}

function isProfile(value: unknown): boolean {
  return hasStrings(value, ['name', 'englishName', 'birth', 'location', 'phone', 'email', 'status', 'github', 'bio'])
    && isArrayOf(value.targetRoles, (role) => typeof role === 'string')
}

function isImpactMetric(value: unknown): boolean {
  return hasStrings(value, ['number', 'unit', 'title', 'subtitle', 'description'])
}

function isExperience(value: unknown): boolean {
  return hasStrings(value, ['company', 'department', 'role', 'period', 'status'])
    && isRecord(value)
    && isArrayOf(value.duties, (duty) => hasStrings(duty, ['title', 'description']))
}

function isSopStep(value: unknown): boolean {
  return hasStrings(value, ['title', 'description'])
}

function isPortfolioProject(value: unknown): boolean {
  return hasStrings(value, ['id', 'title', 'category', 'role', 'metrics', 'description'])
    && isRecord(value)
    && isArrayOf(value.tags, (tag) => typeof tag === 'string')
    && isArrayOf(value.highlights, (highlight) => typeof highlight === 'string')
    && isOptionalString(value, 'githubUrl')
    && isOptionalString(value, 'portfolioUrl')
    && isOptionalString(value, 'portfolioPass')
}

function isSkillGroup(value: unknown): boolean {
  return hasStrings(value, ['name'])
    && isRecord(value)
    && isArrayOf(value.skills, (skill) => hasStrings(skill, ['name', 'tag']))
}

function isEducation(value: unknown): boolean {
  return hasStrings(value, ['school', 'major', 'period'])
    && isRecord(value)
    && isArrayOf(value.courses, (course) => typeof course === 'string')
}

function isAward(value: unknown): boolean {
  return hasStrings(value, ['title', 'level', 'field', 'date', 'description'])
}

function isPrintContent(value: unknown): boolean {
  return isRecord(value) && value.pageSize === 'A4 portrait' && value.pageCount === 1
}

function isOptionalString(value: Record<string, unknown>, key: string): boolean {
  return !(key in value) || typeof value[key] === 'string'
}
