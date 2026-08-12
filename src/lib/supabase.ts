import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const defaultUrl = 'https://utascieoahvubrbmijyy.supabase.co'
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0YXNjaWVvYWh2dWJyYm1panl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0OTgxOTEsImV4cCI6MjEwMjA3NDE5MX0.7PXhVSGt_LKL9JmH8IITFuYhIJ2j4AoLGJspBiRIkaw'

const url = import.meta.env.VITE_SUPABASE_URL || defaultUrl
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null
