import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { saveToken } from '../lib/storage'

const C = {
  bg:      '#0A0B0D',
  surface: '#111318',
  border:  '#252830',
  amber:   '#F59E0B',
  muted:   '#8B90A0',
  text:    '#F0F2F5',
  red:     '#EF4444',
}

export default function LoginScreen({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleLogin() {
    if (!email || !password) { setError('Enter email and password'); return }
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('https://dhan-option-chain.vercel.app/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      // For now store email as token — works for API calls
      await saveToken(email)
      onLogin(email)
    } catch(e) {
      // Even if fetch fails, let them in for UI testing
      await saveToken(email)
      onLogin(email)
    }
    setLoading(false)
  }

  return (
    <View style={s.container}>
      <View style={s.logo}>
        <Text style={s.logoText}>DHAN CHAIN</Text>
        <Text style={s.tagline}>Paper Trades</Text>
      </View>

      <Text style={s.sub}>Practice F&O without risk.{'\n'}Find your edge.</Text>

      <View style={s.form}>
        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor={C.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor={C.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {error && <Text style={s.error}>{error}</Text>}

      <TouchableOpacity
        style={[s.btn, loading && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#0A0B0D" />
          : <Text style={s.btnText}>Enter App</Text>
        }
      </TouchableOpacity>

      <Text style={s.hint}>Demo mode — enter any email + password</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:C.bg, alignItems:'center', justifyContent:'center', padding:32 },
  logo:      { alignItems:'center', marginBottom:24 },
  logoText:  { fontSize:28, fontWeight:'700', color:C.amber, letterSpacing:2 },
  tagline:   { fontSize:13, color:C.muted, letterSpacing:1, marginTop:4 },
  sub:       { fontSize:15, color:C.muted, textAlign:'center', lineHeight:22, marginBottom:32 },
  form:      { width:'100%', gap:12, marginBottom:16 },
  input:     { width:'100%', backgroundColor:C.surface, borderWidth:0.5, borderColor:C.border, borderRadius:8, padding:14, color:C.text, fontSize:14 },
  btn:       { backgroundColor:C.amber, paddingVertical:14, borderRadius:8, width:'100%', alignItems:'center', marginTop:8 },
  btnText:   { fontSize:15, fontWeight:'600', color:'#0A0B0D' },
  error:     { color:C.red, fontSize:12, marginBottom:8 },
  hint:      { fontSize:11, color:C.muted, marginTop:16, opacity:0.5 },
})