const BASE   = 'https://api.dhan.co/v2'
const TOKEN  = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzc5NzMyNzQ5LCJpYXQiOjE3Nzk2NDYzNDksInRva2VuQ29uc3VtZXJUeXBlIjoiU0VMRiIsIndlYmhvb2tVcmwiOiIiLCJkaGFuQ2xpZW50SWQiOiIxMTAyMTQxMzg5In0.ZR_s8i7_5NRT9X1UAofv3Q16HJGVCMoOTMy1TvqzydxuwzmQRWBT9Kvf12YYHOJmAytUu4kZqyWcCXzb5MIH1Q'   // paste your token
const CLIENT = '1102141389'    // paste your client id

const H = {
  'Content-Type': 'application/json',
  'access-token': TOKEN,
  'client-id':    CLIENT,
}

export const SYMBOLS = [
  { label:'NIFTY 50',   scrip:13,  seg:'IDX_I', lot:65  },
  { label:'BANKNIFTY',  scrip:25,  seg:'IDX_I', lot:30  },
  { label:'FINNIFTY',   scrip:27,  seg:'IDX_I', lot:60  },
  { label:'MIDCPNIFTY', scrip:442, seg:'IDX_I', lot:120 },
  { label:'SENSEX',     scrip:51,  seg:'IDX_I', lot:20  },
]

export async function getExpiries(scrip, seg) {
  const r = await fetch(`${BASE}/optionchain/expirylist`, {
    method:'POST', headers:H,
    body: JSON.stringify({ securityId:String(scrip), exchangeSegment:seg })
  })
  return r.json()
}

export async function getChain(scrip, seg, expiry) {
  const r = await fetch(`${BASE}/optionchain`, {
    method:'POST', headers:H,
    body: JSON.stringify({ securityId:String(scrip), exchangeSegment:seg, expiryDate:expiry })
  })
  return r.json()
}

export async function getLTP(securityIds, segment) {
  const body = { [segment]: securityIds.map(Number) }
  const r = await fetch(`${BASE}/marketfeed/ltp`, {
    method:'POST', headers:H,
    body: JSON.stringify(body)
  })
  return r.json()
}