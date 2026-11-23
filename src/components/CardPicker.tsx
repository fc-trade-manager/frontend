import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useDebounced } from '../lib/hooks'
import type { Card } from '../lib/types'
import { RatingChip } from './ui'

interface Props {
  value: Card | null
  onChange: (card: Card | null) => void
  disabled?: boolean
}

/** searches for cards */
export default function CardPicker({ value, onChange, disabled }: Props) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Card[]>([])
  const [failed, setFailed] = useState(false)
  const q = useDebounced(text.trim(), 250)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    api
      .cards({ name: q || undefined, pageSize: 8 })
      .then((r) => {
        if (cancelled) return
        setResults(r.items)
        setFailed(false)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [q, open])

  if (value) {
    return (
      <div className="picked" data-testid="card-picker-selected">
        <RatingChip overall={value.overall} rarity={value.rarity} />
        <span className="picked__name">{value.name}</span>
        <span className="muted">
          {value.position} · {value.club}
        </span>
        {!disabled && (
          <button type="button" className="icon-btn" aria-label="Choose another card" data-testid="card-picker-clear" onClick={() => onChange(null)}>
            <X size={16} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="picker">
      <div className="input-icon">
        <Search size={16} />
        <input
          className="input"
          placeholder="Search a card by name"
          data-testid="card-picker-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          disabled={disabled}
        />
      </div>
      {open && (
        <ul className="picker__list card" data-testid="card-picker-list">
          {failed && <li className="picker__empty" data-testid="card-picker-error">Could not load cards.</li>}
          {!failed && !results.length && <li className="picker__empty" data-testid="card-picker-empty">No cards found.</li>}
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="picker__item"
                data-testid="card-picker-option"
                data-card-name={c.name}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c)
                  setText('')
                  setOpen(false)
                }}
              >
                <RatingChip overall={c.overall} rarity={c.rarity} />
                <span>{c.name}</span>
                <span className="muted">
                  {c.position} · {c.club}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
