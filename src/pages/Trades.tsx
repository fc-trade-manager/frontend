import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import CardPicker from '../components/CardPicker'
import { Delta, EmptyState, ErrorState, Field, FormError, Loading, Modal, PageHeader, SideBadge } from '../components/ui'
import { api } from '../lib/api'
import { completedRows, computePositions, NET_RATE } from '../lib/derive'
import { dateText, fmtDate, num, parseUtc, pct, signed } from '../lib/format'
import { loadCard, useAsync, usePrices } from '../lib/hooks'
import type { Card, Side, Trade } from '../lib/types'

type Tab = 'completed' | 'open' | 'all'

function TradeForm({ trade, onDone, onCancel }: { trade?: Trade; onDone: () => void; onCancel?: () => void }) {
  const [side, setSide] = useState<Side>(trade?.type ?? 'buy')
  const [card, setCard] = useState<Card | null>(null)
  const [price, setPrice] = useState(trade ? String(trade.price) : '')
  const [qty, setQty] = useState(trade ? String(trade.quantity) : '1')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // When editing, resolve the card so the picker can show it.
  useEffect(() => {
    if (trade) void loadCard(trade.cardId).then((c) => c && setCard(c))
  }, [trade])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const p = Number(price)
    const q = Number(qty)
    if (!card && !trade) return setError('Choose a card.')
    if (!Number.isFinite(p) || p < 200 || p > 15_000_000) return setError('Price must be between 200 and 15,000,000.')
    if (!Number.isInteger(q) || q < 1 || q > 100) return setError('Quantity must be a whole number between 1 and 100.')
    setBusy(true)
    try {
      const input = { cardId: card?.id ?? trade!.cardId, type: side, price: p, quantity: q }
      if (trade) await api.updateTrade(trade.id, input)
      else await api.addTrade(input)
      setPrice('')
      setQty('1')
      setCard(null)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the trade.')
    } finally {
      setBusy(false)
    }
  }

  const [today] = useState(() => dateText(new Date()))
  const total = Number(price) * Number(qty)
  return (
    <form className="form" onSubmit={submit}>
      <div className="segmented" role="group" aria-label="Trade type">
        <button type="button" className={side === 'buy' ? 'is-active' : ''} onClick={() => setSide('buy')}>
          Buy
        </button>
        <button type="button" className={side === 'sell' ? 'is-active' : ''} onClick={() => setSide('sell')}>
          Sell
        </button>
      </div>
      <Field label="Card">
        <CardPicker value={card} onChange={setCard} disabled={!!trade} />
      </Field>
      <div className="form__row">
        <Field label="Price (per card)">
          <input className="input mono" type="number" min={200} max={15000000} step={50} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 48,000" />
        </Field>
        <Field label="Quantity">
          <input className="input mono" type="number" min={1} max={100} step={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
      </div>
      <Field label="Date" hint="Trades are recorded with the current date and time.">
        <input className="input" value={today} disabled readOnly />
      </Field>
      {total > 0 && Number.isFinite(total) && (
        <p className="muted small">
          {side === 'buy' ? 'Total cost' : 'After the 5% fee you receive'}: <span className="mono strong">{num(side === 'buy' ? total : total * NET_RATE)}</span>
        </p>
      )}
      <FormError message={error} />
      <div className="form__actions">
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="btn btn--primary" disabled={busy}>
          {busy ? 'Saving…' : trade ? 'Save changes' : `Register ${side}`}
        </button>
      </div>
    </form>
  )
}

