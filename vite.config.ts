import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL || 'https://utascieoahvubrbmijyy.supabase.co'
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0YXNjaWVvYWh2dWJyYm1panl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0OTgxOTEsImV4cCI6MjEwMjA3NDE5MX0.7PXhVSGt_LKL9JmH8IITFuYhIJ2j4AoLGJspBiRIkaw'
    ),
  },
})
