import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/ai/cover-letter
 * Generates a tailored cover letter from the resume + a job description.
 */
export async function POST(req: Request) {
    const limit = rateLimit(`ai-cover-letter:${getClientIp(req)}`, 5, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    try {
        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: "AI service is not configured." }, { status: 500 });
        }

        const { resumeData, jobDescription, company, tone } = await req.json();

        if (!resumeData || typeof resumeData !== 'object') {
            return NextResponse.json({ error: "Resume data is required." }, { status: 400 });
        }
        if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 30) {
            return NextResponse.json({ error: "Please paste the job description (at least a few sentences)." }, { status: 400 });
        }

        // Only send what the letter needs — keeps tokens low and avoids
        // leaking layout/settings into the prompt
        const condensed = {
            name: resumeData.personalInfo?.fullName,
            jobTitle: resumeData.personalInfo?.jobTitle,
            summary: resumeData.personalInfo?.summary,
            skills: Array.isArray(resumeData.skills) ? resumeData.skills.slice(0, 25) : [],
            experience: (resumeData.experience || []).slice(0, 4).map((e: any) => ({
                role: e.role,
                company: e.company,
                highlights: (e.description || '').substring(0, 400),
            })),
            education: (resumeData.education || []).slice(0, 2).map((e: any) => ({
                degree: e.degree,
                school: e.school,
            })),
        };

        const safeTone = ['professional', 'enthusiastic', 'concise'].includes(tone) ? tone : 'professional';
        const safeCompany = typeof company === 'string' ? company.slice(0, 120) : '';

        const prompt = `You are an expert career coach. Write a compelling cover letter for the candidate below, tailored to the job description.

CANDIDATE:
${JSON.stringify(condensed, null, 2)}

JOB DESCRIPTION:
---
${jobDescription.trim().slice(0, 4000)}
---
${safeCompany ? `COMPANY NAME: ${safeCompany}` : ''}

RULES:
- Tone: ${safeTone}.
- 3-4 paragraphs, 250-350 words. No address block, just start with "Dear Hiring Manager," (or the company name if provided).
- Connect the candidate's strongest, most relevant achievements to the job's requirements — use their real numbers and skills, never invent facts.
- End with a confident closing and the candidate's name.
- Output ONLY the letter text. No preamble, no markdown, no notes.`;

        const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
        const { text } = await generateText({
            model: groq("llama-3.3-70b-versatile"),
            prompt,
            temperature: 0.5,
        });

        return NextResponse.json({ coverLetter: text.trim() });
    } catch (error: any) {
        console.error("Cover letter generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate the cover letter. Please try again." },
            { status: 500 }
        );
    }
}
