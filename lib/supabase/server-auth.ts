import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Autenticação Supabase não configurada.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export async function verifySupabasePassword(email: string, password: string, expectedId: string) {
  const client = createSupabaseAuthClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user || data.user.id !== expectedId || !data.user.email_confirmed_at || !data.session?.access_token) return null;
  return data.session.access_token;
}
