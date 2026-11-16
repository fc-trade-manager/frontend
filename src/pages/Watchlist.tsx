import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import CardPicker from '../components/CardPicker'
import { Delta, EmptyState, ErrorState, Field, FormError, Loading, Modal, PageHeader, RatingChip, Sparkline } from '../components/ui'
import { api } from '../lib/api'
import { num, pct } from '../lib/format'
import { useAsync, usePrices } from '../lib/hooks'
import type { Card, WatchlistItem } from '../lib/types'

type SortBy = 'name' | 'price' | 'change'

function TargetsModal({ item, onClose, onSaved }: { item: WatchlistItem | null; onClose: () => void; onSaved: () => void }) {
  const [card, setCard] = useState<Card | null>(null)
  const [buy, setBuy] = useState(item ? String(item.targetBuyPrice) : '')
  const [sell, setSell] = useState(item ? String(item.targetSellPrice) : '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const b = Number(buy)
    const s = Number(sell)
    if (!item && !card) return setError('Choose a card.')
    if (!(b > 0) || !(s > 0)) return setError('Enter both target prices.')
    if (b >= s) return setError('The buy target must be lower than the sell target.')
    setBusy(true)
    try {
      if (item) await api.updateWatchlist(item.id, b, s)
      else await api.addToWatchlist(card!.id, b, s)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
      setBusy(false)
    }
  }

  return (
    <Modal title={item ? `Edit targets · ${item.cardName}` : 'Add card to watchlist'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {!item && (
          <Field label="Card">
            <CardPicker value={card} onChange={setCard} />
          </Field>
        )}
        <div className="form__row">
          <Field label="Buy target">
            <input className="input mono" type="number" min={200} max={15000000} step={50} value={buy} onChange={(e) => setBuy(e.target.value)} placeholder="e.g. 80,000" />
          </Field>
          <Field label="Sell target">
            <input className="input mono" type="number" min={200} max={15000000} step={50} value={sell} onChange={(e) => setSell(e.target.value)} placeholder="e.g. 100,000" />
          </Field>
        </div>
        <FormError message={error} />
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Watchlist() {
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [editing, setEditing] = useState<WatchlistItem | 'new' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { data, error, loading, reload } = useAsync(() => api.watchlist(), [])

  const { prices } = usePrices(data?.map((i) => i.cardId) ?? [])

  if (loading && !data) return <Loading />
  if (error || !data) return <ErrorState message={error ?? 'Could not load the watchlist.'} onRetry={reload} />

  const items = [...data].sort((a, b) => {
    if (sortBy === 'price') return (b.lastPrice ?? 0) - (a.lastPrice ?? 0)
    if (sortBy === 'change') return (b.priceChangePercent24h ?? -Infinity) - (a.priceChangePercent24h ?? -Infinity)
    return a.cardName.localeCompare(b.cardName)
  })

  async function remove(item: WatchlistItem) {
    if (!window.confirm(`Remove ${item.cardName} from your watchlist?`)) return
    setActionError(null)
    try {
      await api.removeFromWatchlist(item.id)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not remove the card.')
    }
  }

  return (
    <>
      <PageHeader
        title="Watchlist"
        subtitle="Cards you are tracking, with your buy and sell targets."
        actions={
          <>
            <select className="input input--select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} aria-label="Sort by">
              <option value="name">Sort by name</option>
              <option value="price">Sort by price</option>
              <option value="change">Sort by 24h change</option>
            </select>
            <button className="btn btn--primary" onClick={() => setEditing('new')}>
              <Plus size={16} /> Add card
            </button>
          </>
        }
      />
      <FormError message={actionError} />

      <div className="card">
        {!items.length ? (
          <EmptyState title="Your watchlist is empty" text="Add a card with a buy and a sell target. You will get an alert when the price reaches one of them." />
        ) : (
          <div className="table-wrap">
            <table className="table table--tall">
              <thead>
                <tr>
                  <th>Card</th>
                  <th className="num">Last price</th>
                  <th className="num">24h</th>
                  <th>Trend</th>
                  <th className="num">Buy target</th>
                  <th className="num">To buy</th>
                  <th className="num">Sell target</th>
                  <th className="num">To sell</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const toBuy = i.lastPrice && i.lastPrice > 0 ? ((i.targetBuyPrice - i.lastPrice) / i.lastPrice) * 100 : null
                  const toSell = i.lastPrice && i.lastPrice > 0 ? ((i.targetSellPrice - i.lastPrice) / i.lastPrice) * 100 : null
                  return (
                    <tr key={i.id}>
                      <td>
                        <div className="cell-card">
                          <RatingChip overall={i.overall} rarity={i.rarity} />
                          <div>
                            <div className="strong">{i.cardName}</div>
                            <div className="muted small">
                              {i.position} · {i.club}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="num mono">{i.lastPrice === null ? '—' : num(i.lastPrice)}</td>
                      <td className="num">
                        <Delta value={i.priceChangePercent24h} text={i.priceChangePercent24h === null ? '' : pct(i.priceChangePercent24h)} />
                      </td>
                      <td>
                        <Sparkline values={prices[i.cardId]?.stats?.spark ?? []} />
                      </td>
                      <td className="num mono">{num(i.targetBuyPrice)}</td>
                      <td className="num mono">{toBuy === null ? '—' : pct(toBuy)}</td>
                      <td className="num mono">{num(i.targetSellPrice)}</td>
                      <td className="num mono">{toSell === null ? '—' : pct(toSell)}</td>
                      <td className="actions">
                        <button className="icon-btn" aria-label={`Edit targets for ${i.cardName}`} onClick={() => setEditing(i)}>
                          <Pencil size={16} />
                        </button>
                        <button className="icon-btn icon-btn--danger" aria-label={`Remove ${i.cardName}`} onClick={() => remove(i)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <TargetsModal
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </>
  )
}
