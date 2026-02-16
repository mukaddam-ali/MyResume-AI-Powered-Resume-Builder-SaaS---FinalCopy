import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

// Define schema (Preserved from original to ensure frontend compatibility)
const analysisSchema = z.object({
    score: z.number().min(0).max(100),
    category_scores: z.object({
        impact: z.number().min(0).max(100),
        brevity: z.number().min(0).max(100),
        style: z.number().min(0).max(100),
        structure: z.number().min(0).max(100),
    }),
    keywords: z.object({
        found: z.array(z.string()),
        missing: z.array(z.string()),
    }),
    feedback: z.array(z.string()),
    red_flags: z.array(z.string()),
    summary: z.string(),
});

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
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
        // Validate API key exists first
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.error("❌ GROQ_API_KEY is not set in environment variables");
            console.error("Environment check:", {
                hasGroqKey: !!apiKey,
                nodeEnv: process.env.NODE_ENV,
                timestamp: new Date().toISOString()
            });

            return NextResponse.json(
                {
                    error: "Invalid API Key",
                    details: "GROQ_API_KEY environment variable is not loaded. This may be due to browser cache or server state issues.",
                    solution: "Try: 1) Restart your dev server 2) Clear browser cache 3) Hard refresh (Ctrl+Shift+R)",
                    debug: {
                        hasApiKey: false,
                        nodeEnv: process.env.NODE_ENV
                    }
                },
                { status: 500 }
            );
        }

        console.log("✅ GROQ_API_KEY is configured");

        const { resumeData, jobDescription } = await req.json();

        // Optimize payload
        const optimizedResume = optimizeResumeData(resumeData);

        const prompt = `
        Act as a strict, professional Applicant Tracking System (ATS) and expert Resume Coach.
        1. Analyze the RESUME SUMMARY below.
        2. Check for impact, clarity, keywords, and red flags.
        ${jobDescription ? '3. Compare relevance to the JOB DESCRIPTION.' : ''}

        RESUME SUMMARY:
        ${JSON.stringify(optimizedResume, null, 2)}

        ${jobDescription ? `JOB DESCRIPTION (Analyze against this):\n${jobDescription.slice(0, 1500)}` : ''}

        Provide a detailed, searching analysis following the schema.
        `;

        // Groq Call (Fast & Free)
        const result = await generateObject({
            model: groq("llama-3.3-70b-versatile"), // High performance model
            schema: analysisSchema,
            prompt,
            temperature: 0.3,
        });

        return NextResponse.json(result.object);

    } catch (error: any) {
        console.error("ATS Analysis failed:", error);

        return NextResponse.json(
            {
                error: error.message || "Analysis failed",
                details: "AI Service error. Check API configuration.",
            },
            { status: 500 }
        );
    }
}
