import { act, cleanup, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('honors system reduced motion during the initial render', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))

    const markup = renderToStaticMarkup(<PublicResume />)

    expect(markup).toContain('resume-shell is-reduced-motion')
  })

  it('keeps every landmark and its decorative flow field available with reduced motion', () => {
    render(<PublicResume reducedMotion />)

    for (const id of sectionIds) {
      expect(document.getElementById(id)).toBeVisible()
    }

    expect(screen.getByTestId('chromatic-flow-field')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('heading', { name: 'Zhang Zihao AIGC Resume' })).toBeVisible()
  })

  it('updates the accessible progress indicator when the active section changes', () => {
    let observerCallback: IntersectionObserverCallback | undefined

    class TestIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback
      }

      disconnect() {}
      observe() {}
      unobserve() {}
      takeRecords() { return [] }
      root = null
      rootMargin = '0px'
      thresholds = []
    }

    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)
    render(<PublicResume reducedMotion />)

    expect(screen.getByRole('progressbar', { name: 'Section progress: Profile' })).toHaveAttribute('aria-valuenow', '1')

    act(() => {
      observerCallback?.([
        {
          intersectionRatio: 0.8,
          isIntersecting: true,
          target: document.getElementById('projects') as Element,
        } as IntersectionObserverEntry,
      ], {} as IntersectionObserver)
    })

    expect(screen.getByRole('progressbar', { name: 'Section progress: Projects' })).toHaveAttribute('aria-valuenow', '4')
  })
})
