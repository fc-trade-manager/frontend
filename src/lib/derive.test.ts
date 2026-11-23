import { describe, expect, it } from 'vitest'
import { completedRows, computePositions, cumulativeProfit, priceStats } from './derive'
import type { PricePoint, Trade } from './types'

let seq = 0
function trade(p: Partial<Trade> & Pick<Trade, 'type' | 'price' | 'quantity' | 'executedAt'>): Trade {
  return { id: `t${seq++}`, cardId: 'c1', cardName: 'Pelé', calculatedProfit: 0, ...p }
}

const point = (price: number, recordedAt: string): PricePoint => ({ id: `p${price}`, cardId: 'c1', price, source: 'manual', recordedAt })

describe('derive', () => {
  it('computes open positions with the average buy price and hides sold-out cards', () => {
    const trades = [
      trade({ type: 'buy', price: 1000, quantity: 2, executedAt: '2026-01-01T10:00:00Z' }),
      trade({ type: 'buy', price: 1300, quantity: 1, executedAt: '2026-01-01T11:00:00Z' }),
      trade({ type: 'sell', price: 2000, quantity: 1, executedAt: '2026-01-01T12:00:00Z', calculatedProfit: 800 }),
      // a second card that was fully sold
      trade({ cardId: 'c2', cardName: 'Zico', type: 'buy', price: 500, quantity: 1, executedAt: '2026-01-01T10:00:00Z' }),
      trade({ cardId: 'c2', cardName: 'Zico', type: 'sell', price: 900, quantity: 1, executedAt: '2026-01-01T11:00:00Z' }),
    ]

    const positions = computePositions(trades)

    expect(positions).toHaveLength(1)
    expect(positions[0]).toMatchObject({ cardId: 'c1', quantity: 2 })
    expect(positions[0].avgCost).toBeCloseTo(1100) // (1000*2 + 1300) / 3
  })

  it('derives the average buy, fee and return of a sale from the backend profit', () => {
    const sale = trade({ type: 'sell', price: 2000, quantity: 1, executedAt: '2026-01-01T12:00:00Z', calculatedProfit: 800 })

    const [row] = completedRows([sale])

    expect(row.buyAvg).toBeCloseTo(1100) // 2000 * 0.95 - 800
    expect(row.fee).toBeCloseTo(100) // 5% of 2000
    expect(row.returnPct).toBeCloseTo(72.73, 1) // 800 / 1100
  })

  it('accumulates the profit of sales and groups them by day', () => {
    const trades = [
      trade({ type: 'sell', price: 2000, quantity: 1, executedAt: '2026-01-01T09:00:00Z', calculatedProfit: 800 }),
      trade({ type: 'sell', price: 1000, quantity: 1, executedAt: '2026-01-01T15:00:00Z', calculatedProfit: -150 }),
      trade({ type: 'sell', price: 3000, quantity: 1, executedAt: '2026-01-05T15:00:00Z', calculatedProfit: 500 }),
      trade({ type: 'buy', price: 1000, quantity: 1, executedAt: '2026-01-02T09:00:00Z' }), // buys are ignored
    ]

    const points = cumulativeProfit(trades)

    expect(points.map((p) => p.value)).toEqual([650, 1150])
  })

  it('summarizes a price history against the price from 24h earlier (and handles empty or single prices)', () => {
    const stats = priceStats([
      point(1200, '2026-01-02T12:00:00Z'), // out of order on purpose
      point(1000, '2026-01-01T10:00:00Z'), // older than 24h before the last point
      point(1100, '2026-01-02T06:00:00Z'),
    ])

    expect(stats).toMatchObject({ last: 1200, change: 200, min: 1000, max: 1200, spark: [1000, 1100, 1200] })
    expect(stats?.changePct).toBeCloseTo(20)

    // edge cases: no prices, and a single price (nothing to compare with)
    expect(priceStats([])).toBeNull()
    expect(priceStats([point(1000, '2026-01-02T12:00:00Z')])).toMatchObject({ last: 1000, change: null, changePct: null })
  })
})
