import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

export default function RootLayout() {
  const { setUser, setProfile } = useStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
      }
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        if (session?.user) {
          setUser(session.user)
          loadProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(uid) {
    const { data } = await supabase
      .from('profiles').select('*').eq('id', uid).single()
    if (data) {
      setProfile(data)
    } else {
      const { data: np } = await supabase
        .from('profiles').insert({ id: uid }).select().single()
      if (np) setProfile(np)
    }
  }

  if (!ready) return null

  return (
    <>
      <StatusBar style="light" backgroundColor="#0A0B0D"/>
      <Stack screenOptions={{ headerShown: false }}/>
    </>
  )
}