import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { calcPnl, calcHoldTime, isMarketOpen } from '../lib/calc'

const C = {
  bg:      '#0A0B0D',
  surface: '#111318',
  elevated:'#1A1D24',
  border:  '#252830',
  amber:   '#F59E0B',
  muted:   '#8B90A0',
  text:    '#F0F2F5',
  green:   '#22C55E',
  red:     '#EF4444',
  blue:    '#3B82F6',
}

export default function HomeScreen() {
  const [trades, setTrades]       = useState([])
  const [ltpMap, setLtpMap]       = useState({})
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [closeId, setCloseId]     = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    loadTrades()
    return () => clearInterval(pollRef.current)
  }, [])

  async function loadTrades() {
    try {
      const data = await api.getTrades()
      setTrades(data.trades || data || [])
    } catch(e) {}
    setLoading(false)
    setRefreshing(false)
    startPoll()
  }

  function startPoll() {
    clearInterval(pollRef.current)
    if (!isMarketOpen()) return
    pollRef.current = setInterval(fetchLtp, 10000)
  }

  async function fetchLtp() {
    const open = trades.filter(t => t.status === 'OPEN' && t.securityId)
    if (!open.length) return
    try {
      const ids = open.map(t => parseInt(t.securityId))
      const res = await api.getLtp(ids)
      const map = {}
      open.forEach(t => {
        const d = res.data?.NSE_FNO?.[t.securityId]
               || res.data?.NSE_FNO?.[parseInt(t.securityId)]
        if (d) map[t.securityId] = d.last_price
      })
      setLtpMap(map)
    } catch(e) {}
  }

  const open   = trades.filter(t => t.status === 'OPEN')
  const closed = trades.filter(t => t.status === 'CLOSED')
  const totalPnl = closed.reduce((s, t) => s + (t.pnl || 0), 0)
  const wins   = closed.filter(t => (t.pnl || 0) > 0).length
  const winRate = closed.length ? Math.round(wins / closed.length * 100) : 0

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>DHAN CHAIN</Text>
        <Text style={[s.headerPnl, { color: totalPnl >= 0 ? C.green : C.red }]}>
          {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN')}
        </Text>
      </View>

      <View style={s.statsRow}>
        <StatChip label="Open" value={open.length} />
        <StatChip label="Win Rate" value={`${winRate}%`} />
        <StatChip label="Closed" value={closed.length} />
        <StatChip label="Total P&L" value={`₹${Math.round(totalPnl).toLocaleString('en-IN')}`} color={totalPnl >= 0 ? C.green : C.red} />
      </View>

      {loading
        ? <ActivityIndicator color={C.amber} style={{ marginTop: 40 }} />
        : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTrades() }} tintColor={C.amber} />}
          contentContainerStyle={{ padding: 12 }}
        >
          {open.length > 0 && <Text style={s.sectionLabel}>OPEN POSITIONS</Text>}
          {open.map(t => (
            <TradeCard
              key={t.id}
              trade={t}
              ltp={ltpMap[t.securityId]}
              onClose={() => setCloseId(t.id)}
            />
          ))}

          {closed.length > 0 && <Text style={s.sectionLabel}>CLOSED</Text>}
          {closed.map(t => (
            <TradeCard key={t.id} trade={t} closed />
          ))}

          {!open.length && !closed.length && (
            <Text style={s.empty}>No trades yet.{'\n'}Go to Trade tab to start.</Text>
          )}
        </ScrollView>
      )}
    </View>
  )
}

function StatChip({ label, value, color }) {
  return (
    <View style={s.chip}>
      <Text style={s.chipLabel}>{label}</Text>
      <Text style={[s.chipVal, color ? { color } : {}]}>{value}</Text>
    </View>
  )
}

function TradeCard({ trade: t, ltp, onClose, closed }) {
  const pnl = closed ? (t.pnl || 0) : calcPnl(t, ltp)
  const pnlColor = pnl > 0 ? C.green : pnl < 0 ? C.red : C.muted
  const typeColor = t.type === 'CE' ? C.blue : t.type === 'PE' ? C.red : C.amber

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <View style={[s.badge, { borderColor: typeColor }]}>
            <Text style={[s.badgeText, { color: typeColor }]}>{t.type}</Text>
          </View>
          <Text style={s.cardSymbol}>{t.symbolName}</Text>
          <View style={[s.badge, { borderColor: t.action === 'BUY' ? C.green : C.red }]}>
            <Text style={[s.badgeText, { color: t.action === 'BUY' ? C.green : C.red }]}>{t.action}</Text>
          </View>
        </View>
        <Text style={[s.pnl, { color: pnlColor }]}>
          {pnl >= 0 ? '+' : ''}₹{Math.round(pnl).toLocaleString('en-IN')}
        </Text>
      </View>

      <View style={s.cardMid}>
        <Text style={s.cardDetail}>Strike <Text style={s.cardVal}>{t.strike?.toLocaleString('en-IN')}</Text></Text>
        <Text style={s.cardDetail}>Lots <Text style={s.cardVal}>{t.lots}</Text></Text>
        <Text style={s.cardDetail}>Entry <Text style={s.cardVal}>₹{t.entryPrice}</Text></Text>
        {ltp && <Text style={s.cardDetail}>LTP <Text style={[s.cardVal, { color: C.amber }]}>₹{ltp}</Text></Text>}
        {closed && t.exitPrice && <Text style={s.cardDetail}>Exit <Text style={s.cardVal}>₹{t.exitPrice}</Text></Text>}
        {closed && <Text style={s.cardDetail}>Hold <Text style={s.cardVal}>{calcHoldTime(t.entryTime)}</Text></Text>}
      </View>

      {!closed && (
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeBtnText}>Close Position</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 52, backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.amber, letterSpacing: 1 },
  headerPnl:   { fontSize: 16, fontWeight: '700' },
  statsRow:    { flexDirection: 'row', backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border },
  chip:        { flex: 1, alignItems: 'center', padding: 10 },
  chipLabel:   { fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  chipVal:     { fontSize: 13, fontWeight: '600', color: C.text },
  sectionLabel:{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  card:        { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: C.border },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardSymbol:  { fontSize: 14, fontWeight: '600', color: C.text },
  pnl:         { fontSize: 16, fontWeight: '700' },
  cardMid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardDetail:  { fontSize: 11, color: C.muted },
  cardVal:     { fontSize: 11, color: C.text, fontWeight: '500' },
  badge:       { borderWidth: 0.5, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText:   { fontSize: 10, fontWeight: '600' },
  closeBtn:    { marginTop: 12, backgroundColor: C.elevated, borderRadius: 6, padding: 8, alignItems: 'center', borderWidth: 0.5, borderColor: C.border },
  closeBtnText:{ fontSize: 12, color: C.amber, fontWeight: '600' },
  empty:       { textAlign: 'center', color: C.muted, fontSize: 14, marginTop: 60, lineHeight: 22 },
})