import { useEffect, useState } from 'react'

import { AdminContentForm } from './AdminContentForm'
import { AdminProjects } from './AdminProjects'
import { createAdminRepository, type AdminRepository, type AdminSession, type SyncRunResult, type SyncRun } from '../../lib/adminRepository'
import type { Project, ResumeContent } from '../../types/content'

const defaultRepository = createAdminRepository()

type AdminPageProps = { repository?: AdminRepository }
type PageState = 'loading' | 'unconfigured' | 'unauthenticated' | 'forbidden' | 'error' | 'ready'

export function AdminPage({ repository = defaultRepository }: AdminPageProps) {
  const [pageState, setPageState] = useState<PageState>('loading')
  const [resume, setResume] = useState<ResumeContent | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [latestSync, setLatestSync] = useState<SyncRun | null>(null)
  const [syncResult, setSyncResult] = useState<SyncRunResult | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    let active = true
    let loadVersion = 0

    function clearOwnerState() {
      setResume(null)
      setProjects([])
      setLatestSync(null)
      setSyncResult(null)
      setLoadError(null)
      setIsSyncing(false)
    }

    async function load(sessionFromEvent?: AdminSession | null) {
      const currentLoad = ++loadVersion
      const isCurrent = () => active && currentLoad === loadVersion
      clearOwnerState()
      if (!repository.isConfigured) {
        if (isCurrent()) setPageState('unconfigured')
        return
      }
      setPageState('loading')
      try {
        const session = sessionFromEvent === undefined ? await repository.getSession() : sessionFromEvent
        if (!isCurrent()) return
        if (!session) {
          setPageState('unauthenticated')
          return
        }
        if (session.appMetadata.role !== 'owner') {
          setPageState('forbidden')
          return
        }
        const [loadedResume, loadedProjects, loadedSync] = await Promise.all([
          repository.getResume(),
          repository.getProjects(),
          repository.getLatestSyncRun(),
        ])
        if (!isCurrent()) return
        setResume(loadedResume)
        setProjects(loadedProjects)
        setLatestSync(loadedSync)
        setPageState('ready')
      } catch (caught) {
        if (!isCurrent()) return
        setLoadError(message(caught))
        setPageState('error')
      }
    }

    const unsubscribe = repository.isConfigured
      ? repository.subscribeToAuthStateChange((session) => { void load(session) })
      : () => undefined
    void load()
    return () => {
      active = false
      unsubscribe()
    }
  }, [repository])

  async function saveResume(content: ResumeContent) {
    await repository.saveResume(content)
    setResume(content)
  }

  async function runSync() {
    setIsSyncing(true)
    setSyncResult(null)
    try {
      const result = await repository.triggerGitHubSync()
      setSyncResult(result)
      if (result.status === 'success') {
        const [loadedProjects, loadedSync] = await Promise.all([repository.getProjects(), repository.getLatestSyncRun()])
        setProjects(loadedProjects)
        setLatestSync(loadedSync)
      }
    } catch (caught) {
      setSyncResult({ status: 'error', fetched: 0, written: 0, filtered: 0, error: message(caught) })
    } finally {
      setIsSyncing(false)
    }
  }

  if (pageState === 'loading') return <main className="admin-page" aria-busy="true"><p>Checking administrator access...</p></main>
  if (pageState === 'unconfigured') return <StatePage heading="Admin is unavailable" message="Supabase browser configuration is required before administration can be used." />
  if (pageState === 'unauthenticated') return <StatePage heading="Sign in required" message="Sign in through Supabase with an owner account to manage resume content." />
  if (pageState === 'forbidden') return <StatePage heading="Owner access required" message="This account does not have the owner claim required by the content policy." />
  if (pageState === 'error') return <StatePage heading="Unable to load administration" message={loadError ?? 'The owner data could not be loaded.'} />
  if (!resume) return null

  return (
    <main aria-label="Resume administration" className="admin-page">
      <header className="admin-page__header"><p className="eyebrow">Owner workspace</p><h1>Resume administration</h1><p>Changes are authorized by Supabase Row Level Security.</p></header>
      <section className="admin-sync" aria-labelledby="admin-sync-heading">
        <div><h2 id="admin-sync-heading">GitHub synchronization</h2><p>{latestSync ? `Last completed: ${new Date(latestSync.finishedAt).toLocaleString()}` : 'No completed sync run has been recorded.'}</p></div>
        <button className="admin-button" disabled={isSyncing} onClick={() => void runSync()} type="button">{isSyncing ? 'Syncing GitHub...' : 'Run GitHub sync'}</button>
        <SyncStatus result={syncResult ?? latestSync} />
      </section>
      <AdminContentForm content={resume} onSave={saveResume} />
      <AdminProjects onSaveSettings={repository.saveProjectSettings} projects={projects} />
    </main>
  )
}

function StatePage({ heading, message }: { heading: string; message: string }) {
  return <main aria-label="Resume administration" className="admin-page admin-page--state"><h1>{heading}</h1><p>{message}</p></main>
}

function SyncStatus({ result }: { result: SyncRunResult | SyncRun | null }) {
  if (!result) return null
  return (
    <div className={result.status === 'error' ? 'admin-sync__result admin-sync__result--error' : 'admin-sync__result'}>
      {result.status === 'success' ? <p role="status">Sync completed successfully.</p> : <p role="alert">{result.error ?? 'GitHub sync failed.'}</p>}
      <p>Fetched: {result.fetched}</p><p>Written: {result.written}</p><p>Filtered: {result.filtered}</p>
    </div>
  )
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'The request could not be completed.'
}
