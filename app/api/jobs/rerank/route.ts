import { NextResponse } from "next/server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getUserAndTier } from "@/lib/entitlements-server";
import { condenseResumeForCoverLetter } from "@/lib/ai/coverLetter/condense";
import { buildAnalyzePrompt } from "@/lib/ai/coverLetter/prompts";
import { callGroqStage, runStageWithRetry } from "@/lib/ai/coverLetter/runStage";
import { safeParseJson } from "@/lib/ai/coverLetter/parseStageOutput";
import { coverLetterAnalysisSchema } from "@/lib/ai/coverLetter/types";

export const maxDuration = 45;

const MAX_JOBS = 10;

interface CandidateJob {
    title: string;
    company: string;
    location: string;
    url: string;
    updatedAt: string;
    matchRate: number;
    descriptionText: string;
}

/**
 * POST /api/jobs/rerank
 * Keyword matching (the free default) misses functionally-equivalent
 * experience phrased differently (e.g. a resume describing "algorithms and
 * statistical modeling" work for a job asking for "Data Science"). This
 * re-scores a short client-supplied shortlist — never the full board scan —
 * through the same holistic AI reasoning as the job-match insight feature,
 * bounding the AI cost to at most MAX_JOBS calls per click.
 */
export async function POST(req: Request) {
    const ipLimit = rateLimit(`jobs-rerank:${getClientIp(req)}`, 10, 60_000);
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

    const { user, tier } = await getUserAndTier();
    if (!user) {
        return NextResponse.json({ error: "Sign in to get AI-ranked matches." }, { status: 401 });
    }
    if (tier !== "pro") {
        return NextResponse.json({ error: "AI-ranked job matching is a Pro feature." }, { status: 403 });
    }
    const userLimit = rateLimit(`jobs-rerank-user:${user.id}`, 20, 24 * 60 * 60_000);
    if (!userLimit.allowed) return rateLimitResponse(userLimit);

    let resumeData: unknown, jobs: unknown;
    try {
        ({ resumeData, jobs } = await req.json());
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    if (!resumeData || typeof resumeData !== "object") {
        return NextResponse.json({ error: "Resume data is required." }, { status: 400 });
    }
    if (!Array.isArray(jobs) || jobs.length === 0) {
        return NextResponse.json({ error: "At least one job is required." }, { status: 400 });
    }

    const shortlist = (jobs as CandidateJob[]).slice(0, MAX_JOBS);
    const condensed = condenseResumeForCoverLetter(resumeData);
    const deadline = Date.now() + 40_000;

    const scored = await Promise.all(
        shortlist.map(async (job) => {
            try {
                const analysis = await runStageWithRetry(`job-rerank:${job.title}`, deadline, async () => {
                    const { system, prompt } = buildAnalyzePrompt(
                        condensed,
                        job.descriptionText.slice(0, 4000),
                        job.company,
                        "professional"
                    );
                    const text = await callGroqStage({
                        system,
                        prompt,
                        temperature: 0.3,
                        maxTokens: 700,
                        timeoutMs: 15_000,
                        deadline,
                    });
                    return safeParseJson(text, coverLetterAnalysisSchema);
                });
                return {
                    ...job,
                    aiMatchScore: analysis.matchScore,
                    aiSummary: analysis.matchSummary,
                };
            } catch (error) {
                console.error(`Job rerank failed for ${job.company} — ${job.title}:`, error);
                // Fall back to the keyword score for this one job rather than
                // dropping it — a single stuck Groq call shouldn't blank the list.
                return { ...job, aiMatchScore: job.matchRate, aiSummary: null };
            }
        })
    );

    scored.sort((a, b) => b.aiMatchScore - a.aiMatchScore);

    return NextResponse.json({ jobs: scored });
}
