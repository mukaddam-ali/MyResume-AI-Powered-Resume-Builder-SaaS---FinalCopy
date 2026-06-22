/**
 * Server-only Supabase utilities.
 * IMPORTANT: Do NOT import this file from any client component or shared module.
 * Only use in: app/api routes, Server Components, middleware.
 */
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

/**
 * Creates a Supabase client for API route handlers.
 * Reads the user session from the incoming request's cookies.
 * Returns null if Supabase is not configured.
 */
export const createRouteClient = async () => {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignored in read-only contexts (e.g. RSC)
        }
      },
    },
  });
};
