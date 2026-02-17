import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, {
    typescript: true,
}) : null;

export async function POST() {
    if (!stripe) {
        return NextResponse.json(
            { error: "Stripe not configured" },
            { status: 500 }
        );
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 2000, // $20.00
            currency: "usd",
            automatic_payment_methods: { enabled: true },
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }
}
