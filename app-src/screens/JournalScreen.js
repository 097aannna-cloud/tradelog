import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useState } from 'react'

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

const MOODS = [
  { label: 'Confident', emoji: '😤' },
  { label: 'Nervous',   emoji: '😰' },
  { label: 'FOMO',      emoji: '🤑' },
  { label: 'Patient',   emoji: '😴' },
]

const VIEWS = [
  { label: 'Bullish',  emoji: '📈' },
  { label: 'Bearish',  emoji: '📉' },
  { label: 'Neutral',  emoji: '↔️' },
  { label: 'Confused', emoji: '🤷' },
]

export default function JournalScreen() {
  const [mood, setMood]   = useState(null)
  const [view, setView]   = useState(null)
  const [saved, setSaved] = useState(false)

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>JOURNAL</Text>
        <Text style={s.headerDate}>{today}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={s.sectionLabel}>How are you feeling?</Text>
        <View style={s.emojiRow}>
          {MOODS.map(m => (
            <TouchableOpacity
              key={m.label}
              style={[s.emojiBtn, mood === m.label && s.emojiBtnActive]}
              onPress={() => setMood(m.label)}
            >
              <Text style={s.emojiIcon}>{m.emoji}</Text>
              <Text style={[s.emojiLabel, mood === m.label && { color: C.amber }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>Market view today</Text>
        <View style={s.emojiRow}>
          {VIEWS.map(v => (
            <TouchableOpacity
              key={v.label}
              style={[s.emojiBtn, view === v.label && s.emojiBtnActive]}
              onPress={() => setView(v.label)}
            >
              <Text style={s.emojiIcon}>{v.emoji}</Text>
              <Text style={[s.emojiLabel, view === v.label && { color: C.amber }]}>{v.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.saveBtn, saved && { backgroundColor: C.green }]}
          onPress={save}
        >
          <Text style={s.saveBtnText}>{saved ? 'Saved!' : 'Save Journal Entry'}</Text>
        </TouchableOpacity>

        <Text style={s.note}>Full journal with trade log and text entries coming in Phase 2.</Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  header:         { padding: 16, paddingTop: 52, backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerTitle:    { fontSize: 16, fontWeight: '700', color: C.amber, letterSpacing: 1 },
  headerDate:     { fontSize: 12, color: C.muted, marginTop: 2 },
  sectionLabel:   { fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },
  emojiRow:       { flexDirection: 'row', gap: 8, marginBottom: 20 },
  emojiBtn:       { flex: 1, alignItems: 'center', padding: 12, backgroundColor: C.surface, borderRadius: 10, borderWidth: 0.5, borderColor: C.border },
  emojiBtnActive: { borderColor: C.amber },
  emojiIcon:      { fontSize: 22, marginBottom: 4 },
  emojiLabel:     { fontSize: 10, color: C.muted, fontWeight: '500' },
  saveBtn:        { backgroundColor: C.amber, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText:    { fontWeight: '700', color: '#0A0B0D', fontSize: 14 },
  note:           { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 24, lineHeight: 18 },
})