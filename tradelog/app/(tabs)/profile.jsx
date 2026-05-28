import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { C, R, S } from '../../theme'

const TIERS   = ['Rookie','Trader','Pro','Elite']
const TIER_XP = [0, 500, 2000, 5000]

export default function Profile() {
  const { user, profile, setUser, setProfile, closedTrades } = useStore()
  const ti  = TIERS.indexOf(profile?.tier||'Rookie')
  const nxt = TIERS[ti+1]
  const xp  = profile?.xp || 0
  const prg = nxt
    ? Math.min(100, Math.round((xp-TIER_XP[ti])/(TIER_XP[ti+1]-TIER_XP[ti])*100))
    : 100
  const wr  = profile?.total_trades
    ? Math.round((profile.win_count||0)/profile.total_trades*100) : 0

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll}>

        {/* Avatar */}
        <View style={s.top}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>
              {(profile?.display_name||user?.email||'T')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={s.name}>
            {profile?.display_name || user?.email?.split('@')[0] || 'Trader'}
          </Text>
          <View style={[s.tierBadge, {
            backgroundColor:
              profile?.tier==='Elite'?C.purple:
              profile?.tier==='Pro'?C.blue:
              profile?.tier==='Trader'?C.green:C.amber
          }]}>
            <Text style={s.tierTxt}>{profile?.tier||'Rookie'}</Text>
          </View>
        </View>

        {/* XP bar */}
        <View style={s.xpCard}>
          <View style={s.xpRow}>
            <Text style={s.xpVal}>{xp} XP</Text>
            {nxt&&<Text style={s.xpNext}>{TIER_XP[ti+1]-xp} to {nxt}</Text>}
          </View>
          <View style={s.track}>
            <View style={[s.fill,{width:prg+'%'}]}/>
          </View>
        </View>

        {/* Stats */}
        <View style={s.grid}>
          {[
            ['Trades',   profile?.total_trades||0,  C.text ],
            ['Win Rate', wr+'%',                    C.green],
            ['Streak',   (profile?.streak||0)+'d',  C.amber],
            ['Balance',  '₹'+((( profile?.virtual_balance||1000000)/100000).toFixed(1))+'L', C.blue],
          ].map(([l,v,c])=>(
            <View key={l} style={s.statCard}>
              <Text style={s.statL}>{l}</Text>
              <Text style={[s.statV,{color:c}]}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <Text style={s.secTitle}>Badges</Text>
        <View style={s.badges}>
          {[
            ['🎯','First Trade',  (profile?.total_trades||0)>=1  ],
            ['🏆','10 Trades',    (profile?.total_trades||0)>=10 ],
            ['💯','100 Trades',   (profile?.total_trades||0)>=100],
            ['🔥','7-Day Streak', (profile?.best_streak||0)>=7   ],
            ['📓','Journaler',    false                           ],
          ].map(([e,l,earned])=>(
            <View key={l} style={[s.badge, !earned&&s.badgeLocked]}>
              <Text style={s.badgeEmoji}>{e}</Text>
              <Text style={[s.badgeLbl,
                !earned&&{color:C.textTer}]}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Sign out */}
        {user&&(
          <TouchableOpacity
            onPress={async()=>{
              await supabase.auth.signOut()
              setUser(null); setProfile(null)
            }}
            style={s.signOut}>
            <Text style={s.signOutTxt}>Sign Out</Text>
          </TouchableOpacity>
        )}

        <View style={{height:32}}/>
      </ScrollView>
    </SafeAreaView>
  )
}

const sw2 = 160
const s = StyleSheet.create({
  safe:       { flex:1, backgroundColor:C.bg },
  scroll:     { flex:1, padding:S.lg },
  top:        { alignItems:'center', marginBottom:S.lg },
  avatar:     { width:72, height:72, borderRadius:36,
                backgroundColor:C.amber+'33',
                alignItems:'center', justifyContent:'center',
                borderWidth:2, borderColor:C.amber, marginBottom:S.sm },
  avatarTxt:  { fontSize:28, fontWeight:'700', color:C.amber },
  name:       { fontSize:18, fontWeight:'700', color:C.text, marginBottom:8 },
  tierBadge:  { paddingHorizontal:14, paddingVertical:5, borderRadius:R.full },
  tierTxt:    { fontSize:12, fontWeight:'700', color:'#0A0B0D' },
  xpCard:     { padding:S.md, backgroundColor:C.surface, borderRadius:R.md,
                borderWidth:1, borderColor:C.border, marginBottom:S.lg },
  xpRow:      { flexDirection:'row', justifyContent:'space-between',
                marginBottom:S.sm },
  xpVal:      { fontSize:13, fontWeight:'700', color:C.amber },
  xpNext:     { fontSize:11, color:C.textTer },
  track:      { height:6, backgroundColor:C.elevated,
                borderRadius:3, overflow:'hidden' },
  fill:       { height:'100%', backgroundColor:C.amber, borderRadius:3 },
  grid:       { flexDirection:'row', flexWrap:'wrap', gap:S.sm,
                marginBottom:S.lg },
  statCard:   { width:sw2, padding:S.md, backgroundColor:C.surface,
                borderRadius:R.md, borderWidth:1, borderColor:C.border },
  statL:      { fontSize:9, color:C.textTer, textTransform:'uppercase' },
  statV:      { fontSize:18, fontWeight:'700', color:C.text, marginTop:4 },
  secTitle:   { fontSize:11, fontWeight:'700', color:C.textSec,
                textTransform:'uppercase', letterSpacing:0.5,
                marginBottom:S.sm },
  badges:     { flexDirection:'row', flexWrap:'wrap', gap:S.sm,
                marginBottom:S.lg },
  badge:      { alignItems:'center', padding:S.sm, backgroundColor:C.surface,
                borderRadius:R.md, borderWidth:1,
                borderColor:C.amber+'44', minWidth:66 },
  badgeLocked:{ borderColor:C.border, opacity:0.4 },
  badgeEmoji: { fontSize:24 },
  badgeLbl:   { fontSize:9, color:C.amber, fontWeight:'600',
                marginTop:3, textAlign:'center' },
  signOut:    { paddingVertical:14, backgroundColor:C.elevated,
                borderRadius:R.md, borderWidth:1,
                borderColor:C.border, alignItems:'center' },
  signOutTxt: { fontSize:13, color:C.red, fontWeight:'600' },
})
