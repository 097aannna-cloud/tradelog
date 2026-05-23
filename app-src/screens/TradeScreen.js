import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native'
import { useState } from 'react'
import { api } from '../lib/api'
import { LOT_SIZE } from '../lib/calc'

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

const SYMBOLS = ['NIFTY 50','BANKNIFTY','FINNIFTY','MIDCPNIFTY','SENSEX','BANKEX']

export default function TradeScreen() {
  const [symbol, setSymbol]     = useState('NIFTY 50')
  const [mode, setMode]         = useState('CE')
  const [expiries, setExpiries] = useState([])
  const [expiry, setExpiry]     = useState('')
  const [chain, setChain]       = useState([])
  const [lots, setLots]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [confirm, setConfirm]   = useState(null)
  const [success, setSuccess]   = useState(false)
  const [screenTime] = useState(Date.now())

  async function loadChain(sym, exp) {
    setLoading(true)
    try {
      const res = await api.getOptionChain(sym, exp)
      const rows = res.data || []
      setChain(rows)
      if (!expiries.length && res.expiries) {
        setExpiries(res.expiries.slice(0,3))
        setExpiry(res.expiries[0])
      }
    } catch(e) {}
    setLoading(false)
  }

  function selectSymbol(sym) {
    setSymbol(sym)
    setChain([])
    setExpiries([])
    setExpiry('')
  }

  function selectExpiry(exp) {
    setExpiry(exp)
    loadChain(symbol, exp)
  }

  function openConfirm(strike, ltp, securityId, action) {
    const qty = lots * (LOT_SIZE[symbol] || 1)
    const capital = Math.round(ltp * qty)
    const timeOnScreen = Math.round((Date.now() - screenTime) / 1000)
    setConfirm({ symbol, expiry, type: mode, action, strike, ltp, securityId, lots, qty, capital, timeOnScreen })
  }

  async function placeTrade() {
    if (!confirm) return
    setLoading(true)
    try {
      await api.createTrade({
        symbolName:  confirm.symbol,
        expiry:      confirm.expiry,
        type:        confirm.type,
        action:      confirm.action,
        strike:      confirm.strike,
        lots:        confirm.lots,
        qty:         confirm.qty,
        entryPrice:  confirm.ltp,
        entryTime:   new Date().toISOString(),
        entrySpot:   0,
        entryIV:     0,
        entryDTE:    0,
        securityId:  confirm.securityId,
        segment:     'NSE_FNO',
      })
      setConfirm(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch(e) {}
    setLoading(false)
  }

  const atm = chain.length ? chain[Math.floor(chain.length / 2)]?.strike : null

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>TRADE</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <Text style={s.label}>Symbol</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {SYMBOLS.map(sym => (
            <TouchableOpacity
              key={sym}
              style={[s.pill, symbol === sym && s.pillActive]}
              onPress={() => selectSymbol(sym)}
            >
              <Text style={[s.pillText, symbol === sym && s.pillTextActive]}>{sym}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.label}>Type</Text>
        <View style={s.modeRow}>
          {['CE','PE','FUT'].map(m => (
            <TouchableOpacity
              key={m}
              style={[s.modeBtn, mode === m && s.modeBtnActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[s.modeBtnText, mode === m && s.modeBtnTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {expiries.length === 0 && (
          <TouchableOpacity style={s.loadBtn} onPress={() => loadChain(symbol, '')} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#0A0B0D" />
              : <Text style={s.loadBtnText}>Load Chain</Text>
            }
          </TouchableOpacity>
        )}

        {expiries.length > 0 && (
          <>
            <Text style={s.label}>Expiry</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {expiries.map(exp => (
                <TouchableOpacity
                  key={exp}
                  style={[s.pill, expiry === exp && s.pillActive]}
                  onPress={() => selectExpiry(exp)}
                >
                  <Text style={[s.pillText, expiry === exp && s.pillTextActive]}>{exp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={s.label}>Lots</Text>
        <View style={s.lotRow}>
          <TouchableOpacity style={s.lotBtn} onPress={() => setLots(l => Math.max(1, l-1))}>
            <Text style={s.lotBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={s.lotVal}>{lots}</Text>
          <TouchableOpacity style={s.lotBtn} onPress={() => setLots(l => l+1)}>
            <Text style={s.lotBtnText}>+</Text>
          </TouchableOpacity>
          <Text style={s.lotInfo}>× {LOT_SIZE[symbol] || '?'} = {lots * (LOT_SIZE[symbol] || 0)} qty</Text>
        </View>

        {loading && <ActivityIndicator color={C.amber} style={{ marginTop: 20 }} />}

        {chain.length > 0 && (
          <>
            <Text style={s.label}>Strike</Text>
            <View style={s.chainHeader}>
              <Text style={[s.chainCol, { color: C.green }]}>CE LTP</Text>
              <Text style={s.chainStrike}>Strike</Text>
              <Text style={[s.chainCol, { color: C.red, textAlign: 'right' }]}>PE LTP</Text>
            </View>
            {chain.map((row, i) => {
              const isAtm = row.strike === atm
              return (
                <View key={i} style={[s.chainRow, isAtm && s.chainRowAtm]}>
                  <TouchableOpacity
                    style={s.chainCell}
                    onPress={() => openConfirm(row.strike, row.ce?.ltp || 0, row.ce?.securityId, 'BUY')}
                  >
                    <Text style={[s.chainLtp, { color: C.green }]}>{row.ce?.ltp || '–'}</Text>
                  </TouchableOpacity>
                  <Text style={[s.chainStrikeVal, isAtm && { color: C.amber }]}>{row.strike?.toLocaleString('en-IN')}</Text>
                  <TouchableOpacity
                    style={[s.chainCell, { alignItems: 'flex-end' }]}
                    onPress={() => openConfirm(row.strike, row.pe?.ltp || 0, row.pe?.securityId, 'BUY')}
                  >
                    <Text style={[s.chainLtp, { color: C.red }]}>{row.pe?.ltp || '–'}</Text>
                  </TouchableOpacity>
                </View>
              )
            })}
          </>
        )}
      </ScrollView>

      {success && (
        <View style={s.toast}>
          <Text style={s.toastText}>Trade added!</Text>
        </View>
      )}

      <Modal visible={!!confirm} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Confirm Paper Trade</Text>
            {confirm && (
              <>
                <Row label="Symbol"  value={confirm.symbol} />
                <Row label="Type"    value={`${confirm.type} ${confirm.action}`} />
                <Row label="Strike"  value={confirm.strike?.toLocaleString('en-IN')} />
                <Row label="LTP"     value={`₹${confirm.ltp}`} />
                <Row label="Lots"    value={confirm.lots} />
                <Row label="Capital" value={`₹${confirm.capital?.toLocaleString('en-IN')}`} />
              </>
            )}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setConfirm(null)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={placeTrade} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#0A0B0D" />
                  : <Text style={s.confirmText}>Confirm Trade</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function Row({ label, value }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowVal}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  header:          { padding: 16, paddingTop: 52, backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerTitle:     { fontSize: 16, fontWeight: '700', color: C.amber, letterSpacing: 1 },
  label:           { fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  pill:            { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 0.5, borderColor: C.border, marginRight: 8, backgroundColor: C.surface },
  pillActive:      { backgroundColor: C.amber, borderColor: C.amber },
  pillText:        { fontSize: 12, color: C.muted, fontWeight: '500' },
  pillTextActive:  { color: '#0A0B0D' },
  modeRow:         { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modeBtn:         { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', backgroundColor: C.surface },
  modeBtnActive:   { backgroundColor: C.amber, borderColor: C.amber },
  modeBtnText:     { fontSize: 13, fontWeight: '600', color: C.muted },
  modeBtnTextActive:{ color: '#0A0B0D' },
  loadBtn:         { backgroundColor: C.amber, padding: 14, borderRadius: 8, alignItems: 'center', marginVertical: 16 },
  loadBtnText:     { fontWeight: '700', color: '#0A0B0D', fontSize: 14 },
  lotRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  lotBtn:          { width: 36, height: 36, borderRadius: 8, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: C.border },
  lotBtnText:      { fontSize: 18, color: C.text, fontWeight: '500' },
  lotVal:          { fontSize: 18, fontWeight: '700', color: C.text, minWidth: 24, textAlign: 'center' },
  lotInfo:         { fontSize: 12, color: C.muted },
  chainHeader:     { flexDirection: 'row', paddingHorizontal: 4, marginBottom: 4 },
  chainCol:        { flex: 1, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  chainStrike:     { width: 90, textAlign: 'center', fontSize: 10, color: C.muted, fontWeight: '600', letterSpacing: 0.5 },
  chainRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: C.border },
  chainRowAtm:     { backgroundColor: '#F59E0B18' },
  chainCell:       { flex: 1 },
  chainLtp:        { fontSize: 13, fontWeight: '600' },
  chainStrikeVal:  { width: 90, textAlign: 'center', fontSize: 13, fontWeight: '700', color: C.text },
  toast:           { position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: C.green, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  toastText:       { color: '#fff', fontWeight: '600' },
  modalBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:       { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 0.5, borderColor: C.border },
  modalTitle:      { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 16 },
  row:             { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: C.border },
  rowLabel:        { fontSize: 13, color: C.muted },
  rowVal:          { fontSize: 13, fontWeight: '600', color: C.text },
  modalBtns:       { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn:       { flex: 1, padding: 14, borderRadius: 8, borderWidth: 0.5, borderColor: C.border, alignItems: 'center' },
  cancelText:      { color: C.muted, fontWeight: '600' },
  confirmBtn:      { flex: 1, padding: 14, borderRadius: 8, backgroundColor: C.amber, alignItems: 'center' },
  confirmText:     { color: '#0A0B0D', fontWeight: '700' },
})