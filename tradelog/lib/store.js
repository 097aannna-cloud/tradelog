import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Auth
  user:       null,
  profile:    null,
  setUser:    u => set({ user: u }),
  setProfile: p => set({ profile: p }),

  // Symbol & chain
  symbol:     null,
  expiry:     '',
  expiries:   [],
  chain:      null,
  spot:       0,
  setSymbol:   s  => set({ symbol: s }),
  setExpiry:   e  => set({ expiry: e }),
  setExpiries: es => set({ expiries: es }),
  setChain:    c  => set({ chain: c, spot: c?.last_price || 0 }),

  // Trades
  openTrades:   [],
  closedTrades: [],
  setOpenTrades:   t => set({ openTrades: t }),
  setClosedTrades: t => set({ closedTrades: t }),
  addTrade: t => set(s => ({ openTrades: [t, ...s.openTrades] })),
  closeTrade: (id, exitPrice, pnl) => set(s => {
    const trade = s.openTrades.find(t => t.id === id)
    if (!trade) return s
    return {
      openTrades:   s.openTrades.filter(t => t.id !== id),
      closedTrades: [{
        ...trade, exit_price: exitPrice,
        pnl, status: 'CLOSED',
        exit_time: new Date().toISOString(),
      }, ...s.closedTrades],
    }
  }),

  // Behavioral tracking (silent data collection)
  sessionId:       null,
  screenStart:     null,
  strikesViewed:   0,
  setSessionId:    id => set({ sessionId: id }),
  startTimer:      ()  => set({ screenStart: Date.now(), strikesViewed: 0 }),
  addStrikeView:   ()  => set(s => ({ strikesViewed: s.strikesViewed + 1 })),
  getScreenSecs:   ()  => Math.round((Date.now() - (get().screenStart || Date.now())) / 1000),
}))