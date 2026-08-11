import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from '../src/App'

describe('App', () => {
  it('renders the public resume heading and section landmarks', () => {
    window.history.replaceState({}, '', '/')

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Zhang Zihao AIGC Resume' })).toBeVisible()
    expect(document.querySelectorAll('main section')).toHaveLength(7)
  })

  it('renders an unconfigured admin state under the admin path', () => {
    window.history.replaceState({}, '', '/admin')

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Admin is unavailable' })).toBeVisible()
    expect(screen.getByText(/supabase browser configuration is required/i)).toBeVisible()
  })
})
