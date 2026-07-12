import { NextResponse } from "next/server";
import Stripe from "stripe";
import { grantProTier } from "@/lib/entitlements-server";

/**
 * POST /api/stripe/webhook
 *
 * Primary entitlement path: Stripe calls this on payment_intent.succeeded and
 * the user is upgraded server-side even if they closed the tab mid-checkout.
 * Configure the endpoint in the Stripe dashboard (test mode works fine) and
 * set STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey || !webhookSecret) {
        return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey, { typescript: true });

    let event: Stripe.Event;
    try {
        const rawBody = await req.text();
        event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", (err as Error).message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object as Stripe.PaymentIntent;
        const userId = intent.metadata?.user_id;

        if (userId && intent.metadata?.product === "pro_lifetime") {
            const granted = await grantProTier(userId, intent.id);
            if (!granted) {
                // Non-2xx makes Stripe retry the delivery
                return NextResponse.json({ error: "Upgrade failed, retry" }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
