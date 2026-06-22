import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js';

// Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl && supabaseKey;

// FIXED: Client-side Supabase client using cookies (for use in client components)
export const createBrowserClient = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }

  return createSSRBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        fetch: async (url, options) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for client auth queries
          try {
            const res = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return res;
          } catch (err) {
            clearTimeout(timeoutId);
            // Return a mock offline response to silence raw browser console TypeError
            return new Response(
              JSON.stringify({
                error: 'service_unavailable',
                error_description: 'Supabase server is unreachable or request timed out.'
              }),
              {
                status: 400,
                statusText: 'Bad Request',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        }
      }
    }
  )
};

// Standard client for NON-AUTH database queries only (e.g. public templates)
// persistSession:false prevents it from competing with the SSR cookie-based client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: {
        fetch: async (url, options) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for public queries
          try {
            const res = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return res;
          } catch (err) {
            clearTimeout(timeoutId);
            // Return a mock offline response to silence raw browser console TypeError
            return new Response(
              JSON.stringify({
                error: 'service_unavailable',
                error_description: 'Supabase server is unreachable or request timed out.'
              }),
              {
                status: 400,
                statusText: 'Bad Request',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        }
      }
    })
  : null;

// Helper to check if Supabase is configured
export const isSupabaseReady = () => isSupabaseConfigured;

// Database types (will be extended as needed)
export type Database = {
  public: {
    Tables: {
      resumes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          data: any;
          last_modified: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          data: any;
          last_modified?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          data?: any;
          last_modified?: string;
          created_at?: string;
        };
      };
      public_templates: {
        Row: {
          id: string;
          resume_id: string;
          user_id: string;
          resume_data: any;
          resume_name: string;
          template_type: string;
          job_title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          user_id: string;
          resume_data: any;
          resume_name: string;
          template_type: string;
          job_title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          user_id?: string;
          resume_data?: any;
          resume_name?: string;
          template_type?: string;
          job_title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
