import { Github, Mail, Phone, Printer } from 'lucide-react'
import { useState } from 'react'

import { CopyButton } from '../actions/CopyButton'
import type { Profile } from '../../types/content'

export function ContactSection({ profile }: { profile: Profile }) {
  const [printStatus, setPrintStatus] = useState('')

  function printResume() {
    try {
      window.print()
      setPrintStatus('Print dialog opened')
    } catch {
      setPrintStatus('Print is unavailable')
    }
  }

  return (
    <div className="contact-section">
      <p className="contact-section__prompt">Available for AIGC production and creative technology roles.</p>
      <address className="contact-links">
        <a href={`mailto:${profile.email}`}><Mail aria-hidden="true" size={18} /> {profile.email}</a>
        <a href={`tel:${profile.phone}`}><Phone aria-hidden="true" size={18} /> {profile.phone}</a>
        <a href={profile.github} rel="noreferrer" target="_blank"><Github aria-hidden="true" size={18} /> GitHub</a>
      </address>
      <div className="action-row">
        <CopyButton label="Copy email" value={profile.email} />
        <CopyButton label="Copy phone" value={profile.phone} />
        <button className="icon-text-button" onClick={printResume} type="button"><Printer aria-hidden="true" size={16} /> Print resume</button>
        <span aria-live="polite" className="action-status">{printStatus}</span>
      </div>
    </div>
  )
}