export default function Trades() {
  const [tab, setTab] = useState<Tab>('completed')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Trade | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { data: trades, error, loading, reload } = useAsync(() => api.trades(), [])

  const positions = trades ? computePositions(trades) : []
  const { prices } = usePrices(positions.map((p) => p.cardId))

  if (loading && !trades) return <Loading />
  if (error || !trades) return <ErrorState message={error ?? 'Could not load your trades.'} onRetry={reload} />

  const rows = completedRows(trades)
  const all = [...trades].sort((a, b) => parseUtc(b.executedAt).getTime() - parseUtc(a.executedAt).getTime())

  async function remove(t: Trade) {
    if (!window.confirm(`Delete this ${t.type} of ${t.cardName}? Your profit will be recalculated.`)) return
    setActionError(null)
    try {
      await api.deleteTrade(t.id)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete the trade.')
    }
  }

  const rowActions = (t: Trade) => (
    <td className="actions">
      <button className="icon-btn" aria-label="Edit trade" onClick={() => setEditing(t)}>
        <Pencil size={16} />
      </button>
      <button className="icon-btn icon-btn--danger" aria-label="Delete trade" onClick={() => remove(t)}>
        <Trash2 size={16} />
      </button>
    </td>
  )

  return (
    <>
      <PageHeader
        title="Trades"
        subtitle="Every buy and sale, with profit after the 5% fee."
        actions={
          <button className="btn btn--primary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={16} /> New trade
          </button>
        }
      />

      {showForm && (
        <div className="card panel panel--form">
          <h2>New trade</h2>
          <TradeForm
            onDone={() => {
              setShowForm(false)
              reload()
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
      <FormError message={actionError} />

      <div className="tabs" role="tablist">
        {(
          [
            ['completed', 'Completed'],
            ['open', 'Open'],
            ['all', 'All trades'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'completed' &&
          (!rows.length ? (
            <EmptyState title="No completed trades" text="A trade is completed once you sell a card you bought." />
          ) : (
            <div className="table-wrap">
              <table className="table table--tall">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Card</th>
                    <th className="num">Qty</th>
                    <th className="num">Avg. buy</th>
                    <th className="num">Sell price</th>
                    <th className="num">Fee (5%)</th>
                    <th className="num">Profit</th>
                    <th className="num">Return</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ trade: t, buyAvg, fee, returnPct }) => (
                    <tr key={t.id}>
                      <td className="muted">{fmtDate(t.executedAt)}</td>
                      <td className="strong">{t.cardName}</td>
                      <td className="num mono">{t.quantity}</td>
                      <td className="num mono">{num(buyAvg)}</td>
                      <td className="num mono">{num(t.price)}</td>
                      <td className="num mono">{num(fee)}</td>
                      <td className="num">
                        <Delta value={t.calculatedProfit} text={signed(t.calculatedProfit)} />
                      </td>
                      <td className="num">
                        <Delta value={returnPct} text={pct(returnPct)} />
                      </td>
                      {rowActions(t)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === 'open' &&
          (!positions.length ? (
            <EmptyState title="No open positions" text="Cards you bought and have not sold yet appear here." />
          ) : (
            <div className="table-wrap">
              <table className="table table--tall">
                <thead>
                  <tr>
                    <th>Card</th>
                    <th className="num">Qty</th>
                    <th className="num">Avg. buy</th>
                    <th className="num">Last price</th>
                    <th className="num">Market value</th>
                    <th className="num">After fee</th>
                    <th className="num">Potential result</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const last = prices[p.cardId]?.stats?.last ?? null
                    const market = last === null ? null : last * p.quantity
                    const after = market === null ? null : market * NET_RATE
                    const potential = after === null ? null : after - p.avgCost * p.quantity
                    return (
                      <tr key={p.cardId}>
                        <td className="strong">{p.cardName}</td>
                        <td className="num mono">{p.quantity}</td>
                        <td className="num mono">{num(p.avgCost)}</td>
                        <td className="num mono">{last === null ? '—' : num(last)}</td>
                        <td className="num mono">{market === null ? '—' : num(market)}</td>
                        <td className="num mono">{after === null ? '—' : num(after)}</td>
                        <td className="num">
                          <Delta value={potential} text={potential === null ? '' : signed(potential)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}

        {tab === 'all' &&
          (!all.length ? (
            <EmptyState title="No trades yet" text="Use “New trade” to register your first buy." />
          ) : (
            <div className="table-wrap">
              <table className="table table--tall">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Card</th>
                    <th>Type</th>
                    <th className="num">Qty</th>
                    <th className="num">Price</th>
                    <th className="num">Profit</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {all.map((t) => (
                    <tr key={t.id}>
                      <td className="muted">{fmtDate(t.executedAt)}</td>
                      <td className="strong">{t.cardName}</td>
                      <td>
                        <SideBadge side={t.type} />
                      </td>
                      <td className="num mono">{t.quantity}</td>
                      <td className="num mono">{num(t.price)}</td>
                      <td className="num">{t.type === 'sell' ? <Delta value={t.calculatedProfit} text={signed(t.calculatedProfit)} /> : <span className="muted">—</span>}</td>
                      {rowActions(t)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>

      {editing && (
        <Modal title="Edit trade" onClose={() => setEditing(null)}>
          <TradeForm
            trade={editing}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null)
              reload()
            }}
          />
        </Modal>
      )}
    </>
  )
}
