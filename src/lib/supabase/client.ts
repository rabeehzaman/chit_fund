import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options = {}) => {
          // Add cache-busting headers to all requests
          const headers = new Headers(options.headers)
          headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
          headers.set('Pragma', 'no-cache')
          headers.set('Expires', '0')
          
          return fetch(url, { ...options, headers })
        }
      }
    }
  )
}