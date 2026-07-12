import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserAndTier } from "@/lib/entitlements-server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const PRO_PRICE_USD_CENTS = 2000; // $20.00 lifetime

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { typescript: true }) : null;

export async function POST(req: Request) {
    if (!stripe) {
        return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
    }

    const limit = rateLimit(`payment-intent:${getClientIp(req)}`, 5, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    // Payment intents are tied to a signed-in user so the purchase can be
    // verified and recorded against their account.
    const { user, tier } = await getUserAndTier();
    if (!user) {
        return NextResponse.json(
            { error: "Please sign in before upgrading so we can link the purchase to your account." },
            { status: 401 }
        );
    }
    if (tier === 'pro') {
        return NextResponse.json({ error: "You already have Pro access." }, { status: 409 });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: PRO_PRICE_USD_CENTS,
            currency: "usd",
            automatic_payment_methods: { enabled: true },
            receipt_email: user.email ?? undefined,
            metadata: {
                user_id: user.id,
                product: "pro_lifetime",
            },
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Stripe payment intent error:", error);
        return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 502 });
    }
}
