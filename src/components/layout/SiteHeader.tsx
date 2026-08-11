import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { SectionNav, type SectionLink } from './SectionNav'

type SiteHeaderProps = {
  sections: SectionLink[]
  activeSection: string
}

export function SiteHeader({ sections, activeSection }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <a className="site-header__brand" href="#hero">ZZH</a>
      <button
        aria-controls="section-navigation"
        aria-expanded={menuOpen}
        className="site-header__menu"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        <span className="sr-only">{menuOpen ? 'Close navigation' : 'Open navigation'}</span>
      </button>
      <div className={menuOpen ? 'site-header__navigation is-open' : 'site-header__navigation'}>
        <SectionNav activeSection={activeSection} onNavigate={() => setMenuOpen(false)} sections={sections} />
      </div>
    </header>
  )
}
