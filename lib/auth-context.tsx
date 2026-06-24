"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createBrowserClient, isSupabaseReady } from './supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isPremium: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userTier, setUserTier] = useState<'free' | 'pro'>('free');

    const isPremium = userTier === 'pro';

    // Check if Supabase is configured
    const supabaseConfigured = isSupabaseReady();

    // Create Supabase client once to avoid multiple GoTrueClient instances
    const supabase = useMemo(() => {
        if (!supabaseConfigured) return null;
        return createBrowserClient();
    }, [supabaseConfigured]);

    useEffect(() => {
        let active = true;
        let unsubscribeStore: (() => void) | null = null;

        // Dynamically import the store to keep it out of the layout eager JS bundle
        import('@/store/useResumeStore').then((module) => {
            if (!active) return;
            const store = module.useResumeStore;
            setUserTier(store.getState().userTier);
            unsubscribeStore = store.subscribe((state) => {
                setUserTier(state.userTier);
            });
        }).catch((err) => {
            console.error('Failed to load resume store dynamically in AuthProvider:', err);
        });

        if (!supabaseConfigured || !supabase) {
            // Supabase not configured, just set loading to false
            setLoading(false);
            return;
        }

        let subscription: { unsubscribe: () => void } | null = null;

        // Defer initial auth checks to avoid blocking the critical rendering frame
        const timeoutId = setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }).catch((err) => {
                console.warn('Supabase getSession failed (server may be unreachable):', err);
                setLoading(false);
            });

            // Listen for auth changes
            const {
                data: { subscription: sub },
            } = supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            });
            subscription = sub;
        }, 100);

        return () => {
            active = false;
            clearTimeout(timeoutId);
            if (subscription) {
                subscription.unsubscribe();
            }
            if (unsubscribeStore) {
                unsubscribeStore();
            }
        };
    }, [supabaseConfigured, supabase]);

    const signInWithGoogle = async () => {
        if (!supabaseConfigured || !supabase) {
            alert('Authentication is not configured yet.\n\nPlease follow the SETUP_GUIDE.md to configure Supabase and Google OAuth.');
            console.warn('Supabase is not configured. Please set up environment variables.');
            return;
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) console.error('Error signing in with Google:', error);
    };

    const signOut = async () => {
        if (!supabaseConfigured || !supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error signing out:', error);
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, isPremium, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
