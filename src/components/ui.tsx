import { X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { Side } from '../lib/types'

export function Logo({ compact = false }: { compact?: boolean }) {
  const [failed, setFailed] = useState(false)
  const src = compact ? '/brand/logo-compact.png' : '/brand/logo-full.png'
  if (!failed) {
    return <img className={compact ? 'logo logo--compact' : 'logo'} src={src} alt="FC Trade Manager" onError={() => setFailed(true)} />
  }
  return (
    <span className="logo-text">
      <span className="logo-text__mark">FC</span>
      {!compact && <span className="logo-text__name">Trade Manager</span>}
    </span>
  )
}

// display pieces

export function rarityKey(rarity: string): 'gold' | 'icon' | 'hero' {
  const r = rarity.toLowerCase()
  return r.includes('icon') ? 'icon' : r.includes('hero') ? 'hero' : 'gold'
}

export function RatingChip({ overall, rarity }: { overall: number; rarity: string }) {
  return <span className={`rating rating--${rarityKey(rarity)}`}>{overall}</span>
}

export function SideBadge({ side }: { side: Side }) {
  return <span className={`badge badge--${side}`}>{side === 'buy' ? 'Buy' : 'Sell'}</span>
}

export function Delta({ value, text }: { value: number | null; text: string }) {
  if (value === null) return <span className="muted">—</span>
  const tone = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  return <span className={`delta delta--${tone} mono`}>{text}</span>
}

export function Sparkline({ values, width = 96, height = 32 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return <span className="muted">—</span>
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * (width - 2) + 1).toFixed(1)},${(height - 3 - ((v - min) / span) * (height - 6)).toFixed(1)}`)
    .join(' ')
  const tone = values[values.length - 1] >= values[0] ? 'up' : 'down'
  return (
    <svg className={`spark spark--${tone}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={pts} fill="none" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function MetricCard({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'up' | 'down' }) {
  return (
    <div className="card metric">
      <span className="metric__label">{label}</span>
      <span className={`metric__value mono${tone ? ` metric__value--${tone}` : ''}`}>{value}</span>
      {sub && <span className="metric__sub">{sub}</span>}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  )
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="state state--loading">{label}</div>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="state">
      <strong>{title}</strong>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  )
}

// forms

export function Field({ label, error, hint, children }: { label: string; error?: string | null; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  )
}

export function FormError({ message }: { message: string | null }) {
  return message ? (
    <div className="form-error" role="alert">
      {message}
    </div>
  ) : null
}

// modal

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// pagination

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="pagination">
      <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="muted">
        Page {page} of {totalPages}
      </span>
      <button type="button" className="btn btn--ghost btn--sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  )
}
