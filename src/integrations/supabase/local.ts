import { createClient } from '@supabase/supabase-js'

const supabaseLocalUrl = import.meta.env.VITE_SUPABASE_LOCAL_URL
const supabaseLocalAnonKey = import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY
export const isSupabaseLocalConfigured = Boolean(supabaseLocalUrl && supabaseLocalAnonKey)

function createMissingEnvProxy() {
  const message = "Supabase local não configurado: defina VITE_SUPABASE_LOCAL_URL e VITE_SUPABASE_LOCAL_ANON_KEY."
  return new Proxy({}, {
    get() {
      throw new Error(message)
    }
  }) as any
}

export const supabaseLocal = (!supabaseLocalUrl || !supabaseLocalAnonKey)
  ? createMissingEnvProxy()
  : createClient(supabaseLocalUrl, supabaseLocalAnonKey)

