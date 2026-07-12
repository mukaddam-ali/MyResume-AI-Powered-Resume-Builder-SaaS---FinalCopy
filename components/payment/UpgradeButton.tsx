"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
// "/pure" entrypoint: the default import injects the Stripe.js <script> (and
// its m.stripe.com fraud-beacon cookie) as a side effect on EVERY page that
// bundles this component. /pure only loads Stripe when loadStripe() is called
// — i.e. when the upgrade dialog actually opens.
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Shield, Sparkles, LogIn } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { useAuth } from "@/lib/auth-context";

// The local "instant upgrade" shortcut only exists in dev builds — in
// production the only way to Pro is a server-verified payment.
const IS_DEV = process.env.NODE_ENV === "development";
const IS_STRIPE_TEST_MODE = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").startsWith("pk_test_");

// NOTE: stripePromise is intentionally NOT initialized at module level.
// Stripe.js (236 KiB) is deferred and only loaded when the user opens the
// Upgrade dialog — keeping it off the critical path on every other page.

interface UpgradeButtonProps {
    size?: "default" | "sm" | "lg" | "icon";
    variant?: "default" | "premium" | "outline" | "ghost";
    className?: string;
    children?: React.ReactNode;
    fullWidth?: boolean;
}

export default function UpgradeButton({
    size = "default",
    variant = "premium",
    className = "",
    children,
    fullWidth = false,
}: UpgradeButtonProps) {
    const [open, setOpen] = useState(false);
    const [clientSecret, setClientSecret] = useState("");
    const [intentError, setIntentError] = useState<string | null>(null);
    const { userTier, setUserTier } = useResumeStore();
    const { user, signInWithGoogle } = useAuth();

    // Lazy Stripe: ref holds the promise once loaded; null until dialog first opens.
    const stripePromiseRef = useRef<ReturnType<typeof loadStripe> | null>(null);
    const [stripeReady, setStripeReady] = useState(false);

    React.useEffect(() => {
        if (!open) return;

        // Initialize Stripe only on first open
        if (!stripePromiseRef.current) {
            const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
            if (key) {
                stripePromiseRef.current = loadStripe(key);
                setStripeReady(true);
            }
        } else {
            setStripeReady(true);
        }

        // Fetch payment intent only if Stripe is configured and the user is
        // signed in (purchases are linked to accounts server-side)
        if (stripePromiseRef.current && userTier === 'free' && user) {
            setIntentError(null);
            fetch("/api/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })
                .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Could not start checkout.");
                    setClientSecret(data.clientSecret);
                })
                .catch((error) => {
                    console.error("Error fetching payment intent:", error);
                    setIntentError(error.message || "Could not start checkout.");
                });
        }
    }, [open, userTier, user]);

    const stripePromise = stripeReady ? stripePromiseRef.current : null;

    const appearance = {
        theme: 'stripe' as const,
        variables: {
            colorPrimary: '#f59e0b',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            borderRadius: '8px',
        },
    };

    const options = {
        clientSecret,
        appearance,
    };

    // Don't render if user is already pro
    if (userTier === 'pro') {
        return null;
    }

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={`gap-1 sm:gap-2 shadow-lg hover:shadow-xl transition-shadow ${fullWidth ? 'w-full' : ''} ${className}`}
                onClick={() => setOpen(true)}
                aria-label="Upgrade to Pro"
            >
                <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                <span className="hidden sm:inline">{children || "Upgrade to Pro"}</span>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-0">
                    {/* Header with Gradient Background */}
                    <div className="relative bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 px-6 py-8 text-white">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

                        <DialogHeader className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-6 w-6" />
                                <DialogTitle className="text-3xl font-bold">Upgrade to Pro</DialogTitle>
                            </div>
                            <DialogDescription className="text-amber-50 text-base">
                                Unlock premium features and take your resume to the next level
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 space-y-6">
                        {/* Pricing Card */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border-2 border-amber-200 dark:border-amber-800">
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-5xl font-bold text-gray-900 dark:text-white">$20</span>
                                <span className="text-gray-500 dark:text-gray-400">/lifetime</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">One-time payment, unlimited access</p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid gap-3">
                            <FeatureItem
                                icon={<Zap className="h-4 w-4" />}
                                text="Advanced AI Resume Analysis"
                            />
                            <FeatureItem
                                icon={<Star className="h-4 w-4" />}
                                text="Access to Premium Templates"
                            />
                            <FeatureItem
                                icon={<Shield className="h-4 w-4" />}
                                text="Priority Email Support"
                            />
                            <FeatureItem
                                icon={<Check className="h-4 w-4" />}
                                text="Unlimited Resume Exports"
                            />
                        </div>

                        {/* Payment Section */}
                        <div className="border-t pt-6">
                            {!user && stripePromise ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                                            <Shield className="h-4 w-4 inline mr-1" />
                                            Sign in first so Pro is saved to your account and works on all your devices.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => signInWithGoogle()}
                                        className="w-full"
                                        size="lg"
                                        variant="outline"
                                    >
                                        <LogIn className="h-4 w-4 mr-2" />
                                        Sign in with Google to continue
                                    </Button>
                                </div>
                            ) : clientSecret && stripePromise ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Shield className="h-4 w-4 text-green-600" />
                                        <span>Secured by Stripe{IS_STRIPE_TEST_MODE ? " • Test Mode" : ""}</span>
                                    </div>
                                    <Elements options={options} stripe={stripePromise}>
                                        <CheckoutForm onSuccess={() => setOpen(false)} />
                                    </Elements>
                                    {IS_STRIPE_TEST_MODE && (
                                        <p className="text-xs text-center text-muted-foreground">
                                            Test card: 4242 4242 4242 4242 • Any future date • Any CVC
                                        </p>
                                    )}
                                </div>
                            ) : !stripePromise ? (
                                IS_DEV ? (
                                    <div className="space-y-4">
                                        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                            <p className="text-sm text-amber-800 dark:text-amber-200 text-center mb-3">
                                                <Shield className="h-4 w-4 inline mr-1" />
                                                Stripe not configured — dev-only instant upgrade below.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setUserTier('pro');
                                                setOpen(false);
                                            }}
                                            className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
                                            size="lg"
                                        >
                                            <Zap className="h-4 w-4 mr-2" />
                                            Instant Upgrade (Dev Only)
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="bg-muted border rounded-lg p-4">
                                        <p className="text-sm text-muted-foreground text-center">
                                            Payments are temporarily unavailable. Please check back soon.
                                        </p>
                                    </div>
                                )
                            ) : intentError ? (
                                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <p className="text-sm text-red-700 dark:text-red-300 text-center">{intentError}</p>
                                </div>
                            ) : (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                </div>
                            )}
                        </div>

                        {/* Trust Badges */}
                        <div className="flex items-center justify-center gap-4 pt-4 border-t text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                <span>Secure</span>
                            </div>
                            <div className="h-4 w-px bg-border"></div>
                            <div className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                <span>Instant Access</span>
                            </div>
                            <div className="h-4 w-px bg-border"></div>
                            <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                <span>No Subscription</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white">
                {icon}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{text}</span>
        </div>
    );
}
