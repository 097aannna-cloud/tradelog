export const LOT_SIZE = {
  'NIFTY 50': 65,
  'BANKNIFTY': 30,
  'FINNIFTY': 60,
  'MIDCPNIFTY': 120,
  'SENSEX': 20,
  'BANKEX': 15,
}

export function calcPnl(trade, ltp) {
  if (!ltp) return 0
  const diff = trade.action === 'BUY'
    ? ltp - trade.entryPrice
    : trade.entryPrice - ltp
  return Math.round(diff * trade.qty * 100) / 100
}

export function calcHoldTime(entryTime) {
  const mins = Math.floor((Date.now() - new Date(entryTime)) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export function isMarketOpen() {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const h = ist.getHours(), m = ist.getMinutes()
  const total = h * 60 + m
  const day = ist.getDay()
  if (day === 0 || day === 6) return false
  return total >= 555 && total <= 930
}