import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
    const limit = rateLimit(`ai-generate:${getClientIp(req)}`, 10, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    try {
        const { type, title, context } = await req.json();

        if (typeof title !== 'string' || title.length > 300 || (context && (typeof context !== 'string' || context.length > 2000))) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: "AI service is not configured. The GROQ_API_KEY environment variable is missing. Please add it to your Vercel project settings under Settings → Environment Variables." },
                { status: 500 }
            );
        }

        let prompt = "";

        if (type === 'experience') {
            prompt = `
                Act as a professional resume writer. Write 3 strong, action-oriented bullet points for a resume experience section.
                Role: ${title}
                Company/Context: ${context}
                
                Requirements:
                - Use strong action verbs (e.g., Spearheaded, Developed, Optimized).
                - Include placeholders for metrics where appropriate (e.g., "increased efficiency by X%").
                - Keep it concise and professional.
                - Do NOT include any introductory or concluding text, just the bullet points.
                - Format each bullet point on a new line starting with "• ".
            `;
        } else if (type === 'project') {
            prompt = `
                Act as a professional resume writer. Write 3 strong, action-oriented bullet points for a resume project section.
                Project Name: ${title}
                Technologies/Context: ${context}
                
                Requirements:
                - Highlight the complexity and impact of the project.
                - Mention the technologies used if provided.
                - Keep it concise.
                - Do NOT include any introductory or concluding text, just the bullet points.
                - Format each bullet point on a new line starting with "• ".
            `;
        } else {
            return NextResponse.json({ error: "Invalid generation type" }, { status: 400 });
        }

        const groq = createGroq({
            apiKey: process.env.GROQ_API_KEY
        });

        const { text } = await generateText({
            model: groq("llama-3.3-70b-versatile"),
            prompt: prompt,
        });

        return NextResponse.json({ content: text });

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return NextResponse.json(
            {
                error: error.message || "Failed to generate content. Please try again.",
                details: error.toString()
            },
            { status: 500 }
        );
    }
}
