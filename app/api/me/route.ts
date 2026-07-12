import { NextResponse } from "next/server";
import { getUserAndTier } from "@/lib/entitlements-server";

/**
 * GET /api/me — the client's source of truth for the signed-in user's tier.
 */
export async function GET() {
    const { user, tier } = await getUserAndTier();

    if (!user) {
        return NextResponse.json({ user: null, tier: 'free' });
    }

    return NextResponse.json({
        user: { id: user.id, email: user.email },
        tier,
    });
}
