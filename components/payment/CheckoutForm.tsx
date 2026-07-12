import React, { useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, CreditCard } from "lucide-react";

interface CheckoutFormProps {
    onSuccess: () => void;
}

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { setUserTier } = useResumeStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);
        setMessage(null);
        setMessageType(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/`,
            },
            redirect: "if_required",
        });

        if (error) {
            setMessage(error.message ?? "An unexpected error occurred.");
            setMessageType('error');
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            // The server verifies the PaymentIntent with Stripe and upgrades
            // the account — the client never grants itself Pro.
            setMessage("Payment succeeded! Activating Pro on your account...");
            setMessageType('success');
            try {
                const res = await fetch("/api/stripe/verify-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
                });
                const data = await res.json();
                if (res.ok && data.tier === "pro") {
                    setUserTier("pro");
                    setTimeout(() => {
                        onSuccess();
                    }, 1500);
                    return;
                }
                setMessage(data.error || "Payment received but activation failed. Contact support with reference " + paymentIntent.id);
                setMessageType('error');
            } catch {
                setMessage("Payment received but activation failed. Contact support with reference " + paymentIntent.id);
                setMessageType('error');
            }
        } else {
            setMessage("An unexpected error occurred.");
            setMessageType('error');
        }

        setIsLoading(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement
                id="payment-element"
                options={{
                    layout: "tabs",
                }}
            />

            <Button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                size="lg"
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Pay $20.00</span>
                    </div>
                )}
            </Button>

            {message && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${messageType === 'success'
                        ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }`}>
                    {messageType === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span>{message}</span>
                </div>
            )}
        </form>
    );
}
