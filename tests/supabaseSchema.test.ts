import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/001_initial_schema.sql', 'utf8')

describe('Supabase schema fixture', () => {
  it('defines the project cache, public visibility filters, and permanent exclusion', () => {
    expect(migration).toMatch(/create table public\.projects/i)
    expect(migration).toMatch(/github_id bigint not null unique/i)
    expect(migration).toMatch(/topics text\[\] not null default '\{\}'/i)
    expect(migration).toMatch(/create index projects_visible_idx on public\.projects \(visible\)/i)
    expect(migration).toMatch(/create index projects_featured_rank_idx on public\.projects \(featured_rank\)/i)
    expect(migration).toMatch(/create index projects_updated_at_idx on public\.projects \(updated_at desc\)/i)
    expect(migration).toMatch(/create policy "public can read visible projects"[\s\S]*?using \(visible\)/i)
    expect(migration).toMatch(/create policy "public can read published profile content"[\s\S]*?using \(published\)/i)
    expect(migration).toContain("'zeroaigen-auto-mention'")
    expect(migration).toMatch(/create function public\.apply_github_sync\(p_projects jsonb, p_synced_at timestamptz\)[\s\S]*?on conflict \(github_id\) do update/i)
    expect(migration).toMatch(/revoke all on function public\.apply_github_sync\(jsonb, timestamptz\) from public, anon, authenticated/i)
  })

  it('enables RLS and makes every write policy check the authenticated owner claim', () => {
    for (const table of ['profile_content', 'projects', 'project_exclusions', 'sync_runs']) {
      expect(migration).toMatch(new RegExp(`alter table public\\.${table} enable row level security`, 'i'))
    }

    expect(migration).toMatch(/create function private\.is_content_owner\(\)[\s\S]*?auth\.jwt\(\).*?app_metadata.*?role.*?owner/i)
    expect(migration).toMatch(/create policy "owner can manage profile content"[\s\S]*?using \(private\.is_content_owner\(\)\)[\s\S]*?with check \(private\.is_content_owner\(\)\)/i)
    expect(migration).toMatch(/create policy "owner can manage projects"[\s\S]*?using \(private\.is_content_owner\(\)\)[\s\S]*?with check \(private\.is_content_owner\(\)\)/i)
    expect(migration).toMatch(/create policy "owner can manage exclusions"[\s\S]*?using \(private\.is_content_owner\(\)\)[\s\S]*?with check \(private\.is_content_owner\(\)\)/i)
    expect(migration).toMatch(/create policy "owner can manage sync runs"[\s\S]*?using \(private\.is_content_owner\(\)\)[\s\S]*?with check \(private\.is_content_owner\(\)\)/i)
  })
})
