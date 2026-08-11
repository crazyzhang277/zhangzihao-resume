import { ArrowDown, MapPin } from 'lucide-react'

import { CopyButton } from '../actions/CopyButton'
import type { Profile } from '../../types/content'

export function HeroSection({ profile }: { profile: Profile }) {
  return (
    <div className="hero-section">
      <p className="eyebrow">AIGC creator and production engineer</p>
      <h1 id="hero-heading">Zhang Zihao AIGC Resume</h1>
      <div className="hero-section__identity">
        <p className="hero-section__name">{profile.name} / {profile.englishName}</p>
        <p><MapPin aria-hidden="true" size={16} /> {profile.location} · {profile.status}</p>
        <p>Born {profile.birth}</p>
      </div>
      <p className="hero-section__bio">{profile.bio}</p>
      <ul aria-label="Target roles" className="tag-list">
        {profile.targetRoles.map((role) => <li key={role}>{role}</li>)}
      </ul>
      <div className="action-row">
        <a className="icon-text-button" href="#projects"><ArrowDown aria-hidden="true" size={16} /> View project work</a>
        <CopyButton label="Copy email" value={profile.email} />
      </div>
    </div>
  )
}
