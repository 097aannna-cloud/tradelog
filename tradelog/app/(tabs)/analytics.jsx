import { useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStore } from '../../lib/store'
import { C, R, S, fmtR } from '../../theme'

const W = Dimensions.get('window').width - S.lg * 2

export default function Analytics() {
  const { closedTrades } = useStore()

  const stats = useMemo(() => {
    const t = closedTrades
    if (!t.length) return null
    const wins   = t.filter(x=>x.pnl>0)
    const losses = t.filter(x=>x.pnl<=0)
    const total  = t.reduce((s,x)=>s+(x.pnl||0),0)
    const avgW   = wins.length   ? wins.reduce((s,x)=>s+x.pnl,0)/wins.length   : 0
    const avgL   = losses.length ? losses.reduce((s,x)=>s+x.pnl,0)/losses.length : 0
    const byType = {}
    for (const x of t) {
      const k = `${x.action} ${x.instrument}`
      if (!byType[k]) byType[k]={n:0,pnl:0,w:0}
      byType[k].n++; byType[k].pnl+=x.pnl||0
      if(x.pnl>0) byType[k].w++
    }
    const sorted = [...t].sort((a,b)=>
      new Date(a.exit_time||a.entry_time)-new Date(b.exit_time||b.entry_time))
    let cum=0
    const eq = sorted.map(x=>{ cum+=x.pnl||0; return cum })
    return { total, wins:wins.length, losses:losses.length,
      wr:Math.round(wins.length/t.length*100), avgW, avgL, byType, eq }
  }, [closedTrades])

  if (!stats) return (
    <SafeAreaView style={s.safe}>
      <View style={s.empty}>
        <Text style={s.emptyIcon}>📊</Text>
        <Text style={s.emptyTxt}>No closed trades yet</Text>
      </View>
    </SafeAreaView>
  )

  // Mini equity chart
  const EH=80
  const eMin=Math.min(...stats.eq,0), eMax=Math.max(...stats.eq,0)
  const eR=eMax-eMin||1
  const pts=stats.eq.map((v,i)=>{
    const x=S.md+(i/(stats.eq.length-1||1))*(W-S.md*2)
    const y=EH-(((v-eMin)/eR)*EH*0.8+EH*0.1)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll}>
        <Text style={s.title}>📊 Analytics</Text>

        {/* Stats grid */}
        <View style={s.grid}>
          {[
            ['Trades',   closedTrades.length,  C.text ],
            ['Win Rate', stats.wr+'%',          C.green],
            ['Total P&L',fmtR(stats.total),
              stats.total>=0?C.green:C.red],
            ['Avg Win',  fmtR(stats.avgW),      C.green],
            ['Avg Loss', fmtR(stats.avgL),      C.red  ],
            ['R:R',      stats.avgW&&stats.avgL
              ? (Math.abs(stats.avgW/stats.avgL)).toFixed(2)
              : '–',                            C.amber],
          ].map(([l,v,c])=>(
            <View key={l} style={s.statCard}>
              <Text style={s.statL}>{l}</Text>
              <Text style={[s.statV,{color:c}]}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Equity curve — native SVG via react-native-svg */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Equity Curve</Text>
          <View style={{height:EH, backgroundColor:C.elevated,
            borderRadius:R.sm, overflow:'hidden'}}>
            {/* Simple line drawn as absolute positioned views */}
            {stats.eq.length > 1 && stats.eq.map((v,i)=>{
              if (i===0) return null
              const x1=S.md+(( i-1)/(stats.eq.length-1))*(W-S.md*2-32)
              const x2=S.md+(i    /(stats.eq.length-1))*(W-S.md*2-32)
              const y1=EH-(((stats.eq[i-1]-eMin)/eR)*EH*0.8+EH*0.1)
              const y2=EH-(((v-eMin)/eR)*EH*0.8+EH*0.1)
              const color=stats.total>=0?C.green:C.red
              return null // placeholder — install react-native-svg for real chart
            })}
            <Text style={{color:C.textTer,fontSize:10,
              textAlign:'center',lineHeight:EH}}>
              {fmtR(stats.total)} total
            </Text>
          </View>
        </View>

        {/* By strategy */}
        <Text style={s.secTitle}>By Strategy</Text>
        {Object.entries(stats.byType)
          .sort((a,b)=>b[1].n-a[1].n)
          .map(([k,v])=>(
          <View key={k} style={s.typeRow}>
            <Text style={s.typeKey}>{k}</Text>
            <Text style={s.typeN}>{v.n} trades</Text>
            <Text style={s.typeWR}>
              {Math.round(v.w/v.n*100)}% WR
            </Text>
            <Text style={[s.typePnl,
              {color:v.pnl>=0?C.green:C.red}]}>
              {fmtR(v.pnl)}
            </Text>
          </View>
        ))}

        {/* Insights */}
        <Text style={s.secTitle}>Insights</Text>
        {Math.abs(stats.avgL)>stats.avgW&&stats.avgW>0&&(
          <View style={[s.insight,{borderColor:C.red+'44'}]}>
            <Text style={s.insightIcon}>⚠️</Text>
            <Text style={s.insightTxt}>
              Avg loss ({fmtR(Math.abs(stats.avgL))}) exceeds avg win ({fmtR(stats.avgW)}).
              Consider tighter stop losses.
            </Text>
          </View>
        )}
        {stats.wr>60&&(
          <View style={[s.insight,{borderColor:C.green+'44'}]}>
            <Text style={s.insightIcon}>🎯</Text>
            <Text style={s.insightTxt}>
              Strong {stats.wr}% win rate. Keep going.
            </Text>
          </View>
        )}

        <View style={{height:32}}/>
      </ScrollView>
    </SafeAreaView>
  )
}

const sw = (Dimensions.get('window').width-S.lg*2)/3-S.sm/3
const s = StyleSheet.create({
  safe:      { flex:1, backgroundColor:C.bg },
  scroll:    { flex:1, padding:S.lg },
  title:     { fontSize:22, fontWeight:'700', color:C.text, marginBottom:S.lg },
  grid:      { flexDirection:'row', flexWrap:'wrap', gap:S.sm, marginBottom:S.md },
  statCard:  { width:sw, padding:S.md, backgroundColor:C.surface,
               borderRadius:R.md, borderWidth:1, borderColor:C.border },
  statL:     { fontSize:9, color:C.textTer, textTransform:'uppercase' },
  statV:     { fontSize:16, fontWeight:'700', color:C.text, marginTop:4 },
  chartCard: { padding:S.md, backgroundColor:C.surface, borderRadius:R.md,
               borderWidth:1, borderColor:C.border, marginBottom:S.md },
  chartTitle:{ fontSize:10, color:C.textSec, marginBottom:S.sm,
               textTransform:'uppercase', letterSpacing:0.5 },
  secTitle:  { fontSize:11, fontWeight:'700', color:C.textSec,
               textTransform:'uppercase', letterSpacing:0.5,
               marginBottom:S.sm, marginTop:S.sm },
  typeRow:   { flexDirection:'row', justifyContent:'space-between',
               alignItems:'center', paddingVertical:10,
               borderBottomWidth:1, borderBottomColor:C.border },
  typeKey:   { fontSize:12, fontWeight:'600', color:C.text, flex:1 },
  typeN:     { fontSize:10, color:C.textTer, marginRight:S.sm },
  typeWR:    { fontSize:11, color:C.blue, marginRight:S.sm },
  typePnl:   { fontSize:12, fontWeight:'700' },
  insight:   { flexDirection:'row', gap:S.sm, padding:S.md,
               borderRadius:R.md, borderWidth:1,
               backgroundColor:C.surface, marginBottom:S.sm },
  insightIcon:{ fontSize:18 },
  insightTxt: { flex:1, fontSize:12, color:C.textSec, lineHeight:18 },
  empty:     { flex:1, alignItems:'center', justifyContent:'center' },
  emptyIcon: { fontSize:48, marginBottom:S.md },
  emptyTxt:  { fontSize:16, fontWeight:'700', color:C.textSec },
})