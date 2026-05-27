import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { getExpiries, getChain, SYMBOLS } from '../../lib/dhan'
import { C, R, S, fmtN } from '../../theme'

export default function Trade() {
  const { user, profile, setProfile, addTrade,
    startTimer, getScreenSecs, addStrikeView, sessionId } = useStore()

  const [sym,       setSym]       = useState(SYMBOLS[0])
  const [expiries,  setExpiries]  = useState([])
  const [expiry,    setExpiry]    = useState('')
  const [chain,     setChain]     = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [mode,      setMode]      = useState('CE')
  const [strike,    setStrike]    = useState(null)
  const [action,    setAction]    = useState('BUY')
  const [lots,      setLots]      = useState(1)
  const [modal,     setModal]     = useState(false)
  const [pending,   setPending]   = useState(null)

  const spot    = chain?.last_price || 0
  const oc      = chain?.oc || {}
  const strikes = Object.keys(oc).map(Number).sort((a,b)=>a-b)
  const atm     = strikes.length
    ? strikes.reduce((p,c)=>Math.abs(c-spot)<Math.abs(p-spot)?c:p)
    : 0
  const atmIdx  = strikes.indexOf(atm)
  const shown   = strikes.slice(Math.max(0,atmIdx-10), atmIdx+11)

  useEffect(()=>{ startTimer(); loadExpiries() }, [sym])

  async function loadExpiries() {
    setLoading(true); setChain(null)
    try {
      const d = await getExpiries(sym.scrip, sym.seg)
      const list = Array.isArray(d.data) ? d.data : []
setExpiries(list)
if (list[0]) { setExpiry(list[0]); await loadChain(list[0]) }
    } catch(e) {}
    setLoading(false)
  }

  async function loadChain(exp) {
    setLoading(true)
    try {
      const d = await getChain(sym.scrip, sym.seg, exp)
      if (!d.error) setChain(d)
    } catch(e) {}
    setLoading(false)
  }

  function getOpt(s, t) {
    const e = oc[s+'.000000'] || oc[s] || {}
    return t==='CE' ? e.ce||{} : e.pe||{}
  }

  function handleStrike(s) {
    addStrikeView()
    setStrike(s)
  }

  function prepare() {
    const opt   = mode!=='FUT' ? getOpt(strike, mode) : null
    const price = opt?.last_price || spot
    const qty   = lots * sym.lot
    const dte   = (() => {
      const t = new Date(); t.setHours(0,0,0,0)
      const e = new Date(expiry); e.setHours(0,0,0,0)
      return Math.max(0, Math.round((e-t)/86400000))
    })()
    setPending({
      symbol: sym.label, expiry, instrument: mode,
      strike: mode!=='FUT' ? strike : null,
      action, lots, lot_size: sym.lot, qty,
      entry_price: price, entry_spot: spot,
      entry_iv: opt?.implied_volatility || null,
      entry_dte: dte, capital: price * qty,
      screen_secs: getScreenSecs(),
      strikes_viewed: useStore.getState().strikesViewed,
      mode_used: mode, session_id: sessionId,
    })
    setModal(true)
  }

  async function confirm() {
    if (!pending || !user) return
    const trade = { ...pending, user_id: user.id,
      entry_time: new Date().toISOString(), status: 'OPEN' }
    const { data } = await supabase
      .from('paper_trades').insert(trade).select().single()
    if (data) {
      addTrade(data)
      await supabase.from('profiles').update({
        total_trades: (profile?.total_trades||0)+1,
        xp: (profile?.xp||0)+10,
      }).eq('id', user.id)
      setProfile({ ...profile,
        total_trades:(profile?.total_trades||0)+1,
        xp:(profile?.xp||0)+10 })
    }
    setModal(false); setPending(null)
    setStrike(null); startTimer()
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Symbol row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.symBar} contentContainerStyle={s.symContent}>
        {SYMBOLS.map(sym2=>(
          <TouchableOpacity key={sym2.label} onPress={()=>setSym(sym2)}
            style={[s.symChip, sym.label===sym2.label && s.symChipOn]}>
            <Text style={[s.symTxt, sym.label===sym2.label && { color:C.amber }]}>
              {sym2.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Spot bar */}
      <View style={s.spotBar}>
        <View>
          <Text style={s.spotLabel}>{sym.label}</Text>
          <Text style={s.spotVal}>{loading ? '…' : fmtN(spot,2)}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {expiries.slice(0,5).map(exp=>(
            <TouchableOpacity key={exp}
              onPress={()=>{ setExpiry(exp); loadChain(exp) }}
              style={[s.expChip, expiry===exp && s.expChipOn]}>
              <Text style={[s.expTxt, expiry===exp && { color:C.amber }]}>
                {exp}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Mode */}
      <View style={s.modeBar}>
        {[['CE','Call'],['PE','Put'],['FUT','Futures']].map(([k,l])=>(
          <TouchableOpacity key={k} onPress={()=>setMode(k)}
            style={[s.modeBtn, mode===k && {
              borderColor: k==='CE'?C.green:k==='PE'?C.red:C.amber,
              backgroundColor:(k==='CE'?C.green:k==='PE'?C.red:C.amber)+'22',
            }]}>
            <Text style={[s.modeTxt, mode===k && {
              color: k==='CE'?C.green:k==='PE'?C.red:C.amber
            }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chain */}
      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator color={C.amber} size="large"/>
        </View>
      ) : (
        <ScrollView style={s.chainScroll}>
          <View style={s.chainHead}>
            <Text style={[s.chainHeadTxt,{flex:2,textAlign:'right'}]}>
              {mode==='CE'?'CE LTP':''}
            </Text>
            <Text style={[s.chainHeadTxt,{flex:1,textAlign:'center'}]}>
              STRIKE
            </Text>
            <Text style={[s.chainHeadTxt,{flex:2}]}>
              {mode==='PE'?'PE LTP':''}
            </Text>
          </View>
          {shown.map(str=>{
            const opt  = getOpt(str, mode==='FUT'?'CE':mode)
            const isATM = str===atm
            const isSel = str===strike
            return (
              <TouchableOpacity key={str} onPress={()=>handleStrike(str)}
                style={[s.strikeRow,
                  isATM && s.strikeATM,
                  isSel && s.strikeSel]}>
                <View style={{flex:2,alignItems:'flex-end'}}>
                  {mode==='CE'&&(
                    <Text style={[s.ltp,{color:C.green}]}>
                      ₹{fmtN(opt.last_price,1)}
                    </Text>
                  )}
                </View>
                <View style={s.strikeMid}>
                  <Text style={[s.strikeTxt,
                    isATM&&{color:C.amber,fontWeight:'700'}]}>
                    {str.toLocaleString()}
                  </Text>
                  {isATM&&<Text style={s.atmBadge}>ATM</Text>}
                </View>
                <View style={{flex:2}}>
                  {mode==='PE'&&(
                    <Text style={[s.ltp,{color:C.red}]}>
                      ₹{fmtN(getOpt(str,'PE').last_price,1)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}

      {/* Bottom action bar */}
      {strike && (
        <View style={s.actionBar}>
          <View style={s.actionToggle}>
            {['BUY','SELL'].map(a=>(
              <TouchableOpacity key={a} onPress={()=>setAction(a)}
                style={[s.actionBtn,
                  action===a && { backgroundColor:a==='BUY'?C.green:C.red }]}>
                <Text style={[s.actionTxt,
                  action===a && { color:'#0A0B0D' }]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.lotsRow}>
            <TouchableOpacity onPress={()=>setLots(l=>Math.max(1,l-1))}
              style={s.lotBtn}>
              <Text style={s.lotBtnTxt}>−</Text>
            </TouchableOpacity>
            <Text style={s.lotVal}>{lots}</Text>
            <TouchableOpacity onPress={()=>setLots(l=>Math.min(50,l+1))}
              style={s.lotBtn}>
              <Text style={s.lotBtnTxt}>+</Text>
            </TouchableOpacity>
            <Text style={s.lotLabel}>lots</Text>
          </View>
          <TouchableOpacity onPress={prepare}
            style={[s.confirmBtn,
              { backgroundColor:action==='BUY'?C.green:C.red }]}>
            <Text style={s.confirmTxt}>
              {action} {mode} {strike?.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirm modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Confirm Paper Trade</Text>
            {pending && <>
              {[
                ['Symbol',     pending.symbol],
                ['Type',       pending.strike
                  ? `${pending.strike} ${pending.instrument}`
                  : pending.instrument],
                ['Action',     pending.action],
                ['LTP',        `₹${fmtN(pending.entry_price,2)}`],
                ['Lots × Size',`${pending.lots} × ${pending.lot_size} = ${pending.qty}`],
                ['Capital',    `₹${Math.round(pending.capital).toLocaleString()}`],
              ].map(([l,v])=>(
                <View key={l} style={s.modalRow}>
                  <Text style={s.modalLabel}>{l}</Text>
                  <Text style={s.modalVal}>{v}</Text>
                </View>
              ))}
            </>}
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={()=>setModal(false)} style={s.cancelBtn}>
                <Text style={s.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirm}
                style={[s.goBtn,
                  { backgroundColor:pending?.action==='BUY'?C.green:C.red }]}>
                <Text style={s.goTxt}>📝 Paper Trade</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex:1, backgroundColor:C.bg },
  symBar:      { maxHeight:46, borderBottomWidth:1, borderBottomColor:C.border },
  symContent:  { paddingHorizontal:S.md, alignItems:'center', gap:S.sm },
  symChip:     { paddingHorizontal:12, paddingVertical:6, borderRadius:R.full,
                 borderWidth:1, borderColor:C.border, backgroundColor:C.surface },
  symChipOn:   { borderColor:C.amber, backgroundColor:C.amber+'22' },
  symTxt:      { fontSize:11, color:C.textSec, fontWeight:'600' },
  spotBar:     { flexDirection:'row', alignItems:'center', padding:S.md,
                 borderBottomWidth:1, borderBottomColor:C.border,
                 backgroundColor:C.surface, gap:S.lg },
  spotLabel:   { fontSize:9, color:C.textTer, textTransform:'uppercase' },
  spotVal:     { fontSize:22, fontWeight:'700', color:C.text },
  expChip:     { paddingHorizontal:10, paddingVertical:4, borderRadius:R.sm,
                 marginRight:6, borderWidth:1, borderColor:C.border,
                 backgroundColor:C.elevated },
  expChipOn:   { borderColor:C.amber },
  expTxt:      { fontSize:11, color:C.textSec },
  modeBar:     { flexDirection:'row', gap:S.sm, padding:S.md,
                 borderBottomWidth:1, borderBottomColor:C.border },
  modeBtn:     { flex:1, paddingVertical:8, borderRadius:R.md,
                 borderWidth:1, borderColor:C.border, alignItems:'center' },
  modeTxt:     { fontSize:12, fontWeight:'600', color:C.textSec },
  loader:      { flex:1, alignItems:'center', justifyContent:'center' },
  chainScroll: { flex:1 },
  chainHead:   { flexDirection:'row', paddingHorizontal:S.lg,
                 paddingVertical:S.sm, borderBottomWidth:1,
                 borderBottomColor:C.border },
  chainHeadTxt:{ fontSize:9, color:C.textTer,
                 textTransform:'uppercase', letterSpacing:0.5 },
  strikeRow:   { flexDirection:'row', alignItems:'center',
                 paddingHorizontal:S.lg, paddingVertical:12,
                 borderBottomWidth:1, borderBottomColor:C.border },
  strikeATM:   { backgroundColor:C.amber+'11' },
  strikeSel:   { backgroundColor:C.blue+'22',
                 borderLeftWidth:3, borderLeftColor:C.blue },
  ltp:         { fontSize:14, fontWeight:'700' },
  strikeMid:   { flex:1, alignItems:'center' },
  strikeTxt:   { fontSize:14, color:C.text },
  atmBadge:    { fontSize:8, color:C.amber, fontWeight:'700', marginTop:2 },
  actionBar:   { padding:S.md, borderTopWidth:1, borderTopColor:C.border,
                 backgroundColor:C.surface, gap:S.sm },
  actionToggle:{ flexDirection:'row', gap:S.sm },
  actionBtn:   { flex:1, paddingVertical:10, borderRadius:R.md,
                 borderWidth:1, borderColor:C.border,
                 alignItems:'center', backgroundColor:C.elevated },
  actionTxt:   { fontSize:13, fontWeight:'700', color:C.textSec },
  lotsRow:     { flexDirection:'row', alignItems:'center', gap:S.sm },
  lotBtn:      { width:32, height:32, borderRadius:R.sm,
                 borderWidth:1, borderColor:C.border,
                 alignItems:'center', justifyContent:'center',
                 backgroundColor:C.elevated },
  lotBtnTxt:   { fontSize:18, color:C.text },
  lotVal:      { fontSize:18, fontWeight:'700', color:C.text,
                 minWidth:28, textAlign:'center' },
  lotLabel:    { fontSize:12, color:C.textSec },
  confirmBtn:  { paddingVertical:14, borderRadius:R.md, alignItems:'center' },
  confirmTxt:  { fontSize:14, fontWeight:'700', color:'#0A0B0D' },
  overlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.7)',
                 justifyContent:'flex-end' },
  modalBox:    { backgroundColor:C.elevated, borderTopLeftRadius:20,
                 borderTopRightRadius:20, padding:S.xl,
                 borderTopWidth:1, borderTopColor:C.border },
  modalTitle:  { fontSize:16, fontWeight:'700', color:C.text, marginBottom:S.lg },
  modalRow:    { flexDirection:'row', justifyContent:'space-between',
                 paddingVertical:10, borderBottomWidth:1, borderBottomColor:C.border },
  modalLabel:  { fontSize:12, color:C.textSec },
  modalVal:    { fontSize:12, fontWeight:'600', color:C.text },
  modalBtns:   { flexDirection:'row', gap:S.md, marginTop:S.lg },
  cancelBtn:   { flex:1, paddingVertical:14, borderRadius:R.md,
                 borderWidth:1, borderColor:C.border, alignItems:'center' },
  cancelTxt:   { fontSize:13, color:C.textSec, fontWeight:'600' },
  goBtn:       { flex:2, paddingVertical:14, borderRadius:R.md, alignItems:'center' },
  goTxt:       { fontSize:14, fontWeight:'700', color:'#0A0B0D' },
})
