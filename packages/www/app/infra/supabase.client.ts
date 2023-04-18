import { createBrowserClient } from '@supabase/auth-helpers-remix'
import type { Database } from './supabase-types'

export function sbBrowser(url: string, anonKey: string) {
  return createBrowserClient<Database>(
    url,
    anonKey,
  );
}