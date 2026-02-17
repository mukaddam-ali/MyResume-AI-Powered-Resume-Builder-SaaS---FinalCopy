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
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(';').shift()
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=${value}; path=/; ${options.maxAge ? `max-age=${options.maxAge};` : ''}`
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; path=/; max-age=0`
        },
      },
    }
  )
};

// Standard client for general use (only created if configured)
// NOTE: This uses localStorage - only use for non-auth queries
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
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
