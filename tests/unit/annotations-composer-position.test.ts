import { describe, expect, it } from 'vitest'
import { composerPosition } from '../../app/lib/annotations/composer-position'

const viewport = { width: 1280, height: 800 }

describe('composerPosition', () => {
  it('returns the desired point when it fits', () => {
    expect(composerPosition({ desired: { x: 100, y: 200 }, viewport, container: null }))
      .toEqual({ left: 100, top: 200 })
  })
  it('clamps the right edge so the popover never clips (336px footprint)', () => {
    const { left } = composerPosition({ desired: { x: 1200, y: 200 }, viewport, container: null })
    expect(left).toBe(1280 - 336)
  })
  it('clamps the bottom edge with the 260px footprint', () => {
    const { top } = composerPosition({ desired: { x: 100, y: 780 }, viewport, container: null })
    expect(top).toBe(800 - 260)
  })
  it('respects a containing block and converts into its coordinate space', () => {
    const container = { left: 100, top: 50, right: 700, bottom: 600 }
    const pos = composerPosition({ desired: { x: 690, y: 590 }, viewport, container })
    expect(pos.left).toBe(700 - 336 - 100)
    expect(pos.top).toBe(600 - 260 - 50)
  })
})
