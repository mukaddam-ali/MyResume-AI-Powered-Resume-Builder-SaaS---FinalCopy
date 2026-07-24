import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getUserAndTier } from "@/lib/entitlements-server";
import { normalizeResumeData } from "@/lib/normalizeResume";
import { findWeakBullets } from "@/lib/ats/metrics";

/**
 * Optimize resume data to reduce token usage
 */
function optimizeResumeData(data: any) {
    return {
        summary: data.personalInfo?.summary,
        jobTitle: data.personalInfo?.jobTitle,
        skills: Array.isArray(data.skills) ? data.skills.slice(0, 30) : [],
        experience: data.experience?.map((exp: any) => ({
            role: exp.role,
            company: exp.company,
            highlights: exp.description?.substring(0, 400)
        })).slice(0, 5),
        // Projects were previously omitted entirely — for early-career resumes
        // this is often where the strongest, most concrete evidence lives.
        projects: Array.isArray(data.projects) ? data.projects.slice(0, 4).map((p: any) => ({
            name: p.name,
            technologies: p.technologies,
            highlights: p.description?.substring(0, 400)
        })) : [],
        education: data.education?.map((edu: any) => ({
            degree: edu.degree,
            school: edu.school
        })).slice(0, 2)
    };
}

export async function POST(req: Request) {
    const ipLimit = rateLimit(`ai-analyze:${getClientIp(req)}`, 6, 60_000);
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

    try {
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.error("❌ GROQ_API_KEY is not set");
            return NextResponse.json(
                {
                    error: "Invalid API Key",
                    details: "GROQ_API_KEY environment variable is not loaded.",
                    solution: "Check .env.local configuration."
                },
                { status: 500 }
            );
        }

        const { user, tier } = await getUserAndTier();
        if (!user) {
            return NextResponse.json({ error: "Sign in to run the AI analysis." }, { status: 401 });
        }
        if (tier !== "pro") {
            return NextResponse.json({ error: "AI resume analysis is a Pro feature." }, { status: 403 });
        }
        const userLimit = rateLimit(`ai-analyze-user:${user.id}`, 20, 24 * 60 * 60_000);
        if (!userLimit.allowed) return rateLimitResponse(userLimit);

        console.log("✅ Using Groq API (generateText + JSON parse)");

        const { resumeData, jobDescription } = await req.json();

        const optimizedResume = optimizeResumeData(resumeData);

        // Deterministic pass already found the specific weak bullets (which
        // entry, which line, why — capped at 15, worst first). Hand ALL of
        // them to the model to rewrite so every bullet shown in "Exactly
        // Where To Fix" gets a matching suggestion — not just the handful
        // with the most stacked issues.
        const weakBullets = findWeakBullets(normalizeResumeData(resumeData));
        const weakBulletsBlock = weakBullets.length > 0
            ? weakBullets.map((b, i) =>
                `${i + 1}. [${b.section} — ${b.entryLabel}, bullet ${b.index}] "${b.text}"\n   Issues: ${b.issues.join(' ')}`
            ).join('\n')
            : '(none detected — bullets already pass the deterministic checks)';

        const prompt = `You are an experienced technical recruiter and resume coach giving a candidate an honest, holistic read of their resume — the way you'd actually evaluate one in a stack of real applications, not a rigid keyword scraper.

A separate deterministic system already checks hard ATS-parseability facts (does the PDF text-extract cleanly, are section headings standard, etc.) — that is NOT your job here. Your score is a QUALITY read: is this a strong resume for the level it's targeting? Judge the real substance of what the candidate built and did, not just whether every bullet has a number in it. A resume with a couple of genuinely strong, technically substantial projects/experiences described in dense paragraphs can still be a strong resume — note the formatting weakness in feedback, but don't let it alone crater the score the way a truly weak, generic resume would.

That same deterministic system already flagged specific weak bullets below, with their exact location and reason. Your job for "suggested_edits" is to REWRITE THOSE EXACT BULLETS — concrete, specific rewrites the candidate can paste in directly — not to give generic advice.

CRITICAL — do not shorten or genericize a bullet just because you're rewriting it:
- Fix ONLY the specific issue(s) listed for that bullet. If "too long" is not one of its listed issues, the rewrite's length should stay close to the original (within ~15%) — do not compress it into a terse one-liner.
- Keep every concrete detail from the original: technologies, tools, scope, numbers, names of systems/projects. Never replace specifics with vaguer, more generic language. The candidate prefers longer, detail-rich bullets over short vague ones — never trade detail away for brevity.
- If the issue is "no measurable result", the suggestion must be ready to paste in as-is — never insert bracket placeholders like "[X]%" or "[Y hours]" for the candidate to fill in later. Add a number ONLY if it's a plausible, conservative estimate clearly implied by the original text. If no honest number can be inferred, leave the quantification issue alone entirely (still fix the bullet's other issues) rather than fabricating or placeholding one.
- If the issue is a weak opener or missing action verb, fix just the opening — keep the rest of the sentence's content intact.
- If the issue is "too long", that almost always means the bullet is actually SEVERAL distinct achievements run together in one paragraph. The fix is to SPLIT it into multiple separate bullet points — one achievement per bullet — NOT to shrink it into a single shorter sentence. Every concrete detail from the original (technologies, systems, numbers) must still appear somewhere across the split bullets; you're reorganizing, not deleting. Only if a single already-atomic bullet is genuinely just wordy (no distinct sub-achievements to split out) should you trim filler words instead.
- To output a multi-bullet split, make "suggestion" a string with each bullet on its own line, prefixed with "• " (e.g. "• First achievement...\n• Second achievement..."). Use this multi-line format whenever you're splitting a "too long" bullet; otherwise "suggestion" is a single line with no "• " prefix.

WEAK BULLETS FLAGGED (rewrite these, in order of severity):
${weakBulletsBlock}

Respond ONLY with a valid JSON object — no markdown, no code fences, no extra text.

REQUIRED JSON STRUCTURE:
{
  "score": <integer 0-100>,
  "category_scores": {
    "impact": <integer 0-100>,
    "brevity": <integer 0-100>,
    "style": <integer 0-100>,
    "structure": <integer 0-100>
  },
  "keywords": {
    "found": ["<keyword>", ...],
    "missing": ["<keyword>", ...]
  },
  "feedback": ["<actionable feedback string>", ...],
  "red_flags": ["<issue string>", ...],
  "summary": "<1-2 sentence analysis summary>",
  "suggested_edits": [
    { "location": "<e.g. 'Experience — Software Engineer, Acme Corp, bullet 2'>", "original": "<the exact flagged bullet text, verbatim>", "suggestion": "<the rewritten bullet, ready to paste in — OR, when splitting a too-long bullet, multiple lines each prefixed with '• '>", "reason": "<why this rewrite is stronger>" }
  ]
}

SCORE CALIBRATION — apply this, don't invent your own scale:
- 90-100: exceptional, top-tier resume for its level — rare.
- 75-89: strong resume with real, substantial, relevant experience/projects — most solid candidates with genuine hands-on work land here, even with room to tighten writing/formatting.
- 55-74: decent foundation but with real gaps (thin experience, generic descriptions, weak structure).
- Below 55: reserve for resumes with serious structural or content problems (missing sections, no real evidence of relevant work, unreadable).
- Weigh actual technical/professional substance heaviest. Formatting polish (bullet structure, quantified metrics) matters and should show up in "feedback" and pull category scores like impact/brevity down somewhat — but should not by itself drag a resume with genuinely strong, relevant work down into "weak" territory.

RULES:
- All scores MUST be integers, not decimals.
- "summary" MUST be a non-empty string.
- "feedback" MUST have at least 2 items.
- "red_flags" can be an empty array [].
- "suggested_edits": one entry per flagged weak bullet above (skip only if none were flagged), each tied to a real "original" bullet — never invent a bullet that isn't in the resume data.
- Do NOT shorten a bullet unless "too long" is one of its listed issues, and even then prefer splitting into multiple "• " bullets over shrinking the content. Preserve original length/detail and every concrete detail — fix only the specific listed issue(s).
- Output ONLY the JSON object. Nothing else.
${jobDescription ? "Also compare relevance to the JOB DESCRIPTION provided." : ""}

RESUME DATA:
${JSON.stringify(optimizedResume, null, 2)}
${jobDescription ? `\nJOB DESCRIPTION:\n${jobDescription.slice(0, 1500)}` : ""}`;

        const groq = createGroq({ apiKey });

        const { text } = await generateText({
            model: groq("llama-3.3-70b-versatile"),
            prompt,
            temperature: 0.2,
        });

        // Strip any accidental markdown code fences
        const cleaned = text
            .trim()
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();

        let parsed: any;
        try {
            parsed = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error("JSON parse failed. Raw response:", text);
            throw new Error("Model returned invalid JSON. Please try again.");
        }

        // Light normalization — ensure required fields have correct types
        const result = {
            score: Math.round(Number(parsed.score ?? 0)),
            category_scores: {
                impact: Math.round(Number(parsed.category_scores?.impact ?? 0)),
                brevity: Math.round(Number(parsed.category_scores?.brevity ?? 0)),
                style: Math.round(Number(parsed.category_scores?.style ?? 0)),
                structure: Math.round(Number(parsed.category_scores?.structure ?? 0)),
            },
            keywords: {
                found: Array.isArray(parsed.keywords?.found) ? parsed.keywords.found : [],
                missing: Array.isArray(parsed.keywords?.missing) ? parsed.keywords.missing : [],
            },
            feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
            red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
            summary: parsed.summary ?? "",
            suggested_edits: Array.isArray(parsed.suggested_edits)
                ? parsed.suggested_edits.map((e: any) => {
                    const original = typeof e?.original === 'string' ? e.original : '';
                    // Match the model's echoed "original" back to the real flagged
                    // bullet so the client can splice a rewrite into the actual
                    // resume data (entryId/raw), not just display advice text.
                    const norm = (s: string) => s.trim().toLowerCase();
                    const source = weakBullets.find(b => norm(b.text) === norm(original))
                        || weakBullets.find(b => original && (norm(b.text).includes(norm(original)) || norm(original).includes(norm(b.text))));
                    return {
                        location: typeof e?.location === 'string' && e.location
                            ? e.location
                            : (source ? `${source.section} — ${source.entryLabel}, bullet ${source.index}` : (typeof e?.section === 'string' ? e.section : '')),
                        original,
                        suggestion: typeof e?.suggestion === 'string' ? e.suggestion : '',
                        reason: typeof e?.reason === 'string' ? e.reason : '',
                        entryType: source?.entryType,
                        entryId: source?.entryId,
                        customSectionId: source?.customSectionId,
                        raw: source?.raw,
                    };
                }).filter((e: any) => e.suggestion)
                : [],
        };

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("ATS Analysis failed:", error);

        return NextResponse.json(
            {
                error: error.message || "Analysis failed",
                details: "AI Service error. Check API configuration or logs.",
            },
            { status: 500 }
        );
    }
}
