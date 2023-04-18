// import { createClient } from "@supabase/supabase-js";
import { createServerClient, createBrowserClient } from '@supabase/auth-helpers-remix'
import type { Database } from './supabase-types'
export type { Database } from './supabase-types'

export function sb(request: Request, response: Response) {
  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response }
  );
}