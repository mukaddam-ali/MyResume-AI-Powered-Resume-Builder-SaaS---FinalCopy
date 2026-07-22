import { NextResponse } from "next/server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getUserAndTier } from "@/lib/entitlements-server";
import { condenseResumeForCoverLetter } from "@/lib/ai/coverLetter/condense";
import { buildAnalyzePrompt } from "@/lib/ai/coverLetter/prompts";
import { callGroqStage, runStageWithRetry } from "@/lib/ai/coverLetter/runStage";
import { safeParseJson } from "@/lib/ai/coverLetter/parseStageOutput";
import { coverLetterAnalysisSchema } from "@/lib/ai/coverLetter/types";

export const maxDuration = 30;

/**
 * POST /api/ai/job-match
 * Single-call AI reasoning for "why does this resume fit (or not fit) this
 * job" — reuses the cover letter pipeline's Stage A (analyze) prompt/schema
 * as-is, since that step already produces exactly this: matching evidence
 * and honest gaps grounded in the resume. The 0-100 match percentage itself
 * is computed separately, client-side and for free, by the deterministic
 * keyword matcher in lib/ats/keywords.ts — this endpoint only supplies the
 * qualitative "why."
 */
export async function POST(req: Request) {
    const ipLimit = rateLimit(`ai-job-match:${getClientIp(req)}`, 10, 60_000);
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: "AI service is not configured." }, { status: 500 });
    }

    const { user, tier } = await getUserAndTier();
    if (!user) {
        return NextResponse.json({ error: "Sign in to get an AI match insight." }, { status: 401 });
    }
    if (tier !== "pro") {
        return NextResponse.json({ error: "AI match insight is a Pro feature." }, { status: 403 });
    }

    const userLimit = rateLimit(`ai-job-match-user:${user.id}`, 30, 24 * 60 * 60_000);
    if (!userLimit.allowed) return rateLimitResponse(userLimit);

    let resumeData: any, jobDescription: unknown;
    try {
        ({ resumeData, jobDescription } = await req.json());
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!resumeData || typeof resumeData !== "object") {
        return NextResponse.json({ error: "Resume data is required." }, { status: 400 });
    }
    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 30) {
        return NextResponse.json({ error: "Please paste the job description (at least a few sentences)." }, { status: 400 });
    }

    const condensed = condenseResumeForCoverLetter(resumeData);
    const safeJobDescription = jobDescription.trim().slice(0, 4000);
    const deadline = Date.now() + 20_000;

    try {
        const analysis = await runStageWithRetry("job-match", deadline, async () => {
            const { system, prompt } = buildAnalyzePrompt(condensed, safeJobDescription, "", "professional");
            const text = await callGroqStage({
                system,
                prompt,
                temperature: 0.3,
                maxTokens: 1400,
                timeoutMs: 15_000,
                deadline,
            });
            return safeParseJson(text, coverLetterAnalysisSchema);
        });

        return NextResponse.json({ analysis });
    } catch (error) {
        console.error("Job match analysis failed:", error);
        return NextResponse.json({ error: "Couldn't analyze the match right now. Please try again." }, { status: 500 });
    }
}
