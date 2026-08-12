import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://utascieoahvubrbmijyy.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0YXNjaWVvYWh2dWJyYm1panl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0OTgxOTEsImV4cCI6MjEwMjA3NDE5MX0.7PXhVSGt_LKL9JmH8IITFuYhIJ2j4AoLGJspBiRIkaw'

let clientInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    const url = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
    clientInstance = createClient(url, anonKey)
  }
  return clientInstance
}

export const supabase: SupabaseClient = getSupabaseClient()
