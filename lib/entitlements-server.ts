/**
 * Server-only entitlement helpers.
 * The user's tier lives in public.profiles and can only be changed by the
 * service role (Stripe webhook / verified payment endpoint) — never trusted
 * from the client.
 */
import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createRouteClient } from './supabase-server';

export type UserTier = 'free' | 'pro';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Privileged client that bypasses RLS. Required to change a user's tier
 * (column-level grants block the anon/authenticated roles from updating it).
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function createServiceClient(): SupabaseClient | null {
    if (!supabaseUrl || !serviceRoleKey) return null;
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

/**
 * Resolve the current request's user and tier from the session cookie.
 * Anonymous or unconfigured environments resolve to { user: null, tier: 'free' }.
 */
export async function getUserAndTier() {
    const supabase = await createRouteClient();
    if (!supabase) return { user: null, tier: 'free' as UserTier };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, tier: 'free' as UserTier };

    const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .maybeSingle();

    // Profile row may not exist yet for accounts created before the trigger
    if (!profile) {
        await supabase.from('profiles').insert({ id: user.id }).select().maybeSingle();
        return { user, tier: 'free' as UserTier };
    }

    return { user, tier: (profile.tier === 'pro' ? 'pro' : 'free') as UserTier };
}

/**
 * Upgrade a user to pro after a verified payment. Uses the service-role
 * client; returns false (with a log) if it isn't configured.
 */
export async function grantProTier(userId: string, paymentIntentId: string): Promise<boolean> {
    const service = createServiceClient();
    if (!service) {
        console.error('[entitlements] SUPABASE_SERVICE_ROLE_KEY missing — cannot grant pro tier');
        return false;
    }

    const { error } = await service
        .from('profiles')
        .upsert({
            id: userId,
            tier: 'pro',
            stripe_payment_intent_id: paymentIntentId,
            upgraded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error('[entitlements] Failed to grant pro tier:', error.message);
        return false;
    }
    return true;
}
