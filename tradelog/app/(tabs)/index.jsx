import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { C, R, S, fmtR } from '../../theme'

export default function Home() {
  const { user, profile, openTrades, setOpenTrades,
    closedTrades, setClosedTrades, closeTrade } = useStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { if (user?.id) load() }, [user])

  async function load() {
    const { data } = await supabase
      .from('paper_trades').select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    if (data) {
      setOpenTrades(data.filter(t => t.status === 'OPEN'))
      setClosedTrades(data.filter(t => t.status === 'CLOSED'))
    }
  }

  async function handleClose(trade) {
    const pnl = 0 // mock — real app fetches live LTP
    await supabase.from('paper_trades').update({
      exit_price: trade.entry_price,
      exit_time: new Date().toISOString(),
      status: 'CLOSED', pnl,
      hold_minutes: Math.round(
        (Date.now() - new Date(trade.entry_time).getTime()) / 60000
      )
    }).eq('id', trade.id)
    closeTrade(trade.id, trade.entry_price, pnl)
  }

  const today = new Date().toISOString().slice(0,10)
  const todayPnl = closedTrades
    .filter(t => t.exit_time?.slice(0,10) === today)
    .reduce((s,t) => s + (t.pnl||0), 0)
  const winRate = closedTrades.length
    ? Math.round(closedTrades.filter(t=>t.pnl>0).length / closedTrades.length * 100)
    : 0

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView refreshControl={
        <RefreshControl refreshing={refreshing} tintColor={C.amber}
          onRefresh={async()=>{ setRefreshing(true); await load(); setRefreshing(false) }}/>
      }>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>
              Hey {profile?.display_name?.split(' ')[0] || 'Trader'} 👋
            </Text>
            <Text style={s.sub}>
              {new Date().toLocaleDateString('en-IN',
                { weekday:'long', day:'numeric', month:'short' })}
            </Text>
          </View>
          <View style={[s.tier,
            { backgroundColor: profile?.tier==='Elite' ? C.purple : C.amber }]}>
            <Text style={s.tierTxt}>{profile?.tier || 'Rookie'}</Text>
          </View>
        </View>

        {/* Balance */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Virtual Balance</Text>
          <Text style={s.balance}>
            ₹{((profile?.virtual_balance||1000000)/100000).toFixed(1)}L
          </Text>
          <View style={s.row}>
            {[
              ['Today P&L', fmtR(todayPnl), todayPnl>=0?C.green:C.red],
              ['Win Rate',  winRate+'%',    C.blue],
              ['Streak',    (profile?.streak||0)+'d', C.amber],
            ].map(([l,v,c])=>(
              <View key={l} style={s.stat}>
                <Text style={s.statL}>{l}</Text>
                <Text style={[s.statV,{color:c}]}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Open positions */}
        <Text style={s.sectionTitle}>
          Open Positions {openTrades.length>0 && `(${openTrades.length})`}
        </Text>

        {openTrades.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyTxt}>No open positions</Text>
            <Text style={s.emptySub}>Go to Trade tab to start</Text>
          </View>
        ) : openTrades.map(t => (
          <View key={t.id} style={s.tradeCard}>
            <View style={s.tradeRow}>
              <View style={s.tradeMeta}>
                <Text style={[s.instr,
                  { color: t.instrument==='CE'?C.green:t.instrument==='PE'?C.red:C.amber }]}>
                  {t.instrument}
                </Text>
                <Text style={s.symbol}>
                  {t.symbol}{t.strike ? ` ${t.strike}` : ''}
                </Text>
                <View style={[s.actionBadge,
                  { backgroundColor: t.action==='BUY'?C.green+'22':C.red+'22' }]}>
                  <Text style={[s.actionTxt,
                    { color: t.action==='BUY'?C.green:C.red }]}>
                    {t.action}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={()=>handleClose(t)}>
                <Text style={s.closeTxt}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={s.tradeDetail}>
              <Text style={s.detailTxt}>Entry ₹{t.entry_price?.toFixed(1)}</Text>
              <Text style={s.detailTxt}>{t.lots} lot{t.lots>1?'s':''}</Text>
              <Text style={s.detailTxt}>
                {new Date(t.entry_time).toLocaleTimeString('en-IN',
                  { hour:'2-digit', minute:'2-digit' })}
              </Text>
            </View>
          </View>
        ))}

        <View style={{ height: 24 }}/>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex:1, backgroundColor:C.bg },
  header:      { flexDirection:'row', justifyContent:'space-between',
                 alignItems:'center', padding:S.lg },
  greeting:    { fontSize:20, fontWeight:'700', color:C.text },
  sub:         { fontSize:11, color:C.textSec, marginTop:2 },
  tier:        { paddingHorizontal:10, paddingVertical:4,
                 borderRadius:R.full },
  tierTxt:     { fontSize:11, fontWeight:'700', color:'#0A0B0D' },
  card:        { marginHorizontal:S.lg, padding:S.lg,
                 backgroundColor:C.surface, borderRadius:R.lg,
                 borderWidth:1, borderColor:C.border, marginBottom:S.md },
  cardLabel:   { fontSize:10, color:C.textSec,
                 textTransform:'uppercase', letterSpacing:0.5 },
  balance:     { fontSize:32, fontWeight:'700', color:C.text,
                 marginTop:4, marginBottom:12 },
  row:         { flexDirection:'row' },
  stat:        { flex:1, alignItems:'center' },
  statL:       { fontSize:9, color:C.textSec },
  statV:       { fontSize:15, fontWeight:'700', marginTop:3 },
  sectionTitle:{ fontSize:11, fontWeight:'700', color:C.textSec,
                 marginHorizontal:S.lg, marginBottom:S.sm,
                 textTransform:'uppercase', letterSpacing:0.5 },
  empty:       { alignItems:'center', padding:S.xl,
                 margin:S.lg, backgroundColor:C.surface,
                 borderRadius:R.lg, borderWidth:1, borderColor:C.border },
  emptyIcon:   { fontSize:32, marginBottom:S.sm },
  emptyTxt:    { fontSize:13, color:C.textSec, fontWeight:'600' },
  emptySub:    { fontSize:11, color:C.textTer, marginTop:4 },
  tradeCard:   { marginHorizontal:S.lg, padding:S.md,
                 backgroundColor:C.surface, borderRadius:R.md,
                 borderWidth:1, borderColor:C.border, marginBottom:S.sm },
  tradeRow:    { flexDirection:'row', justifyContent:'space-between',
                 alignItems:'center', marginBottom:6 },
  tradeMeta:   { flexDirection:'row', alignItems:'center', gap:6 },
  instr:       { fontSize:13, fontWeight:'700' },
  symbol:      { fontSize:12, color:C.text, fontWeight:'600' },
  actionBadge: { paddingHorizontal:6, paddingVertical:2,
                 borderRadius:R.sm },
  actionTxt:   { fontSize:10, fontWeight:'700' },
  closeBtn:    { paddingHorizontal:14, paddingVertical:6,
                 backgroundColor:C.elevated, borderRadius:R.sm,
                 borderWidth:1, borderColor:C.border },
  closeTxt:    { fontSize:11, fontWeight:'600', color:C.text },
  tradeDetail: { flexDirection:'row', gap:S.lg },
  detailTxt:   { fontSize:10, color:C.textSec },
})
