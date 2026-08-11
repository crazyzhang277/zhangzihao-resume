import { act, cleanup, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PublicResume } from '../src/App'
import { ChromaticFlowField } from '../src/components/visual/ChromaticFlowField'

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

  it('initializes the canvas after a compact viewport becomes desktop width', () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>()
    const compactViewport = {
      matches: true,
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    }
    const context = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      createRadialGradient: vi.fn(),
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D

    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(compactViewport as unknown as MediaQueryList))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 })

    render(<ChromaticFlowField reducedMotion={false} />)
    compactViewport.matches = false
    act(() => {
      for (const listener of listeners) listener({ matches: false } as MediaQueryListEvent)
    })

    expect(screen.getByTestId('chromatic-flow-field')).toHaveAttribute('width', '1024')
    expect(screen.getByTestId('chromatic-flow-field')).toHaveAttribute('height', '768')
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
