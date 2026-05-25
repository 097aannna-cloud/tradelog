import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const SUPABASE_URL = 'https://qujueelykezjqzqmagmb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1anVlZWx5a2V6anF6cW1hZ21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTc1NzAsImV4cCI6MjA5MzY3MzU3MH0' +
  '.H8G5LzAvuEOO0j_AVPiascuA8EsKCkP9Z_ui5RGM4vA'

const store = {
  getItem:    k => SecureStore.getItemAsync(k),
  setItem:    (k,v) => SecureStore.setItemAsync(k,v),
  removeItem: k => SecureStore.deleteItemAsync(k),
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: store,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})