import { NextResponse } from 'next/server';
import { normalizeResumeData } from '@/lib/normalizeResume';
import { runParseTest, scoreParse } from '@/lib/ats/parse-test';
import { computeWritingMetrics, computeStructureMetrics, scoreCategories } from '@/lib/ats/metrics';
import { matchJobDescription, detectResumeSkills } from '@/lib/ats/keywords';
import { getUserAndTier } from '@/lib/entitlements-server';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export const maxDuration = 60;

/**
 * POST /api/ats/scan — the real, deterministic ATS scan.
 *
 * 1. Renders the user's actual PDF and re-parses it with a real text
 *    extractor (what an ATS does on upload) → parse subscore + "ATS view".
 * 2. Computes measurable writing/structure metrics → impact/brevity/style/
 *    structure subscores. Same resume in = same score out, every time.
 * 3. Pro + job description → deterministic keyword match with synonyms.
 */
export async function POST(req: Request) {
    const limit = rateLimit(`ats-scan:${getClientIp(req)}`, 10, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    let body: { resumeData?: unknown; jobDescription?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.resumeData || typeof body.resumeData !== 'object') {
        return NextResponse.json({ error: 'resumeData is required' }, { status: 400 });
    }
    const jobDescription = typeof body.jobDescription === 'string'
        ? body.jobDescription.trim().slice(0, 12_000)
        : '';

    try {
        const data = normalizeResumeData(body.resumeData);

        // Deterministic pipeline
        const [parse, { tier }] = await Promise.all([
            runParseTest(data),
            getUserAndTier(),
        ]);

        const writing = computeWritingMetrics(data);
        const structure = computeStructureMetrics(data);
        const categories = scoreCategories(writing, structure);
        const parseScore = scoreParse(parse, structure.hasEmail, structure.hasPhone);

        // JD keyword matching is a Pro feature
        const match = tier === 'pro' && jobDescription.length >= 30
            ? matchJobDescription(data, jobDescription)
            : null;

        // Overall: parse test is weighted heaviest — it's what an ATS actually
        // gates on. Fixed weights → reproducible score.
        const weights = match
            ? { parse: 0.35, impact: 0.15, structure: 0.15, brevity: 0.10, style: 0.05, match: 0.20 }
            : { parse: 0.40, impact: 0.20, structure: 0.20, brevity: 0.12, style: 0.08, match: 0 };
        const score = Math.round(
            parseScore * weights.parse +
            categories.impact * weights.impact +
            categories.structure * weights.structure +
            categories.brevity * weights.brevity +
            categories.style * weights.style +
            (match ? match.matchRate * weights.match : 0)
        );

        // Deterministic feedback + red flags derived from the measurements
        const feedback: string[] = [];
        const red_flags: string[] = [];

        if (parse.ok) {
            feedback.push(`Parse test: ${parse.extractionRate}% of your content was successfully extracted from the actual PDF.`);
            if (parse.extractionRate < 85) red_flags.push('A meaningful share of your content did not survive PDF text extraction — an ATS may miss it.');
        } else {
            red_flags.push(parse.error || 'The PDF could not be parsed — an ATS would likely reject it.');
        }
        if (structure.hasEmail && !parse.emailFound) red_flags.push('Your email address was not detectable in the parsed PDF text.');
        if (parse.headingsMissing.length > 0) red_flags.push(`Section heading(s) not found by the parser: ${parse.headingsMissing.join(', ')}. ATS field-mapping may fail for them.`);
        if (parse.twoColumnLayout) feedback.push('This template uses a two-column layout. Your content extracted in the order shown in the ATS View tab — older ATS parsers read columns in unpredictable order.');
        if (parse.pageCount > 2) red_flags.push(`Resume is ${parse.pageCount} pages — most screeners expect 1–2.`);

        if (writing.bulletCount > 0) {
            feedback.push(`${writing.quantifiedPct}% of your bullet points contain measurable results (aim for 60%+).`);
            feedback.push(`${writing.actionVerbPct}% of bullets start with a strong action verb.`);
        } else {
            red_flags.push('No bullet points found in experience/projects — add detailed, measurable achievements.');
        }
        if (writing.firstPersonCount > 0) red_flags.push(`${writing.firstPersonCount} bullet(s) use first-person pronouns ("I", "my") — resume convention omits them.`);
        if (writing.weakOpenerCount > 0) feedback.push(`${writing.weakOpenerCount} bullet(s) open with weak phrasing ("responsible for", "helped") — lead with an action verb instead.`);
        if (!writing.dateConsistent) red_flags.push(`Mixed date formats detected (${writing.dateFormats.join(' vs ')}) — pick one style for clean ATS date parsing.`);
        if (!structure.hasSummary) feedback.push('Add a professional summary — parsers and recruiters both key off it.');
        if (structure.skillCount < 5 && structure.skillCount > 0) feedback.push('Fewer than 5 skills listed — keyword matching is where ATS ranking happens.');

        const summary = parse.ok
            ? `Deterministic scan of your rendered PDF: ${parse.extractionRate}% content extraction, ${writing.quantifiedPct}% quantified bullets${match ? `, ${match.matchRate}% job-description keyword match` : ''}.`
            : 'The PDF parse test failed — fix the flagged issues and re-scan.';

        return NextResponse.json({
            score,
            deterministic: true,
            category_scores: categories,
            parse_score: parseScore,
            keywords: match
                ? { found: match.found, missing: match.missing }
                : { found: detectResumeSkills(data), missing: [] },
            match_rate: match?.matchRate ?? null,
            jd_skill_count: match?.jdSkillCount ?? null,
            parse: {
                ok: parse.ok,
                extractionRate: parse.extractionRate,
                emailFound: parse.emailFound,
                phoneFound: parse.phoneFound,
                linkedinFound: parse.linkedinFound,
                headingsFound: parse.headingsFound,
                headingsMissing: parse.headingsMissing,
                headingOrder: parse.headingOrder,
                twoColumnLayout: parse.twoColumnLayout,
                pageCount: parse.pageCount,
                extractedText: parse.extractedText,
            },
            metrics: {
                bulletCount: writing.bulletCount,
                quantifiedPct: writing.quantifiedPct,
                actionVerbPct: writing.actionVerbPct,
                avgBulletWords: writing.avgBulletWords,
                totalWords: writing.totalWords,
            },
            feedback,
            red_flags,
            summary,
        });
    } catch (error) {
        console.error('ATS scan error:', error);
        return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 });
    }
}
