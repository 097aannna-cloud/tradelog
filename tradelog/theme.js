export const C = {
  bg:       '#0A0B0D',
  surface:  '#111318',
  elevated: '#1A1D24',
  border:   '#252830',
  borderHi: '#363A45',

  text:     '#F0F2F5',
  textSec:  '#8B90A0',
  textTer:  '#565B6B',

  green:    '#22C55E',
  red:      '#EF4444',
  amber:    '#F59E0B',
  blue:     '#3B82F6',
  purple:   '#8B5CF6',
}

export const R = { sm:4, md:8, lg:12, xl:16, full:999 }
export const S = { xs:4, sm:8, md:12, lg:16, xl:24 }

export function fmtR(n) {
  if (!n && n !== 0) return '–'
  const abs = Math.abs(n)
  const str = abs >= 100000 ? (abs/100000).toFixed(1)+'L'
    : abs >= 1000 ? (abs/1000).toFixed(1)+'K'
    : abs.toFixed(0)
  return (n < 0 ? '–₹' : '₹') + str
}

export function fmtN(n, d=2) {
  if (!n && n !== 0) return '–'
  return Number(n).toFixed(d)
}