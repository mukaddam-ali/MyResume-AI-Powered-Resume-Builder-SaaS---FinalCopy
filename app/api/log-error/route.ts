import { NextResponse } from "next/server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/log-error — client error sink.
 * Writes structured console.error lines that show up in Vercel → Logs
 * (filter for "[client-error]"). No storage, no PII beyond what the
 * client sends; capped and rate limited.
 */
export async function POST(req: Request) {
    const limit = rateLimit(`log-error:${getClientIp(req)}`, 10, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    try {
        const body = await req.json();
        const message = typeof body.message === 'string' ? body.message.slice(0, 500) : 'unknown';
        const stack = typeof body.stack === 'string' ? body.stack.slice(0, 2000) : undefined;
        const url = typeof body.url === 'string' ? body.url.slice(0, 200) : '';
        const ua = typeof body.ua === 'string' ? body.ua.slice(0, 200) : '';

        console.error(`[client-error] ${url} | ${message}${ua ? ` | ua=${ua}` : ''}${stack ? `\n${stack}` : ''}`);
    } catch {
        // Malformed report — nothing to do
    }

    return NextResponse.json({ ok: true });
}
