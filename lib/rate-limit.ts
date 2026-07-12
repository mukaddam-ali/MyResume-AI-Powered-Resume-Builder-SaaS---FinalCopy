/**
 * Simple in-memory sliding-window rate limiter for API routes.
 * Per-instance only (resets on cold start) — enough to stop casual abuse of
 * the AI endpoints. Swap for Upstash/Redis if you need multi-instance limits.
 */

interface WindowEntry {
    timestamps: number[];
}

const buckets = new Map<string, WindowEntry>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

/**
 * @param key      unique key, e.g. `${routeName}:${ip}`
 * @param limit    max requests per window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();

    // Bound memory: drop everything if the map grows pathologically large
    if (buckets.size > MAX_BUCKETS) buckets.clear();

    let entry = buckets.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        buckets.set(key, entry);
    }

    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

    if (entry.timestamps.length >= limit) {
        const oldest = entry.timestamps[0];
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
        };
    }

    entry.timestamps.push(now);
    return {
        allowed: true,
        remaining: limit - entry.timestamps.length,
        retryAfterSeconds: 0,
    };
}

/** Best-effort client IP extraction behind common proxies. */
export function getClientIp(req: Request): string {
    const fwd = req.headers.get('x-forwarded-for');
    if (fwd) return fwd.split(',')[0].trim();
    return req.headers.get('x-real-ip') || 'unknown';
}

/** Standard 429 JSON body + headers for a failed rate-limit check. */
export function rateLimitResponse(result: RateLimitResult) {
    return new Response(
        JSON.stringify({
            error: 'Too many requests. Please slow down and try again shortly.',
            retryAfter: result.retryAfterSeconds,
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(result.retryAfterSeconds),
            },
        }
    );
}
