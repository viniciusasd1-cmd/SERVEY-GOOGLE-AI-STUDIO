import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = 'https://placeholder.supabase.co';
const defaultPublishableKey = 'placeholder-publishable-key';

export function getSupabaseUrl(): string {
  return (
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof window !== 'undefined' ? localStorage.getItem('survey_supabase_url') : null) ||
    defaultUrl
  );
}

export function getSupabasePublishableKey(): string {
  return (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (typeof window !== 'undefined' ? localStorage.getItem('survey_supabase_publishable_key') : null) ||
    defaultPublishableKey
  );
}

export function setCustomPublishableKey(key: string) {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem('survey_supabase_publishable_key', key.trim());
    } else {
      localStorage.removeItem('survey_supabase_publishable_key');
    }
  }
}

export function isSupabaseReady(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  return Boolean(
    url &&
      key &&
      url !== defaultUrl &&
      key !== defaultPublishableKey &&
      !key.startsWith('placeholder')
  );
}

export const isSupabaseConfigured = isSupabaseReady();

const currentUrl = getSupabaseUrl();
const currentKey = getSupabasePublishableKey() || 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(currentUrl, currentKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
