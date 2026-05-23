import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useState, useEffect } from 'react'
import { api } from '../lib/api'

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
}

export default function AnalyticsScreen() {
  const [trades, setTrades] = useState([])

  useEffect(() => {
    api.getTrades().then(d => setTrades(d.trades || d || [])).catch(()=>{})
  }, [])

  const closed = trades.filter(t => t.status === 'CLOSED')
  const wins   = closed.filter(t => (t.pnl || 0) > 0)
  const losses = closed.filter(t => (t.pnl || 0) < 0)
  const winRate = closed.length ? Math.round(wins.length / closed.length * 100) : 0
  const totalPnl = closed.reduce((s, t) => s + (t.pnl || 0), 0)
  const avgWin  = wins.length   ? Math.round(wins.reduce((s,t) => s+(t.pnl||0),0)   / wins.length)   : 0
  const avgLoss = losses.length ? Math.round(losses.reduce((s,t) => s+(t.pnl||0),0) / losses.length) : 0
  const profitFactor = losses.length && avgLoss !== 0
    ? Math.abs((avgWin * wins.length) / (avgLoss * losses.length)).toFixed(2)
    : '–'

  const insights = []
  if (closed.length >= 5) {
    if (Math.abs(avgLoss) > avgWin * 2)
      insights.push(`Your avg loss (₹${Math.abs(avgLoss)}) is ${(Math.abs(avgLoss)/Math.max(avgWin,1)).toFixed(1)}× your avg win — reduce lot size.`)
    if (winRate < 40)
      insights.push(`Win rate is ${winRate}% — focus on trade selection, not frequency.`)
    if (winRate >= 60)
      insights.push(`Strong win rate of ${winRate}% — protect it by avoiding overtrading.`)
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>ANALYTICS</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={s.grid}>
          <StatCard label="Total Trades" value={closed.length} />
          <StatCard label="Win Rate"     value={`${winRate}%`} color={winRate >= 50 ? C.green : C.red} />
          <StatCard label="Total P&L"    value={`₹${Math.round(totalPnl).toLocaleString('en-IN')}`} color={totalPnl >= 0 ? C.green : C.red} />
          <StatCard label="Profit Factor" value={profitFactor} />
          <StatCard label="Avg Win"  value={`₹${avgWin.toLocaleString('en-IN')}`}          color={C.green} />
          <StatCard label="Avg Loss" value={`₹${Math.abs(avgLoss).toLocaleString('en-IN')}`} color={C.red} />
        </View>

        {insights.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Insights</Text>
            {insights.map((ins, i) => (
              <View key={i} style={s.insightCard}>
                <Text style={s.insightText}>{ins}</Text>
              </View>
            ))}
          </>
        )}

        {closed.length < 5 && (
          <Text style={s.empty}>Place at least 5 trades to unlock insights.</Text>
        )}

        <Text style={s.note}>Charts and time-of-day breakdown coming in Phase 2.</Text>
      </ScrollView>
    </View>
  )
}

function StatCard({ label, value, color }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statVal, color ? { color } : {}]}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  header:       { padding: 16, paddingTop: 52, backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: C.amber, letterSpacing: 1 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard:     { width: '47%', backgroundColor: C.surface, borderRadius: 10, padding: 14, borderWidth: 0.5, borderColor: C.border },
  statLabel:    { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statVal:      { fontSize: 20, fontWeight: '700', color: C.text },
  sectionLabel: { fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  insightCard:  { backgroundColor: C.surface, borderRadius: 10, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.amber, borderWidth: 0.5, borderColor: C.border },
  insightText:  { fontSize: 13, color: C.text, lineHeight: 20 },
  empty:        { textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 20, lineHeight: 20 },
  note:         { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 24, lineHeight: 18 },
})