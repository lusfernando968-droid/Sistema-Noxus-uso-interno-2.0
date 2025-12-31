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

// Wrapper para adicionar timeout às requisições fetch
const fetchWithTimeout = (timeout: number) => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  };
};

export const supabaseLocal = (!supabaseLocalUrl || !supabaseLocalAnonKey)
  ? createMissingEnvProxy()
  : createClient(supabaseLocalUrl, supabaseLocalAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      // Timeout de 30 segundos para prevenir requisições travadas
      fetch: fetchWithTimeout(30000),
    },
    db: {
      schema: 'public',
    },
    // Configuração de realtime para otimizar conexões WebSocket
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

