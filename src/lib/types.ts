export type Side = 'buy' | 'sell'

export interface AuthResponse {
  userId: string
  email: string
  username: string
  displayName: string
  token: string
  refreshToken: string
  expiresAt: string
}

export interface Card {
  id: string
  name: string
  overall: number
  position: string
  club: string
  rarity: string
  externalRef: string
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface Trade {
  id: string
  cardId: string
  cardName: string
  type: Side
  price: number
  quantity: number
  calculatedProfit: number
  executedAt: string
}

export interface OpenPosition {
  cardId: string
  cardName: string
  quantity: number
}

export interface Dashboard {
  totalProfit: number
  bestTradeProfit: number | null
  worstTradeProfit: number | null
  openPositionsCount: number
  openPositions: OpenPosition[]
}

export interface WatchlistItem {
  id: string
  cardId: string
  cardName: string
  overall: number
  position: string
  club: string
  rarity: string
  targetBuyPrice: number
  targetSellPrice: number
  createdAt: string
  lastPrice: number | null
  priceChange24h: number | null
  priceChangePercent24h: number | null
  distanceToBuy: number | null
  distanceToSell: number | null
}

export interface AlertEvent {
  id: string
  cardId: string
  cardName: string
  kind: Side
  triggeredPrice: number
  createdAt: string
  readAt: string | null
}

export interface PricePoint {
  id: string
  cardId: string
  price: number
  source: 'manual' | 'simulated'
  recordedAt: string
}

export interface SessionUser {
  id: string
  email: string
  username: string
  displayName: string
}

export interface Session {
  token: string
  refreshToken: string
  expiresAt: string
  user: SessionUser
  remember: boolean
}

export interface RegisterInput {
  email: string
  password: string
  username: string
  displayName: string
}

export interface TradeInput {
  cardId: string
  type: Side
  price: number
  quantity: number
}
