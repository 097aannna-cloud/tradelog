import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Text, Platform, View, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { getToken, saveToken } from './lib/storage'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import TradeScreen from './screens/TradeScreen'
import JournalScreen from './screens/JournalScreen'
import AnalyticsScreen from './screens/AnalyticsScreen'

const Tab = createBottomTabNavigator()

const C = {
  bg:      '#0A0B0D',
  surface: '#111318',
  border:  '#252830',
  amber:   '#F59E0B',
  muted:   '#8B90A0',
}

const BASE = 'https://dhan-option-chain.vercel.app'

export default function App() {
  const [token, setToken]       = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const stored = await getToken()
      if (stored) {
        setToken(stored)
        setChecking(false)
        return
      }
      if (Platform.OS === 'web') {
        // Check if already signed in on the vercel domain via iframe trick
        const res = await fetch(`${BASE}/api/auth/session`, {
          credentials: 'include',
          mode: 'cors',
        })
        const data = await res.json()
        if (data?.user?.email) {
          await saveToken(data.user.email)
          setToken(data.user.email)
          setChecking(false)
          return
        }
      }
    } catch(e) {}
    setChecking(false)
  }

  if (checking) {
    return (
      <View style={{ flex:1, backgroundColor:'#0A0B0D', alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color="#F59E0B" />
      </View>
    )
  }

  if (!token) return (
    <SafeAreaProvider>
      <LoginScreen onLogin={(t) => { saveToken(t); setToken(t) }} />
    </SafeAreaProvider>
  )

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: C.surface,
              borderTopColor: C.border,
              borderTopWidth: 0.5,
              height: 60,
              paddingBottom: 8,
            },
            tabBarActiveTintColor: C.amber,
            tabBarInactiveTintColor: C.muted,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>⌂</Text> }}
          />
          <Tab.Screen
            name="Trade"
            component={TradeScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>◈</Text> }}
          />
          <Tab.Screen
            name="Journal"
            component={JournalScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>≡</Text> }}
          />
          <Tab.Screen
            name="Analytics"
            component={AnalyticsScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>↗</Text> }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}