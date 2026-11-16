import { parseUtc } from './format'
import type { PricePoint, Trade } from './types'

export const FEE_RATE = 0.05
export const NET_RATE = 1 - FEE_RATE

const byTime = (a: Trade, b: Trade) => parseUtc(a.executedAt).getTime() - parseUtc(b.executedAt).getTime()

export interface Position {
  cardId: string
  cardName: string
  quantity: number
  avgCost: number
}

/** open positions with their average buy price (same average the backend uses) */
export function computePositions(trades: Trade[]): Position[] {
  const map = new Map<string, { name: string; bought: number; spent: number; sold: number }>()
  for (const t of trades) {
    const p = map.get(t.cardId) ?? { name: t.cardName, bought: 0, spent: 0, sold: 0 }
    if (t.type === 'buy') {
      p.bought += t.quantity
      p.spent += t.price * t.quantity
    } else {
      p.sold += t.quantity
    }
    map.set(t.cardId, p)
  }
  const out: Position[] = []
  for (const [cardId, p] of map) {
    const quantity = p.bought - p.sold
    if (quantity > 0) out.push({ cardId, cardName: p.name, quantity, avgCost: p.spent / p.bought })
  }
  return out.sort((a, b) => a.cardName.localeCompare(b.cardName))
}

export interface SellRow {
  trade: Trade
  buyAvg: number
  fee: number
  returnPct: number
}

export function completedRows(trades: Trade[]): SellRow[] {
  return trades
    .filter((t) => t.type === 'sell')
    .sort((a, b) => byTime(b, a))
    .map((trade) => {
      const buyAvg = trade.price * NET_RATE - trade.calculatedProfit / trade.quantity
      const cost = buyAvg * trade.quantity
      return {
        trade,
        buyAvg,
        fee: trade.price * trade.quantity * FEE_RATE,
        returnPct: cost > 0 ? (trade.calculatedProfit / cost) * 100 : 0,
      }
    })
}

export interface ProfitPoint {
  date: Date
  value: number
}

/** cumulative profit */
export function cumulativeProfit(trades: Trade[]): ProfitPoint[] {
  const sells = trades.filter((t) => t.type === 'sell').sort(byTime)
  const days = new Map<string, ProfitPoint>()
  let total = 0
  for (const t of sells) {
    total += t.calculatedProfit
    const d = parseUtc(t.executedAt)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    days.set(key, { date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), value: total })
  }
  return [...days.values()]
}

export interface PriceStats {
  last: number
  change: number | null
  changePct: number | null
  min: number
  max: number
  spark: number[]
}

/** summarize price history */
export function priceStats(points: PricePoint[]): PriceStats | null {
  if (!points.length) return null
  const sorted = [...points].sort((a, b) => parseUtc(a.recordedAt).getTime() - parseUtc(b.recordedAt).getTime())
  const lastPoint = sorted[sorted.length - 1]
  const dayAgo = parseUtc(lastPoint.recordedAt).getTime() - 24 * 3600 * 1000
  const older = sorted.filter((p) => parseUtc(p.recordedAt).getTime() <= dayAgo)
  const ref = older.length ? older[older.length - 1] : sorted.length > 1 ? sorted[0] : null
  const prices = sorted.map((p) => p.price)
  const change = ref ? lastPoint.price - ref.price : null
  return {
    last: lastPoint.price,
    change,
    changePct: ref && ref.price > 0 && change !== null ? (change / ref.price) * 100 : null,
    min: Math.min(...prices),
    max: Math.max(...prices),
    spark: prices.slice(-24),
  }
}
