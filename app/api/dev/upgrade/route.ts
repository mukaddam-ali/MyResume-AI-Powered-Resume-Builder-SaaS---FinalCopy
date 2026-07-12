import { NextResponse } from "next/server";
import { getUserAndTier, grantProTier } from "@/lib/entitlements-server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/dev/upgrade — test-mode instant upgrade.
 *
 * Only available while Stripe is NOT configured (no STRIPE_SECRET_KEY).
 * The moment real payment keys are added, this endpoint turns itself off and
 * the only path to Pro is a verified payment. This lets the product run in
 * "free Pro" test mode today without leaving a backdoor open at launch.
 */
export async function POST(req: Request) {
    if (process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json(
            { error: "Payments are enabled — upgrades require a real purchase." },
            { status: 403 }
        );
    }

    const limit = rateLimit(`dev-upgrade:${getClientIp(req)}`, 5, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    const { user, tier } = await getUserAndTier();
    if (!user) {
        return NextResponse.json({ error: "Sign in first so the upgrade sticks to your account." }, { status: 401 });
    }
    if (tier === 'pro') {
        return NextResponse.json({ tier: 'pro', persisted: true });
    }

    const persisted = await grantProTier(user.id, 'test-mode-upgrade');
    if (!persisted) {
        // SUPABASE_SERVICE_ROLE_KEY missing — the client can still flip its
        // local tier, but it will reset on the next sign-in.
        return NextResponse.json({
            tier: 'pro',
            persisted: false,
            warning: "Upgrade not saved to your account (server missing SUPABASE_SERVICE_ROLE_KEY).",
        });
    }

    return NextResponse.json({ tier: 'pro', persisted: true });
}
