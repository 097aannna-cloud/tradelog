import { Tabs } from 'expo-router'
import { Text, View } from 'react-native'
import { C } from '../../theme'

function Icon({ emoji, label, focused }) {
  return (
    <View style={{ alignItems:'center', paddingTop:4 }}>
      <Text style={{ fontSize:20 }}>{emoji}</Text>
      <Text style={{
        fontSize:9, marginTop:2,
        color: focused ? C.amber : C.textTer,
        fontWeight: focused ? '700' : '400',
      }}>{label}</Text>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: C.surface,
        borderTopColor:  C.border,
        borderTopWidth:  1,
        height: 62,
      },
    }}>
      <Tabs.Screen name="index"
        options={{ tabBarIcon: p => <Icon emoji="🏠" label="Home" focused={p.focused}/> }}/>
      <Tabs.Screen name="trade"
        options={{ tabBarIcon: p => <Icon emoji="⚡" label="Trade" focused={p.focused}/> }}/>
      <Tabs.Screen name="journal"
        options={{ tabBarIcon: p => <Icon emoji="📓" label="Journal" focused={p.focused}/> }}/>
      <Tabs.Screen name="analytics"
        options={{ tabBarIcon: p => <Icon emoji="📊" label="Analytics" focused={p.focused}/> }}/>
      <Tabs.Screen name="profile"
        options={{ tabBarIcon: p => <Icon emoji="👤" label="Profile" focused={p.focused}/> }}/>
    </Tabs>
  )
}