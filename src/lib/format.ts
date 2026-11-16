const intFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const num = (n: number): string => intFmt.format(Math.round(n))

export function signed(n: number): string {
  const r = Math.round(n)
  if (r === 0) return '0'
  return `${r > 0 ? '+' : '−'}${intFmt.format(Math.abs(r))}`
}

export function pct(n: number, withSign = true): string {
  const text = Math.abs(n).toFixed(1)
  if (!withSign || Number(text) === 0) return `${text}%`
  return `${n > 0 ? '+' : '−'}${text}%`
}

/** API sends UTC datetimes; make sure a missing 'Z' is not read as local time. */
export function parseUtc(iso: string): Date {
  return new Date(/(?:[zZ]|[+-]\d\d:?\d\d)$/.test(iso) ? iso : `${iso}Z`)
}

const two = (n: number) => String(n).padStart(2, '0')

export function dateText(d: Date): string {
  return `${two(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function timeText(d: Date): string {
  return `${two(d.getHours())}:${two(d.getMinutes())}`
}

export const fmtDate = (iso: string): string => dateText(parseUtc(iso))
export const fmtDateTime = (iso: string): string => {
  const d = parseUtc(iso)
  return `${dateText(d)}, ${timeText(d)}`
}

export function fullNow(d: Date): string {
  return `${DAYS[d.getDay()]}, ${dateText(d)} · ${timeText(d)}`
}

export function relative(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - parseUtc(iso).getTime())
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'yesterday' : `${d} days ago`
}

export const toneOf = (n: number): 'up' | 'down' | 'flat' => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat')
