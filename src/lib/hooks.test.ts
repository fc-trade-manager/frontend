import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './api'
import { invalidatePrices, loadPrice } from './hooks'

const point = (price: number) => ({ id: 'p', cardId: 'c1', price, source: 'manual' as const, recordedAt: '2026-01-01T10:00:00Z' })

describe('loadPrice cache', () => {
  beforeEach(() => {
    invalidatePrices()
    vi.restoreAllMocks()
  })

  it('does not keep a failed request in the cache', async () => {
    const spy = vi
      .spyOn(api, 'prices')
      .mockRejectedValueOnce(new ApiError(401, 'Unauthorized'))
      .mockResolvedValueOnce([point(1000)])

    const first = await loadPrice('c1')
    expect(first.failed).toBe(401)

    const second = await loadPrice('c1')
    expect(second.failed).toBeUndefined()
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('reuses a successful result within the TTL', async () => {
    const spy = vi.spyOn(api, 'prices').mockResolvedValue([point(1000)])
    await loadPrice('c1')
    await loadPrice('c1')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('invalidatePrices forces a new request', async () => {
    const spy = vi.spyOn(api, 'prices').mockResolvedValue([point(1000)])
    await loadPrice('c1')
    invalidatePrices()
    await loadPrice('c1')
    expect(spy).toHaveBeenCalledTimes(2)
  })
})