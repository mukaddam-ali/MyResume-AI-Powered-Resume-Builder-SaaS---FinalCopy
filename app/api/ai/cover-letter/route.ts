import { NextResponse } from "next/server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getUserAndTier } from "@/lib/entitlements-server";
import { condenseResumeForCoverLetter } from "@/lib/ai/coverLetter/condense";
import { runCoverLetterPipeline } from "@/lib/ai/coverLetter/pipeline";
import type { CoverLetterStreamEvent, Tone } from "@/lib/ai/coverLetter/types";

// The 4-stage pipeline is ~4x the wall-clock of the old single call.
export const maxDuration = 90;

/**
 * POST /api/ai/cover-letter
 * Streams NDJSON progress events (one JSON object per line) while running a
 * 4-stage Groq pipeline (analyze -> outline -> draft -> critique), ending
 * with a `result` event containing the final cover letter.
 *
 * IMPORTANT: every check that can 400/401/403/429/500 must happen and
 * `return NextResponse.json(...)` BEFORE the ReadableStream below is opened —
 * HTTP status can't change once streaming starts.
 */
export async function POST(req: Request) {
    const ipLimit = rateLimit(`ai-cover-letter:${getClientIp(req)}`, 5, 60_000);
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: "AI service is not configured." }, { status: 500 });
    }

    const { user, tier } = await getUserAndTier();
    if (!user) {
        return NextResponse.json({ error: "Sign in to generate a tailored cover letter." }, { status: 401 });
    }
    if (tier !== "pro") {
        return NextResponse.json({ error: "The AI Cover Letter Generator is a Pro feature." }, { status: 403 });
    }

    // The pipeline costs ~4x a single call — a daily per-user cap in addition
    // to the per-IP one above.
    const userLimit = rateLimit(`ai-cover-letter-user:${user.id}`, 10, 24 * 60 * 60_000);
    if (!userLimit.allowed) return rateLimitResponse(userLimit);

    let resumeData: any, jobDescription: unknown, company: unknown, tone: unknown;
    try {
        ({ resumeData, jobDescription, company, tone } = await req.json());
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!resumeData || typeof resumeData !== "object") {
        return NextResponse.json({ error: "Resume data is required." }, { status: 400 });
    }
    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 30) {
        return NextResponse.json({ error: "Please paste the job description (at least a few sentences)." }, { status: 400 });
    }

    const safeTone: Tone = ["professional", "enthusiastic", "concise"].includes(tone as string)
        ? (tone as Tone)
        : "professional";
    const safeCompany = typeof company === "string" ? company.slice(0, 120) : "";
    const safeJobDescription = jobDescription.trim().slice(0, 4000);
    const condensed = condenseResumeForCoverLetter(resumeData);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const emit = (event: CoverLetterStreamEvent) => {
                controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            };
            try {
                const result = await runCoverLetterPipeline({
                    condensed,
                    jobDescription: safeJobDescription,
                    company: safeCompany,
                    tone: safeTone,
                    emit,
                });
                emit({ type: "result", coverLetter: result.coverLetter, meta: result.meta });
            } catch (error) {
                console.error("Cover letter pipeline failed:", error);
                emit({ type: "error", message: "Failed to generate the cover letter. Please try again." });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        status: 200,
        headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    });
}
