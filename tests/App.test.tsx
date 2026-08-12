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

  it('renders an admin state under the admin path', async () => {
    window.history.replaceState({}, '', '/admin')

    render(<App />)

    expect(await screen.findByRole('heading', { name: /(Sign in required|Admin is unavailable)/i })).toBeVisible()
  })
})
