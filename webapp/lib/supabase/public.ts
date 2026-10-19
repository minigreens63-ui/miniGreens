import { createClient } from "@supabase/supabase-js";
import type { Database } from "@mobile/database";

/**
 * Cookie-free client for public, non-user-specific reads (product catalog,
 * categories). Unlike `createSupabaseServerClient`, this never touches
 * `cookies()`, so routes that only use this stay statically cacheable
 * (`export const revalidate`) instead of being forced fully dynamic.
 */
export function createSupabasePublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
