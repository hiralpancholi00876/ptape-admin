import type { Option } from '../types'

// Seconds -> "HH:MM:SS", or "MM:SS" when under an hour.
export function formatDuration(seconds: number | string) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const h = Math.floor(total / 3600)
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`
}

// 1500 -> "1.5K", 2000000 -> "2M".
export function compactNumber(num: number) {
  if (num < 1e3) return String(num)

  const suffixes = ['', 'K', 'M', 'B', 'T']
  const magnitude = Math.min(Math.floor(Math.log10(num) / 3), suffixes.length - 1)
  const scaled = num / Math.pow(1000, magnitude)
  return (scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1)) + suffixes[magnitude]
}

const TIME_UNITS = [
  { label: 'year', seconds: 31536000 },
  { label: 'month', seconds: 2592000 },
  { label: 'day', seconds: 86400 },
  { label: 'hour', seconds: 3600 },
  { label: 'minute', seconds: 60 },
  { label: 'second', seconds: 1 },
]

export function timeAgo(dateString?: string) {
  if (!dateString) return 'Just now'
  const diffInSeconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)

  for (const unit of TIME_UNITS) {
    const value = Math.floor(diffInSeconds / unit.seconds)
    if (value > 0) {
      return `${value} ${unit.label}${value !== 1 ? 's' : ''} ago`
    }
  }
  return 'Just now'
}

const pad = (n: number) => String(n).padStart(2, '0')

const numberFormat = new Intl.NumberFormat()

export function formatNumber(n: number) {
  return numberFormat.format(n)
}

// Local datetime -> UTC "YYYY-MM-DD HH:mm:ss" for the API.
export function toUTC(datetime: string) {
  const d = new Date(datetime)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

// UTC datetime -> local "YYYY-MM-DDTHH:MM" for datetime-local inputs.
export function toLocal(utc: string | Date) {
  const d = new Date(utc)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Names -> react-select options.
export function toOptions(names: string[] = []): Option[] {
  return names.map((name) => ({ value: name, label: name }))
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const letters =
    parts.length === 1 ? parts[0].charAt(0) : parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  return letters.toUpperCase()
}

// Stable tint for an initial tile, picked from the name.
const TINTS = [
  'from-royal-violet to-indigo-bloom',
  'from-indigo-bloom to-slate-blue',
  'from-slate-blue to-cloudy-sky',
  'from-cloudy-sky to-fresh-sky',
  'from-fresh-sky to-sky-surge',
  'from-sky-surge to-pearl-aqua',
]

export function tintFromName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TINTS[Math.abs(hash) % TINTS.length]
}

export function newId() {
  return crypto.randomUUID()
}

export const NO_THUMBNAIL_IMAGE =
  'https://media.istockphoto.com/id/1147544806/vector/no-thumbnail-image-vector-graphic.jpg'
