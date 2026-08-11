import { useEffect, useState } from 'react'

import type { ResumeContent } from '../../types/content'

type AdminContentFormProps = {
  content: ResumeContent
  onSave(content: ResumeContent): Promise<void>
}

const structuredFields = [
  ['Impact metrics', 'impact'],
  ['Experience', 'experience'],
  ['SOP steps', 'sop'],
  ['Portfolio projects', 'projects'],
  ['Skills', 'skills'],
  ['Education', 'education'],
  ['Awards', 'awards'],
] as const

export function AdminContentForm({ content, onSave }: AdminContentFormProps) {
  const [draft, setDraft] = useState(content)
  const [structuredContent, setStructuredContent] = useState(() => stringifyContent(content))
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraft(content)
    setStructuredContent(stringifyContent(content))
  }, [content])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStatus(null)
    let nextContent: ResumeContent
    try {
      nextContent = buildContent(draft, structuredContent)
    } catch (caught) {
      setError(message(caught))
      return
    }
    setIsSaving(true)
    try {
      await onSave(nextContent)
      setDraft(nextContent)
      setStatus('Resume content saved.')
    } catch (caught) {
      setError(message(caught))
    } finally {
      setIsSaving(false)
    }
  }

  function setProfileValue(field: keyof ResumeContent['profile'], value: string) {
    setDraft((current) => ({
      ...current,
      profile: { ...current.profile, [field]: field === 'targetRoles' ? value.split(',').map((role) => role.trim()).filter(Boolean) : value },
    }))
  }

  return (
    <form className="admin-content-form" onSubmit={handleSubmit}>
      <header><h2>Resume content</h2><p>Edit profile details and the structured sections that render on the public resume.</p></header>
      <fieldset>
        <legend>Profile</legend>
        <div className="admin-field-grid">
          <label>Name<input onChange={(event) => setProfileValue('name', event.target.value)} required value={draft.profile.name} /></label>
          <label>English name<input onChange={(event) => setProfileValue('englishName', event.target.value)} required value={draft.profile.englishName} /></label>
          <label>Birth<input onChange={(event) => setProfileValue('birth', event.target.value)} required value={draft.profile.birth} /></label>
          <label>Location<input onChange={(event) => setProfileValue('location', event.target.value)} required value={draft.profile.location} /></label>
          <label>Phone<input onChange={(event) => setProfileValue('phone', event.target.value)} required value={draft.profile.phone} /></label>
          <label>Email<input onChange={(event) => setProfileValue('email', event.target.value)} required type="email" value={draft.profile.email} /></label>
          <label>Status<input onChange={(event) => setProfileValue('status', event.target.value)} required value={draft.profile.status} /></label>
          <label>GitHub URL<input onChange={(event) => setProfileValue('github', event.target.value)} required type="url" value={draft.profile.github} /></label>
        </div>
        <label>Target roles (comma separated)<input onChange={(event) => setProfileValue('targetRoles', event.target.value)} value={draft.profile.targetRoles.join(', ')} /></label>
        <label>Biography<textarea onChange={(event) => setProfileValue('bio', event.target.value)} required rows={4} value={draft.profile.bio} /></label>
      </fieldset>
      <section aria-label="Structured resume sections" className="admin-structured-sections">
        {structuredFields.map(([label, field]) => (
          <label key={field}>{label}<textarea aria-describedby={`${field}-help`} aria-label={label} onChange={(event) => setStructuredContent((current) => ({ ...current, [field]: event.target.value }))} rows={8} value={structuredContent[field]} />
            <span id={`${field}-help`}>Use a JSON array. Item order is preserved.</span>
          </label>
        ))}
      </section>
      {error ? <p className="admin-feedback admin-feedback--error" role="alert">{error}</p> : null}
      {status ? <p className="admin-feedback" role="status">{status}</p> : null}
      <button className="admin-button" disabled={isSaving} type="submit">{isSaving ? 'Saving resume content...' : 'Save resume content'}</button>
    </form>
  )
}

type StructuredContent = Record<(typeof structuredFields)[number][1], string>

function stringifyContent(content: ResumeContent): StructuredContent {
  return Object.fromEntries(structuredFields.map(([, field]) => [field, JSON.stringify(content[field], null, 2)])) as StructuredContent
}

function buildContent(draft: ResumeContent, structuredContent: StructuredContent): ResumeContent {
  const parsed = Object.fromEntries(structuredFields.map(([, field]) => [field, parseArray(field, structuredContent[field])]))
  return { ...draft, ...parsed } as ResumeContent
}

function parseArray(label: string, value: string): unknown[] {
  let parsed: unknown
  try { parsed = JSON.parse(value) } catch { throw new Error(`${label} must contain valid JSON.`) }
  if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array.`)
  return parsed
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to save resume content.'
}
