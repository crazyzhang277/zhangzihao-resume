import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PublicResume } from '../src/App'

const sectionIds = [
  'hero',
  'impact',
  'experience',
  'projects',
  'skills',
  'education',
  'contact',
]

describe('public resume visual shell', () => {
  it('keeps every landmark and its decorative flow field available with reduced motion', () => {
    render(<PublicResume reducedMotion />)

    for (const id of sectionIds) {
      expect(document.getElementById(id)).toBeVisible()
    }

    expect(screen.getByTestId('chromatic-flow-field')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('heading', { name: 'Zhang Zihao AIGC Resume' })).toBeVisible()
  })
})
