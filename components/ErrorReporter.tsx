"use client";

import { useEffect } from "react";

/**
 * Lightweight client-side error reporter. Uncaught errors and unhandled
 * promise rejections are POSTed to /api/log-error, which writes them to the
 * server logs (visible in Vercel → Logs). Capped per session so a render
 * loop can't flood the endpoint. Swap for Sentry later without touching
 * call sites — this is intentionally zero-dependency.
 */
const MAX_REPORTS_PER_SESSION = 5;

export function ErrorReporter() {
    useEffect(() => {
        let reported = 0;

        const report = (message: string, stack?: string) => {
            if (reported >= MAX_REPORTS_PER_SESSION) return;
            reported++;
            try {
                navigator.sendBeacon?.(
                    "/api/log-error",
                    new Blob([JSON.stringify({
                        message: String(message).slice(0, 500),
                        stack: stack ? String(stack).slice(0, 2000) : undefined,
                        url: window.location.pathname,
                        ua: navigator.userAgent.slice(0, 200),
                    })], { type: "application/json" })
                );
            } catch {
                // Never let the reporter itself throw
            }
        };

        const onError = (event: ErrorEvent) => {
            report(event.message, event.error?.stack);
        };
        const onRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            report(
                reason?.message || String(reason),
                reason?.stack
            );
        };

        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);
        return () => {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
        };
    }, []);

    return null;
}
