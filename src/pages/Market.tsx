import { Search } from 'lucide-react'
import { useState } from 'react'
import { Delta, EmptyState, ErrorState, Loading, PageHeader, Pagination, RatingChip, Sparkline } from '../components/ui'
import { api } from '../lib/api'
import { num, pct } from '../lib/format'
import { useAsync, useDebounced, usePrices } from '../lib/hooks'

// catalog filter options
const RARITIES = ['Gold Rare', 'Gold Common', 'Icon', 'Hero']
const POSITIONS = ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'CF', 'ST']
const PAGE_SIZE = 10

export default function Market() {
  const [name, setName] = useState('')
  const [rarity, setRarity] = useState('')
  const [position, setPosition] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(name.trim(), 300)

  const { data, error, loading, reload } = useAsync(
    () => api.cards({ name: q || undefined, rarity: rarity || undefined, position: position || undefined, page, pageSize: PAGE_SIZE }),
    [q, rarity, position, page],
  )
  const { prices } = usePrices(data?.items.map((c) => c.id) ?? [])
  const denied = Object.values(prices).some((p) => p.failed === 401 || p.failed === 403)

  const reset = (fn: () => void) => {
    fn()
    setPage(1)
  }

  return (
    <>
      <PageHeader title="Market" subtitle="Browse the card catalog and current prices." />

      <div className="filters">
        <div className="input-icon filters__search">
          <Search size={16} />
          <input className="input" placeholder="Search by player name" data-testid="market-search" value={name} onChange={(e) => reset(() => setName(e.target.value))} />
        </div>
        <select className="input input--select" value={rarity} onChange={(e) => reset(() => setRarity(e.target.value))} aria-label="Rarity" data-testid="market-rarity">
          <option value="">All rarities</option>
          {RARITIES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select className="input input--select" value={position} onChange={(e) => reset(() => setPosition(e.target.value))} aria-label="Position" data-testid="market-position">
          <option value="">All positions</option>
          {POSITIONS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <span className="muted small">Sorted by name</span>
      </div>

      {denied && <div className="notice" data-testid="market-notice">Prices are not available publicly yet. The catalog is shown without them.</div>}

      {loading && !data ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error ?? 'Could not load the market.'} onRetry={reload} />
      ) : (
        <div className="card">
          {!data.items.length ? (
            <EmptyState title="No cards match your filters" text="Try a different name, rarity or position." />
          ) : (
            <div className="table-wrap">
              <table className="table table--tall" data-testid="market-table">
                <thead>
                  <tr>
                    <th>Card</th>
                    <th>Club</th>
                    <th>Rarity</th>
                    <th className="num">Price</th>
                    <th className="num">24h</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => {
                    const s = prices[c.id]?.stats
                    return (
                      <tr key={c.id} data-testid="market-row" data-card-id={c.id} data-card-name={c.name}>
                        <td>
                          <div className="cell-card">
                            <RatingChip overall={c.overall} rarity={c.rarity} />
                            <div>
                              <div className="strong">{c.name}</div>
                              <div className="muted small">{c.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="muted">{c.club}</td>
                        <td className="muted">{c.rarity}</td>
                        <td className="num mono" data-testid="market-price">{s ? num(s.last) : '—'}</td>
                        <td className="num">
                          <Delta testId="market-change" value={s?.changePct ?? null} text={s?.changePct == null ? '' : pct(s.changePct)} />
                        </td>
                        <td>
                          <Sparkline values={s?.spark ?? []} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
        </div>
      )}
    </>
  )
}
