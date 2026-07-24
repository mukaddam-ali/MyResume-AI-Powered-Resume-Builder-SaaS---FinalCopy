import { NextResponse } from "next/server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { normalizeResumeData } from "@/lib/normalizeResume";
import { matchJobDescription } from "@/lib/ats/keywords";
import { getAllGreenhouseJobs } from "@/lib/jobSearch/greenhouse";

export const maxDuration = 30;

/**
 * POST /api/jobs/search
 * Matches the user's resume against open roles pulled from a curated list of
 * public Greenhouse job boards (see lib/jobSearch/companies.ts), using the
 * same deterministic keyword matcher as the ATS scanner and cover letter
 * job-match score — no AI call, so this is free to run.
 */
export async function POST(req: Request) {
    const limit = rateLimit(`jobs-search:${getClientIp(req)}`, 10, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    let resumeData: unknown;
    try {
        ({ resumeData } = await req.json());
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    if (!resumeData || typeof resumeData !== "object") {
        return NextResponse.json({ error: "Resume data is required." }, { status: 400 });
    }

    const data = normalizeResumeData(resumeData);
    const jobs = await getAllGreenhouseJobs();

    const matched = jobs
        .filter((job) => job.descriptionText.length > 0)
        .map((job) => {
            const match = matchJobDescription(data, job.descriptionText);
            return {
                title: job.title,
                company: job.company,
                location: job.location,
                url: job.url,
                updatedAt: job.updatedAt,
                matchRate: match.matchRate,
                found: match.found,
                missing: match.missing,
                // Kept (truncated) so the client can send it straight back to
                // /api/jobs/rerank for AI re-scoring without a second fetch.
                descriptionText: job.descriptionText.slice(0, 4000),
            };
        })
        // A job with no dictionary skills detected at all can't be scored
        // meaningfully — drop it rather than showing a misleading 0%.
        .filter((job) => job.found.length + job.missing.length > 0)
        .sort((a, b) => b.matchRate - a.matchRate)
        .slice(0, 25);

    return NextResponse.json({ jobs: matched, totalScanned: jobs.length });
}
