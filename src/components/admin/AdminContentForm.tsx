import { useEffect, useState } from 'react'

import { isResumeContent } from '../../lib/contentRepository'
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
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraft(content)
  }, [content])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStatus(null)
    let nextContent: ResumeContent
    try {
      nextContent = buildContent(draft)
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
          <fieldset aria-label={label} key={field}>
            <legend>{label}</legend>
            {(draft[field] as unknown[]).map((item, index) => (
              <fieldset className="admin-structured-item" key={`${field}-${index}`}>
                <legend>{label} {index + 1}</legend>
                <StructuredValueEditor onChange={(nextValue) => updateStructuredValue(field, index, nextValue, setDraft)} prefix={`${label} ${index + 1}`} value={item} />
              </fieldset>
            ))}
          </fieldset>
        ))}
      </section>
      {error ? <p className="admin-feedback admin-feedback--error" role="alert">{error}</p> : null}
      {status ? <p className="admin-feedback" role="status">{status}</p> : null}
      <button className="admin-button" disabled={isSaving} type="submit">{isSaving ? 'Saving resume content...' : 'Save resume content'}</button>
    </form>
  )
}

function buildContent(draft: ResumeContent): ResumeContent {
  if (!isResumeContent(draft)) throw new Error('Resume content is invalid.')
  return draft
}

function updateStructuredValue(
  field: (typeof structuredFields)[number][1],
  index: number,
  nextValue: unknown,
  setDraft: React.Dispatch<React.SetStateAction<ResumeContent>>,
) {
  setDraft((current) => ({
    ...current,
    [field]: (current[field] as unknown[]).map((item, itemIndex) => itemIndex === index ? nextValue : item),
  }) as ResumeContent)
}

function StructuredValueEditor({ value, onChange, prefix = '' }: { value: unknown; onChange: (value: unknown) => void; prefix?: string }) {
  if (Array.isArray(value)) {
    return <div className="admin-structured-array">{value.map((item, index) => <fieldset className="admin-structured-nested" key={index}><legend>Item {index + 1}</legend><StructuredValueEditor onChange={(nextValue) => onChange(value.map((current, itemIndex) => itemIndex === index ? nextValue : current))} prefix={prefix} value={item} /></fieldset>)}</div>
  }

  if (isRecord(value)) {
    return <div className="admin-structured-fields">{Object.entries(value).map(([key, child]) => {
      const fieldLabel = [prefix, formatFieldLabel(key)].filter(Boolean).join(' ')
      return <label key={key}>{fieldLabel}<StructuredValueEditor onChange={(nextValue) => onChange({ ...value, [key]: nextValue })} prefix={fieldLabel} value={child} /></label>
    })}</div>
  }

  if (typeof value === 'string') {
    return value.length > 80
      ? <textarea onChange={(event) => onChange(event.target.value)} rows={4} value={value} />
      : <input onChange={(event) => onChange(event.target.value)} value={value} />
  }

  if (typeof value === 'number') return <input onChange={(event) => onChange(Number(event.target.value))} type="number" value={value} />
  if (typeof value === 'boolean') return <input checked={value} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatFieldLabel(value: string): string {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase())
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to save resume content.'
}
