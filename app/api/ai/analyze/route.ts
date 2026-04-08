import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

const analysisSchema = z.object({
    score: z.number(),
    category_scores: z.object({
        impact: z.number(),
        brevity: z.number(),
        style: z.number(),
        structure: z.number(),
    }),
    keywords: z.object({
        found: z.array(z.string()),
        missing: z.array(z.string()),
    }),
    feedback: z.array(z.string()),
    red_flags: z.array(z.string()),
    summary: z.string(),
    suggested_edits: z.array(
        z.object({
            section: z.string(),
            suggestion: z.string(),
            reason: z.string(),
        })
    ),
});

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
            highlights: exp.description?.substring(0, 300) // Truncate
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

        console.log("✅ Using Groq API via Vercel AI SDK");

        const { resumeData, jobDescription } = await req.json();

        // Optimize payload
        const optimizedResume = optimizeResumeData(resumeData);

        const prompt = `
        Act as a strict, professional Applicant Tracking System (ATS) and expert Resume Coach.
        1. Analyze the RESUME SUMMARY below.
        2. Check for impact, clarity, keywords, and red flags.
        ${jobDescription ? '3. Compare relevance to the JOB DESCRIPTION.' : ''}
        4. Provide specific, actionable SUGGESTED EDITS for key sections (Summary, Experience, etc.) to improve the ATS score.

        IMPORTANT SCORING RULE:
        - The 'score' MUST be an integer between 0 and 100.
        - Do NOT return a decimal (e.g., 0.85). Return 85.
        - All 'category_scores' (impact, brevity, style, structure) MUST also be between 0 and 100.

        RESUME SUMMARY:
        ${JSON.stringify(optimizedResume, null, 2)}

        ${jobDescription ? `JOB DESCRIPTION (Analyze against this):\n${jobDescription.slice(0, 1500)}` : ''}
        `;

        const groq = createGroq({ apiKey });

        try {
            const { object } = await generateObject({
                model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
                schema: analysisSchema,
                prompt: prompt,
                temperature: 0.3,
            });

            return NextResponse.json(object);
        } catch (apiError: any) {
            console.error("Groq API Call Failed:", apiError);
            throw apiError; // Re-throw to be caught by outer catch
        }

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
