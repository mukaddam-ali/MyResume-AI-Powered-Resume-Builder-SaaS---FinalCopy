import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
    const limit = rateLimit(`ai-metrics:${getClientIp(req)}`, 10, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    try {
        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: "AI service not configured." },
                { status: 500 }
            );
        }

        const { description, answers, phase } = await req.json();

        if (!description) {
            return NextResponse.json({ error: "Description is required." }, { status: 400 });
        }

        const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

        if (phase === "questions") {
            // Phase 1: Analyze description and return 2-3 contextual questions to gather metrics
            const prompt = `You are an expert resume coach. A user has written the following work experience description:

---
${description}
---

Your job is to identify 2-3 specific places where the candidate is missing quantifiable metrics or impact numbers.
For each missing metric, generate a SHORT, direct question to ask the user.

IMPORTANT: Respond ONLY with a valid JSON array of question objects. No markdown. No extra text. Example:
[
  { "id": "q1", "question": "How many team members did you manage or collaborate with?", "hint": "e.g. 5, 10, a team of 3" },
  { "id": "q2", "question": "By what percentage did your work improve performance or efficiency?", "hint": "e.g. 30%, 2x faster, reduced by half" }
]

Keep questions concise and specific to the provided description. Max 3 questions.`;

            const { text } = await generateText({
                model: groq("llama-3.3-70b-versatile"),
                prompt,
                temperature: 0.3,
            });

            const cleaned = text.trim()
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/```\s*$/i, "")
                .trim();

            let questions: any[];
            try {
                questions = JSON.parse(cleaned);
            } catch {
                // Fallback: return generic questions
                questions = [
                    { id: "q1", question: "How many users, customers, or team members were impacted?", hint: "e.g. 500 users, 5 team members" },
                    { id: "q2", question: "By what percentage did this improve performance, efficiency, or results?", hint: "e.g. 40%, 2x faster" },
                ];
            }

            return NextResponse.json({ questions });

        } else if (phase === "rewrite") {
            // Phase 2: Use user answers to rewrite the description with metrics
            if (!answers || Object.keys(answers).length === 0) {
                return NextResponse.json({ error: "Answers are required for rewrite phase." }, { status: 400 });
            }

            const answersText = Object.entries(answers)
                .map(([q, a]) => `• ${q}: ${a}`)
                .join("\n");

            const prompt = `You are an expert resume coach. Rewrite the following work experience description to be more impactful and metrics-driven, using the context provided by the user.

ORIGINAL DESCRIPTION:
---
${description}
---

USER-PROVIDED CONTEXT AND METRICS:
${answersText}

RULES:
- Keep each bullet point on its own line, starting with "• "
- Use strong action verbs (Spearheaded, Engineered, Optimized, Reduced, Increased, etc.)
- Integrate the user's numbers naturally into the bullet points
- Keep it professional and concise — 3-4 bullets max
- Do NOT add placeholder text like [X%] — use actual numbers from user's answers
- Do NOT include any intro or outro text, ONLY bullet points

OUTPUT ONLY THE BULLET POINTS:`;

            const { text } = await generateText({
                model: groq("llama-3.3-70b-versatile"),
                prompt,
                temperature: 0.4,
            });

            return NextResponse.json({ upgraded: text.trim() });
        } else {
            return NextResponse.json({ error: "Invalid phase. Must be 'questions' or 'rewrite'." }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Metrics upgrade error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upgrade metrics." },
            { status: 500 }
        );
    }
}
