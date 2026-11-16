import { Link } from 'react-router-dom'
import ProfitChart from '../components/ProfitChart'
import { Delta, EmptyState, ErrorState, Loading, MetricCard, PageHeader, SideBadge } from '../components/ui'
import { api } from '../lib/api'
import { completedRows, computePositions, cumulativeProfit, NET_RATE } from '../lib/derive'
import { fmtDate, num, pct, signed, parseUtc } from '../lib/format'
import { useAsync, usePrices } from '../lib/hooks'

export default function Dashboard() {
  const { data, error, loading, reload } = useAsync(async () => {
    const [dashboard, trades] = await Promise.all([api.dashboard(), api.trades()])
    return { dashboard, trades }
  }, [])

  const positions = data ? computePositions(data.trades) : []
  const { prices } = usePrices(positions.map((p) => p.cardId))

  if (loading && !data) return <Loading />
  if (error || !data) return <ErrorState message={error ?? 'Could not load the dashboard.'} onRetry={reload} />

  const { dashboard, trades } = data
  const invested = positions.reduce((sum, p) => sum + p.avgCost * p.quantity, 0)
  const recent = [...trades].sort((a, b) => parseUtc(b.executedAt).getTime() - parseUtc(a.executedAt).getTime()).slice(0, 5)
  const sells = completedRows(trades)
  const wins = sells.filter((s) => s.trade.calculatedProfit > 0).length
  const totalTone = dashboard.totalProfit > 0 ? 'up' : dashboard.totalProfit < 0 ? 'down' : undefined

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your profit and open positions at a glance." />

      <section className="grid grid--4">
        <MetricCard label="Total profit" value={signed(dashboard.totalProfit)} tone={totalTone} sub={sells.length ? `${wins} of ${sells.length} ${sells.length === 1 ? "sale" : "sales"} in profit` : 'No sales yet'} />
        <MetricCard label="Best trade" value={dashboard.bestTradeProfit === null ? '—' : signed(dashboard.bestTradeProfit)} tone={dashboard.bestTradeProfit && dashboard.bestTradeProfit > 0 ? 'up' : undefined} />
        <MetricCard label="Worst trade" value={dashboard.worstTradeProfit === null ? '—' : signed(dashboard.worstTradeProfit)} tone={dashboard.worstTradeProfit && dashboard.worstTradeProfit < 0 ? 'down' : undefined} />
        <MetricCard label="Open positions" value={dashboard.openPositionsCount} sub={invested > 0 ? `${num(invested)} invested` : 'Nothing invested'} />
      </section>

      <section className="card panel">
        <div className="panel__head">
          <h2>Cumulative profit</h2>
          <span className="muted">Realized, after the 5% sale fee</span>
        </div>
        <ProfitChart points={cumulativeProfit(trades)} />
      </section>

      <section className="grid grid--2">
        <div className="card panel">
          <div className="panel__head">
            <h2>Open positions</h2>
            <Link to="/trades">See all</Link>
          </div>
          {!positions.length ? (
            <EmptyState title="No open positions" text="Buy a card to see it here." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Card</th>
                    <th className="num">Qty</th>
                    <th className="num">Avg. buy</th>
                    <th className="num">Potential</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const last = prices[p.cardId]?.stats?.last
                    const potential = last === undefined ? null : last * NET_RATE * p.quantity - p.avgCost * p.quantity
                    return (
                      <tr key={p.cardId}>
                        <td className="strong">{p.cardName}</td>
                        <td className="num mono">{p.quantity}</td>
                        <td className="num mono">{num(p.avgCost)}</td>
                        <td className="num">
                          <Delta value={potential} text={potential === null ? '' : signed(potential)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card panel">
          <div className="panel__head">
            <h2>Recent trades</h2>
            <Link to="/trades">See all</Link>
          </div>
          {!recent.length ? (
            <EmptyState title="No trades yet" text="Register your first trade." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Card</th>
                    <th>Type</th>
                    <th className="num">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id}>
                      <td className="muted">{fmtDate(t.executedAt)}</td>
                      <td className="strong">{t.cardName}</td>
                      <td>
                        <SideBadge side={t.type} />
                      </td>
                      <td className="num">{t.type === 'sell' ? <Delta value={t.calculatedProfit} text={signed(t.calculatedProfit)} /> : <span className="muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sells.length > 0 && <p className="muted panel__foot">Average return per sale: {pct(sells.reduce((s, r) => s + r.returnPct, 0) / sells.length)}</p>}
        </div>
      </section>
    </>
  )
}
