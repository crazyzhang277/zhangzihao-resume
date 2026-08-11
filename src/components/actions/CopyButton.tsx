import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

type CopyButtonProps = {
  label: string
  value: string
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const field = document.createElement('textarea')
  field.value = value
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  field.select()
  const copied = document.execCommand('copy')
  field.remove()
  if (!copied) throw new Error('Copy is unavailable')
}

export function CopyButton({ label, value }: CopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  async function handleCopy() {
    try {
      await copyText(value)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const statusText = status === 'success' ? 'Copied' : status === 'error' ? 'Copy failed' : ''

  return (
    <span className="copy-action">
      <button className="icon-text-button" onClick={handleCopy} type="button">
        {status === 'success' ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
        {label}
      </button>
      <span aria-live="polite" className="action-status">{statusText}</span>
    </span>
  )
}
