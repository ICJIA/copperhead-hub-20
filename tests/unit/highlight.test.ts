import { describe, expect, it } from 'vitest'
import { segmentText } from '../../app/utils/highlight'

describe('segmentText', () => {
  it('marks case-insensitive matches', () => {
    expect(segmentText('Youth Deflection in Illinois', 'deflection')).toEqual([
      { text: 'Youth ', hit: false },
      { text: 'Deflection', hit: true },
      { text: ' in Illinois', hit: false },
    ])
  })

  it('marks multiple occurrences', () => {
    const segments = segmentText('data on data quality', 'data')
    expect(segments.filter(s => s.hit)).toHaveLength(2)
    expect(segments.map(s => s.text).join('')).toBe('data on data quality')
  })

  it('returns the whole text unmarked for an empty term', () => {
    expect(segmentText('Some title', '  ')).toEqual([{ text: 'Some title', hit: false }])
  })

  it('handles a match at the start and end', () => {
    expect(segmentText('crime and crime', 'crime')).toEqual([
      { text: 'crime', hit: true },
      { text: ' and ', hit: false },
      { text: 'crime', hit: true },
    ])
  })

  it('reassembles to the original text always', () => {
    const text = 'Recidivism Outcomes of Illinois Prison Work Release'
    expect(segmentText(text, 'prison').map(s => s.text).join('')).toBe(text)
  })
})
