import { clearSession, loadSession, notifySession, saveSession, sessionFromAuth } from './session'
import type {
  AlertEvent,
  AuthResponse,
  Card,
  Dashboard,
  PageResult,
  PricePoint,
  RegisterInput,
  Trade,
  TradeInput,
  WatchlistItem,
} from './types'

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:5041'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const NETWORK_MESSAGE = 'Could not reach the server. Check that the API is running and that CORS allows this origin.'

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as {
      message?: string
      title?: string
      errors?: Record<string, string[]>
    }
    if (body.message) return body.message
    if (body.errors) {
      const messages = Object.values(body.errors).flat()
      if (messages.length) return messages.join(' ')
    }
    if (body.title) return body.title
  } catch {
    /* body was empty or not JSON */
  }
  return `Request failed (${res.status}).`
}

// single flight refresh to avoid multiple refreshes at once
let refreshing: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  const session = loadSession()
  if (!session) return false
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        })
        if (!res.ok) {
          clearSession()
          notifySession()
          return false
        }
        saveSession(sessionFromAuth((await res.json()) as AuthResponse, session.remember))
        notifySession()
        return true
      } catch {
        return false
      } finally {
        refreshing = null
      }
    })()
  }
  return refreshing
}

interface RequestOptions {
  method?: string
  body?: unknown
  // sends the refresh token when there is one, and tries to refresh the session if the request fails with 401
  auth?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options

  const send = () => {
    const headers: Record<string, string> = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const session = loadSession()
    if (auth && session) headers.Authorization = `Bearer ${session.token}`
    return fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  let res: Response
  try {
    res = await send()
  } catch {
    throw new ApiError(0, NETWORK_MESSAGE)
  }

  if (res.status === 401 && auth && loadSession() && (await refreshSession())) {
    try {
      res = await send()
    } catch {
      throw new ApiError(0, NETWORK_MESSAGE)
    }
  }

  if (!res.ok) throw new ApiError(res.status, await readError(res))
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export interface CardQuery {
  name?: string
  rarity?: string
  position?: string
  overall?: number
  page?: number
  pageSize?: number
}

export const api = {
  // auth
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (input: RegisterInput) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: input, auth: false }),
  logout: (refreshToken: string) =>
    request<void>('/api/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }),

  // cards and prices
  cards: (params: CardQuery) => request<PageResult<Card>>(`/api/cards${query({ ...params })}`),
  card: (id: string) => request<Card>(`/api/cards/${id}`),
  prices: (cardId: string, period: '24h' | '7d' | '30d') =>
    request<PricePoint[]>(`/api/cards/${cardId}/prices?period=${period}`),
  addPrice: (cardId: string, price: number) =>
    request<PricePoint>(`/api/cards/${cardId}/prices`, { method: 'POST', body: { price } }),

  // trades and dashboard
  trades: () => request<Trade[]>('/api/trades'),
  addTrade: (input: TradeInput) => request<Trade>('/api/trades', { method: 'POST', body: input }),
  updateTrade: (id: string, input: TradeInput) =>
    request<Trade>(`/api/trades/${id}`, { method: 'PUT', body: input }),
  deleteTrade: (id: string) => request<void>(`/api/trades/${id}`, { method: 'DELETE' }),
  dashboard: () => request<Dashboard>('/api/dashboard'),

  // watchlist
  watchlist: () => request<WatchlistItem[]>('/api/watchlist'),
  addToWatchlist: (cardId: string, targetBuyPrice: number, targetSellPrice: number) =>
    request<WatchlistItem>('/api/watchlist', {
      method: 'POST',
      body: { cardId, targetBuyPrice, targetSellPrice },
    }),
  updateWatchlist: (id: string, buyTarget: number, sellTarget: number) =>
    request<WatchlistItem>(`/api/watchlist/${id}`, { method: 'PUT', body: { buyTarget, sellTarget } }),
  removeFromWatchlist: (id: string) => request<void>(`/api/watchlist/${id}`, { method: 'DELETE' }),

  // alerts
  alerts: () => request<AlertEvent[]>('/api/alerts'),
  markAlertRead: (id: string) => request<void>(`/api/alerts/${id}/read`, { method: 'POST' }),
}
