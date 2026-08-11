# Supabase Content Backend

## Deploy

Install and authenticate the Supabase CLI, then link the target project and apply the migration:

```powershell
supabase link --project-ref <project-ref>
supabase db push
```

Set Edge Function secrets only in Supabase. Do not add them to `src`, a Vite environment file, or source control:

```powershell
supabase secrets set GITHUB_TOKEN=<github-fine-grained-token>
supabase secrets set SUPABASE_URL=<supabase-project-url>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
supabase functions deploy sync-github-projects
```

`GITHUB_TOKEN` needs read access to public repositories. `SUPABASE_SERVICE_ROLE_KEY` is server-only and is used by the function to persist the cache and its run log. The function also accepts an authenticated user only when Supabase Auth has minted an `app_metadata.role` value of `owner`; clients cannot set `app_metadata` themselves. The migration’s RLS policies use the same claim. The service-role key bypasses RLS only inside the Edge Function.

## Daily Sync

Create a Supabase Cron schedule for `sync-github-projects` at `0 2 * * *` (UTC), passing `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` from the scheduler’s server-side secret store. The same function can be called manually by a signed-in owner using their Supabase access token. Leave JWT verification enabled on deployment; the function additionally checks the owner claim or service role before it runs.

The sync uses GitHub pagination, excludes forks, archived repositories, `zeroaigen-auto-mention`, and `project_exclusions`, then calls the owner-only `apply_github_sync` database function. The function atomically upserts GitHub-owned fields and marks missing historical repositories `stale` and `visible = false`; manual visibility, featured rank, and manual title/description fields are preserved. A failed GitHub fetch or database transaction does not alter the last successful project cache.
