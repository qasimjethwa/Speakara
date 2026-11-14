import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloudConfigured = !!(url && key);
let client: SupabaseClient | null = null;
/** Browser client. Only the publishable key is ever shipped; RLS protects every table. */
export function supabase(): SupabaseClient | null {
  if (!cloudConfigured) return null;
  client ??= createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}
