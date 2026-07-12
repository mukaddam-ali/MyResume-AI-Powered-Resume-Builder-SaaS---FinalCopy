import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserAndTier, grantProTier } from "@/lib/entitlements-server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/stripe/verify-payment  { paymentIntentId }
 *
 * Called by the client after Stripe confirms a payment. The server retrieves
 * the PaymentIntent with the secret key and only grants Pro when:
 *   - the intent status is "succeeded"
 *   - the intent's metadata.user_id matches the signed-in user
 * The webhook (app/api/stripe/webhook) is the primary upgrade path; this is
 * the synchronous fallback so the user sees Pro immediately after paying.
 */
export async function POST(req: Request) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
        return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
    }

    const limit = rateLimit(`verify-payment:${getClientIp(req)}`, 10, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    const { user, tier } = await getUserAndTier();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (tier === 'pro') {
        return NextResponse.json({ tier: 'pro' });
    }

    let paymentIntentId: string | undefined;
    try {
        ({ paymentIntentId } = await req.json());
    } catch {
        // fall through to validation below
    }
    if (!paymentIntentId || typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
        return NextResponse.json({ error: "Missing or invalid paymentIntentId" }, { status: 400 });
    }

    try {
        const stripe = new Stripe(stripeKey, { typescript: true });
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (intent.status !== 'succeeded') {
            return NextResponse.json({ error: "Payment has not succeeded yet." }, { status: 402 });
        }
        if (intent.metadata?.user_id !== user.id) {
            return NextResponse.json({ error: "This payment does not belong to your account." }, { status: 403 });
        }

        const granted = await grantProTier(user.id, intent.id);
        if (!granted) {
            return NextResponse.json(
                { error: "Payment verified but account upgrade failed. Contact support with reference " + intent.id },
                { status: 500 }
            );
        }

        return NextResponse.json({ tier: 'pro' });
    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json({ error: "Could not verify the payment." }, { status: 502 });
    }
}
