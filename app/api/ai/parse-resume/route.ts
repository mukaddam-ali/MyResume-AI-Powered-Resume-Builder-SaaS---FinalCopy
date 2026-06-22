import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { createRequire } from "module";

// Give this route up to 120 seconds (Next.js default is 60s)
export const maxDuration = 120;

// ─── Manual multipart/form-data parser ───────────────────────────────────────
// req.formData() is broken in Next.js 16 + React 19 for multipart uploads.

interface ParsedFile {
    filename: string;
    contentType: string;
    data: Buffer;
}

function parseMultipart(body: Buffer, boundary: string): ParsedFile | null {
    const boundaryBuf = Buffer.from("--" + boundary);
    const parts: Buffer[] = [];

    let start = 0;
    while (start < body.length) {
        const idx = body.indexOf(boundaryBuf, start);
        if (idx === -1) break;
        const end = body.indexOf(boundaryBuf, idx + boundaryBuf.length);
        if (end === -1) break;
        const partStart = idx + boundaryBuf.length + 2;
        parts.push(body.slice(partStart, end - 2));
        start = end;
    }

    for (const part of parts) {
        const headerEnd = part.indexOf("\r\n\r\n");
        if (headerEnd === -1) continue;

        const headerSection = part.slice(0, headerEnd).toString("utf8");
        const fileData = part.slice(headerEnd + 4);

        const dispMatch = headerSection.match(/Content-Disposition:[^\r\n]*/i);
        const typeMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/i);
        if (!dispMatch) continue;

        const disposition = dispMatch[0];
        const nameMatch = disposition.match(/name="([^"]+)"/);
        const filenameMatch = disposition.match(/filename="([^"]+)"/);

        if (nameMatch?.[1] === "file" && filenameMatch) {
            return {
                filename: filenameMatch[1],
                contentType: typeMatch?.[1]?.trim() ?? "application/octet-stream",
                data: fileData,
            };
        }
    }
    return null;
}

// ─── PDF Text Extraction (pdf-parse — pure Node.js, no WASM) ────────────────
// pdf-parse is a pure-JS library: no WASM workers, no binary path issues,
// works reliably in any Next.js server environment.

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    // pdf-parse v1's index.js self-runs a test on require() which crashes without
    // its test data directory. We bypass it by requiring the inner lib file directly
    // via createRequire, which also prevents webpack from bundling it.
    const requireNode = createRequire(import.meta.url);
    const pdfParse = requireNode("pdf-parse/lib/pdf-parse.js") as (buf: Buffer) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    return result.text ?? "";
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return NextResponse.json({ error: "GROQ_API_KEY is not configured." }, { status: 500 });
        }

        // ── 1. Parse multipart body manually (req.formData() broken in Next 16) ──
        const contentType = req.headers.get("content-type") ?? "";
        const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
        if (!boundaryMatch) {
            return NextResponse.json(
                { error: "Invalid content type — expected multipart/form-data." },
                { status: 400 }
            );
        }
        const boundary = boundaryMatch[1].trim();

        const rawBody = await req.arrayBuffer();
        const bodyBuffer = Buffer.from(rawBody);
        const file = parseMultipart(bodyBuffer, boundary);

        if (!file) {
            return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
        }
        if (!file.contentType.includes("pdf") && !file.filename.toLowerCase().endsWith(".pdf")) {
            return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
        }
        if (file.data.length > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File exceeds 10 MB limit." }, { status: 400 });
        }

        console.log(`📄 Received: ${file.filename} (${file.data.length} bytes)`);

        // ── 2. Extract text from PDF ───────────────────────────────────────────
        let rawText = "";
        try {
            rawText = await extractTextFromPDF(file.data);
        } catch (pdfError) {
            console.error("PDF extraction error:", pdfError);
            return NextResponse.json(
                { error: "Could not read the PDF. Make sure it contains selectable text (not a scanned image)." },
                { status: 422 }
            );
        }

        if (!rawText || rawText.trim().length < 30) {
            return NextResponse.json(
                { error: "The PDF appears to be empty or is a scanned image without selectable text." },
                { status: 422 }
            );
        }

        // Trim to 8000 chars — enough for any resume, keeps the model fast
        const resumeText = rawText.trim().substring(0, 8000);
        console.log(`✅ Extracted ${rawText.length} chars, sending ${resumeText.length} to AI`);

        // ── 3. Parse with Groq (fast 8b model + 60s timeout) ──────────────────
        const groq = createGroq({ apiKey: groqKey });

        const prompt = `You are an expert resume parser. Extract ALL information from the resume text below.
Return ONLY a valid JSON object — no explanation, no markdown fences, just raw JSON.

Required JSON shape:
{
  "personalInfo": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "", "github": "", "summary": "" },
  "education": [ { "school": "", "degree": "", "startDate": "", "endDate": "", "current": false } ],
  "experience": [ { "company": "", "role": "", "startDate": "", "endDate": "", "current": false, "description": "" } ],
  "projects": [ { "name": "", "description": "", "technologies": "", "link": "" } ],
  "skills": [],
  "customSections": [ { "title": "", "items": [ { "name": "", "description": "", "date": "", "city": "" } ] } ]
}

RULES:
1. Extract EVERY piece of information — do not skip sections.
2. "experience.description": preserve bullet points as "• bullet text" lines separated by \\n.
3. "skills": flat string array — one skill per item.
4. NON-STANDARD sections (Certifications, Awards, Languages, Honors, etc.) → "customSections".
5. Missing fields → "" for strings, false for booleans, [] for arrays. NEVER null.
6. Dates: exactly as written (e.g. "Jan 2022", "Present").
7. "summary": verbatim from the resume.

RESUME TEXT:
---
${resumeText}
---`;

        // 60-second timeout on the AI call
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), 60_000);

        let text: string;
        try {
            const result = await generateText({
                model: groq("llama-3.3-70b-versatile"), // Much more reliable for JSON schema
                prompt,
                temperature: 0,
                maxTokens: 4000,
                abortSignal: abortController.signal,
            } as any);
            text = result.text;
        } catch (aiError: any) {
            if (aiError?.name === "AbortError" || aiError?.message?.includes("abort")) {
                return NextResponse.json(
                    { error: "AI took too long to respond. Please try again." },
                    { status: 504 }
                );
            }
            throw aiError;
        } finally {
            clearTimeout(timeout);
        }

        // ── 4. Parse the JSON from the AI response ────────────────────────────
        let parsed: any;
        try {
            const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
            parsed = JSON.parse(clean);
        } catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) throw new Error("AI returned no parseable JSON.");
            parsed = JSON.parse(match[0]);
        }

        const safe = {
            personalInfo:   parsed.personalInfo   ?? {},
            education:      Array.isArray(parsed.education)      ? parsed.education      : [],
            experience:     Array.isArray(parsed.experience)     ? parsed.experience     : [],
            projects:       Array.isArray(parsed.projects)       ? parsed.projects       : [],
            skills:         Array.isArray(parsed.skills)         ? parsed.skills         : [],
            customSections: Array.isArray(parsed.customSections) ? parsed.customSections : [],
        };

        return NextResponse.json({ success: true, data: safe });

    } catch (error: any) {
        console.error("Resume parse failed:", error);
        return NextResponse.json(
            { error: error?.message ?? "Failed to parse resume. Please try again." },
            { status: 500 }
        );
    }
}
