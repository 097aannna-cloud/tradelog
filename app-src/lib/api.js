const BASE = 'https://dhan-option-chain.vercel.app'
const DHAN = 'https://api.dhan.co/v2'

// Dhan credentials — we'll move to env later
let DHAN_TOKEN = ''
let DHAN_CLIENT = ''

export function setDhanCreds(token, clientId) {
  DHAN_TOKEN  = token
  DHAN_CLIENT = clientId
}

async function vercel(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

async function dhan(path, options = {}) {
  const res = await fetch(`${DHAN}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access-token': DHAN_TOKEN,
      'client-id':    DHAN_CLIENT,
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`Dhan ${res.status}`)
  return res.json()
}

export const api = {
  // Trades — via your Vercel backend
  getTrades:   ()     => vercel('/api/trades'),
  createTrade: (body) => vercel('/api/trades',  { method:'POST',  body: JSON.stringify(body) }),
  closeTrade:  (body) => vercel('/api/trades',  { method:'PATCH', body: JSON.stringify(body) }),

  // Market data — direct Dhan API
  getOptionChain: (symbol, expiry) => vercel('/api/optionchain', {
    method: 'POST',
    body: JSON.stringify({ symbol, expiry }),
  }),

  getLtp: (securityIds) => vercel('/api/marketfeed', {
    method: 'POST',
    body: JSON.stringify({ NSE_FNO: securityIds }),
  }),
}