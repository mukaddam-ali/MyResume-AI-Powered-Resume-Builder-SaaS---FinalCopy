import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

/**
 * Optimize resume data to reduce token usage
 */
function optimizeResumeData(data: any) {
    return {
        summary: data.personalInfo?.summary,
        jobTitle: data.personalInfo?.jobTitle,
        skills: Array.isArray(data.skills) ? data.skills.slice(0, 30) : [],
        experience: data.experience?.map((exp: any) => ({
            role: exp.title,
            company: exp.company,
            highlights: exp.description?.substring(0, 300)
        })).slice(0, 5),
        education: data.education?.map((edu: any) => ({
            degree: edu.degree,
            field: edu.field,
            school: edu.school
        })).slice(0, 2)
    };
}

export async function POST(req: Request) {
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

        console.log("✅ Using Groq API (generateText + JSON parse)");

        const { resumeData, jobDescription } = await req.json();

        const optimizedResume = optimizeResumeData(resumeData);

        const prompt = `You are a strict ATS (Applicant Tracking System) and expert Resume Coach.
Analyze the resume data below and respond ONLY with a valid JSON object — no markdown, no code fences, no extra text.

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
    { "section": "<section name>", "suggestion": "<what to change>", "reason": "<why>" }
  ]
}

RULES:
- All scores MUST be integers, not decimals.
- "summary" MUST be a non-empty string.
- "feedback" MUST have at least 2 items.
- "red_flags" can be an empty array [].
- "suggested_edits" is optional, include 2-3 max if relevant.
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
            suggested_edits: Array.isArray(parsed.suggested_edits) ? parsed.suggested_edits : [],
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
