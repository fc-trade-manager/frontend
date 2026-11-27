import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from './api'
import { priceStats, type PriceStats } from './derive'
import type { Card } from './types'

export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false })
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({ data: null, error: e instanceof Error ? e.message : 'Something went wrong.', loading: false })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

export interface PriceResult {
  stats: PriceStats | null
  /** HTTP status */
  failed?: number
}

const TTL = 60_000
const priceCache = new Map<string, { at: number; value: Promise<PriceResult> }>()

export function loadPrice(cardId: string): Promise<PriceResult> {
  const hit = priceCache.get(cardId)
  if (hit && Date.now() - hit.at < TTL) return hit.value
  const value = api
    .prices(cardId, '30d')
    .then((points): PriceResult => ({ stats: priceStats(points) }))
    .catch((e: unknown): PriceResult => ({ stats: null, failed: e instanceof ApiError ? e.status : 0 }))
  priceCache.set(cardId, { at: Date.now(), value })
  // failures (401, network error...) must not stay cached: the next call should try again
  void value.then((r) => {
    if (r.failed !== undefined && priceCache.get(cardId)?.value === value) priceCache.delete(cardId)
  })
  return value
}

export function invalidatePrices(): void {
  priceCache.clear()
}

export function usePrices(cardIds: string[]) {
  const key = cardIds.join(',')
  const [prices, setPrices] = useState<Record<string, PriceResult>>({})
  const [loading, setLoading] = useState(cardIds.length > 0)

  useEffect(() => {
    let cancelled = false
    if (!cardIds.length) {
      setPrices({})
      setLoading(false)
      return
    }
    setLoading(true)
    void Promise.all(cardIds.map(async (id) => [id, await loadPrice(id)] as const)).then((entries) => {
      if (cancelled) return
      setPrices(Object.fromEntries(entries))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { prices, loading }
}

// cards

const cardCache = new Map<string, Promise<Card | null>>()

export function loadCard(id: string): Promise<Card | null> {
  let hit = cardCache.get(id)
  if (!hit) {
    hit = api.card(id).catch(() => null)
    cardCache.set(id, hit)
  }
  return hit
}

export function useCardMeta(ids: string[]) {
  const key = [...new Set(ids)].sort().join(',')
  const [cards, setCards] = useState<Record<string, Card>>({})

  useEffect(() => {
    let cancelled = false
    const unique = key ? key.split(',') : []
    void Promise.all(unique.map(async (id) => [id, await loadCard(id)] as const)).then((entries) => {
      if (cancelled) return
      const next: Record<string, Card> = {}
      for (const [id, card] of entries) if (card) next[id] = card
      setCards(next)
    })
    return () => {
      cancelled = true
    }
  }, [key])

  return cards
}

// alerts badge

export const ALERTS_EVENT = 'fc:alerts'

export function useUnreadAlerts(): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      api
        .alerts()
        .then((list) => {
          if (!cancelled) setCount(list.filter((a) => !a.readAt).length)
        })
        .catch(() => { })
    }
    refresh()
    const id = setInterval(refresh, 60_000)
    window.addEventListener(ALERTS_EVENT, refresh)
    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener(ALERTS_EVENT, refresh)
    }
  }, [])
  return count
}
