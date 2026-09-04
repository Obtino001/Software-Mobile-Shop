import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder') &&
    supabaseUrl.startsWith('https://')
  );
};

// Create the singleton Supabase client
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'pakmobile_supabase_auth_session',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Diagnostic helper to verify live connection to Supabase cloud
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: any;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase credentials are not configured in .env',
    };
  }

  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('id, business_name')
      .limit(1);

    if (error) {
      return {
        connected: false,
        message: `Connected to Supabase URL, but query returned: ${error.message}`,
        error,
      };
    }

    return {
      connected: true,
      message: `Successfully connected to Supabase (${data?.length ?? 0} settings record found)`,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Network failure connecting to Supabase: ${err.message}`,
      error: err,
    };
  }
}
