import { useEffect, useState } from 'react'

import { AdminContentForm } from './AdminContentForm'
import { AdminProjects } from './AdminProjects'
import { createAdminRepository, type AdminRepository, type AdminSession, type SyncRunResult, type SyncRun } from '../../lib/adminRepository'
import type { Project, ResumeContent } from '../../types/content'

type AdminPageProps = { repository?: AdminRepository }
type PageState = 'loading' | 'unconfigured' | 'unauthenticated' | 'forbidden' | 'error' | 'ready'

export function AdminPage({ repository }: AdminPageProps) {
  const activeRepo = repository ?? createAdminRepository()
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
      if (!activeRepo.isConfigured) {
        if (isCurrent()) setPageState('unconfigured')
        return
      }
      setPageState('loading')
      try {
        const session = sessionFromEvent === undefined ? await activeRepo.getSession() : sessionFromEvent
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
          activeRepo.getResume(),
          activeRepo.getProjects(),
          activeRepo.getLatestSyncRun(),
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

    const unsubscribe = activeRepo.isConfigured
      ? activeRepo.subscribeToAuthStateChange((session) => { void load(session) })
      : () => undefined
    void load()
    return () => {
      active = false
      unsubscribe()
    }
  }, [activeRepo])

  async function saveResume(content: ResumeContent) {
    await activeRepo.saveResume(content)
    setResume(content)
  }

  async function runSync() {
    setIsSyncing(true)
    setSyncResult(null)
    try {
      const result = await activeRepo.triggerGitHubSync()
      setSyncResult(result)
      if (result.status === 'success') {
        const [loadedProjects, loadedSync] = await Promise.all([activeRepo.getProjects(), activeRepo.getLatestSyncRun()])
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
  if (pageState === 'unauthenticated') return <AdminLoginForm onSignIn={activeRepo.signIn} />
  if (pageState === 'forbidden') return <AdminLoginForm forbidden onSignIn={activeRepo.signIn} />
  if (pageState === 'error') return <StatePage heading="Unable to load administration" message={loadError ?? 'The owner data could not be loaded.'} />
  if (!resume) return null

  return (
    <main aria-label="Resume administration" className="admin-page">
      <header className="admin-page__header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">Owner workspace</p>
            <h1>Resume administration</h1>
            <p>Changes are authorized by Supabase Row Level Security.</p>
          </div>
          <button className="icon-text-button" onClick={() => void activeRepo.signOut()} type="button">Sign out</button>
        </div>
      </header>
      <section className="admin-sync" aria-labelledby="admin-sync-heading">
        <div><h2 id="admin-sync-heading">GitHub synchronization</h2><p>{latestSync ? `Last completed: ${new Date(latestSync.finishedAt).toLocaleString()}` : 'No completed sync run has been recorded.'}</p></div>
        <button className="admin-button" disabled={isSyncing} onClick={() => void runSync()} type="button">{isSyncing ? 'Syncing GitHub...' : 'Run GitHub sync'}</button>
        <SyncStatus result={syncResult ?? latestSync} />
      </section>
      <AdminContentForm content={resume} onSave={saveResume} />
      <AdminProjects onSaveSettings={activeRepo.saveProjectSettings} projects={projects} />
    </main>
  )
}

function AdminLoginForm({ onSignIn, forbidden }: { onSignIn: (email: string, pass: string) => Promise<void>; forbidden?: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSignIn(email, password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main aria-label="Resume administration" className="admin-page admin-page--state">
      <h1>{forbidden ? 'Owner access required' : 'Sign in required'}</h1>
      <p>{forbidden ? 'This account does not have the owner claim required by the content policy.' : 'Sign in through Supabase with an owner account to manage resume content.'}</p>
      <form className="admin-content-form" onSubmit={(e) => void handleSubmit(e)} style={{ border: 'none', padding: 0 }}>
        <label>
          Email address
          <input onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />
        </label>
        <label>
          Password
          <input onChange={(e) => setPassword(e.target.value)} required type="password" value={password} />
        </label>
        {error ? <p className="admin-feedback admin-feedback--error" role="alert">{error}</p> : null}
        <button className="admin-button" disabled={loading} type="submit">{loading ? 'Signing in...' : 'Sign In as Owner'}</button>
      </form>
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
