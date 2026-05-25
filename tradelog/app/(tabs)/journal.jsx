import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { C, R, S } from '../../theme'

const MOODS = [
  {k:'confident',e:'😤',l:'Confident'},
  {k:'nervous',  e:'😰',l:'Nervous'  },
  {k:'fomo',     e:'🤑',l:'FOMO'     },
  {k:'patient',  e:'😴',l:'Patient'  },
  {k:'fearful',  e:'😨',l:'Fearful'  },
]
const VIEWS = [
  {k:'bullish', e:'📈',l:'Bullish' },
  {k:'bearish', e:'📉',l:'Bearish' },
  {k:'neutral', e:'↔️',l:'Neutral' },
  {k:'confused',e:'🤷',l:'Confused'},
]

export default function Journal() {
  const { user, closedTrades } = useStore()
  const date = new Date().toISOString().slice(0,10)
  const [mood,   setMood]   = useState('')
  const [view,   setView]   = useState('')
  const [plan,   setPlan]   = useState('')
  const [review, setReview] = useState('')
  const [saved,  setSaved]  = useState(false)

  const todayTrades = closedTrades.filter(t=>
    (t.exit_time||t.entry_time)?.slice(0,10)===date
  )
  const pnl = todayTrades.reduce((s,t)=>s+(t.pnl||0),0)

  async function save() {
    if (!user) return
    await supabase.from('journal_entries').upsert({
      user_id: user.id, date, mood, market_view: view,
      plan, review, pnl_today: pnl, trades_today: todayTrades.length,
    }, { onConflict:'user_id,date' })
    setSaved(true)
    setTimeout(()=>setSaved(false), 2000)
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll}>
        <Text style={s.title}>📓 Journal</Text>
        <Text style={s.date}>
          {new Date().toLocaleDateString('en-IN',
            { weekday:'long', day:'numeric', month:'long' })}
        </Text>

        {/* Summary */}
        <View style={s.summary}>
          {[
            ['Trades', todayTrades.length, C.text],
            ['P&L', (pnl>=0?'+':'')+Math.round(pnl).toLocaleString(),
              pnl>=0?C.green:C.red],
            ['Wins', todayTrades.filter(t=>t.pnl>0).length, C.green],
          ].map(([l,v,c])=>(
            <View key={l} style={s.sumItem}>
              <Text style={s.sumLabel}>{l}</Text>
              <Text style={[s.sumVal,{color:c}]}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Mood */}
        <Text style={s.secTitle}>How are you feeling?</Text>
        <View style={s.emojiRow}>
          {MOODS.map(m=>(
            <TouchableOpacity key={m.k} onPress={()=>setMood(m.k)}
              style={[s.emojiBtn, mood===m.k && s.emojiBtnOn]}>
              <Text style={s.emoji}>{m.e}</Text>
              <Text style={[s.emojiLabel, mood===m.k && {color:C.amber}]}>
                {m.l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Market view */}
        <Text style={s.secTitle}>Market view?</Text>
        <View style={s.emojiRow}>
          {VIEWS.map(v=>(
            <TouchableOpacity key={v.k} onPress={()=>setView(v.k)}
              style={[s.emojiBtn, view===v.k && s.emojiBtnOn]}>
              <Text style={s.emoji}>{v.e}</Text>
              <Text style={[s.emojiLabel, view===v.k && {color:C.amber}]}>
                {v.l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Plan */}
        <Text style={s.secTitle}>Today's Plan</Text>
        <TextInput value={plan} onChangeText={setPlan} multiline
          numberOfLines={3} placeholder="What do you plan to trade?"
          placeholderTextColor={C.textTer} style={s.input}/>

        {/* Review */}
        <Text style={s.secTitle}>End of Day Review</Text>
        <TextInput value={review} onChangeText={setReview} multiline
          numberOfLines={3} placeholder="What happened? What did you learn?"
          placeholderTextColor={C.textTer} style={s.input}/>

        {/* Save */}
        <TouchableOpacity onPress={save} style={s.saveBtn}>
          <Text style={s.saveTxt}>
            {saved ? '✅ Saved!' : '💾 Save Entry'}
          </Text>
        </TouchableOpacity>

        <View style={{height:32}}/>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex:1, backgroundColor:C.bg },
  scroll:     { flex:1, padding:S.lg },
  title:      { fontSize:22, fontWeight:'700', color:C.text },
  date:       { fontSize:12, color:C.textSec, marginTop:4, marginBottom:S.lg },
  summary:    { flexDirection:'row', padding:S.md,
                backgroundColor:C.surface, borderRadius:R.md,
                borderWidth:1, borderColor:C.border, marginBottom:S.lg },
  sumItem:    { flex:1, alignItems:'center' },
  sumLabel:   { fontSize:10, color:C.textSec },
  sumVal:     { fontSize:18, fontWeight:'700', marginTop:4 },
  secTitle:   { fontSize:11, fontWeight:'700', color:C.textSec,
                textTransform:'uppercase', letterSpacing:0.5,
                marginBottom:S.sm, marginTop:S.sm },
  emojiRow:   { flexDirection:'row', flexWrap:'wrap', gap:S.sm,
                marginBottom:S.md },
  emojiBtn:   { alignItems:'center', padding:S.sm, borderRadius:R.md,
                borderWidth:1, borderColor:C.border,
                backgroundColor:C.surface, minWidth:58 },
  emojiBtnOn: { borderColor:C.amber, backgroundColor:C.amber+'22' },
  emoji:      { fontSize:24 },
  emojiLabel: { fontSize:9, color:C.textSec, marginTop:3 },
  input:      { backgroundColor:C.surface, borderWidth:1,
                borderColor:C.border, borderRadius:R.md,
                padding:S.md, color:C.text, fontSize:13,
                textAlignVertical:'top', minHeight:80,
                marginBottom:S.md },
  saveBtn:    { paddingVertical:16, backgroundColor:C.amber,
                borderRadius:R.md, alignItems:'center', marginTop:S.sm },
  saveTxt:    { fontSize:14, fontWeight:'700', color:'#0A0B0D' },
})