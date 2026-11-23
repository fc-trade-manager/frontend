import { describe, expect, it } from 'vitest'
import { num, parseUtc, pct, relative, signed } from './format'

describe('format', () => {
  it('formats numbers, signed values and percentages', () => {
    expect(num(1234567)).toBe('1,234,567')
    expect(signed(800)).toBe('+800')
    expect(signed(-150)).toBe('−150')
    expect(signed(0)).toBe('0')
    expect(pct(10)).toBe('+10.0%')
    expect(pct(-9.09)).toBe('−9.1%')
    expect(pct(0)).toBe('0.0%')
  })

  it('reads API dates as UTC even when the Z is missing', () => {
    const withZ = parseUtc('2026-01-01T10:00:00Z').getTime()

    expect(parseUtc('2026-01-01T10:00:00').getTime()).toBe(withZ)
    expect(parseUtc('2026-01-01T07:00:00-03:00').getTime()).toBe(withZ)
  })

  it('describes how long ago something happened', () => {
    const now = Date.parse('2026-01-10T12:00:00Z')
    const ago = (ms: number) => new Date(now - ms).toISOString()

    expect(relative(ago(20_000), now)).toBe('just now')
    expect(relative(ago(5 * 60_000), now)).toBe('5 min ago')
    expect(relative(ago(3 * 3_600_000), now)).toBe('3 h ago')
    expect(relative(ago(30 * 3_600_000), now)).toBe('yesterday')
    expect(relative(ago(4 * 86_400_000), now)).toBe('4 days ago')
  })
})
