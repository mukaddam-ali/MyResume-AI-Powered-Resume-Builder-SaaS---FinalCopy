import type { z } from "zod";

/**
 * Strip stray markdown fences -> JSON.parse -> regex-extract the first
 * {...} block as a fallback -> zod-validate/coerce. Mirrors the proven
 * pattern already used in app/api/ai/parse-resume/route.ts and
 * app/api/ai/analyze.ts, written once for the pipeline's structured stages.
 * Throws if no JSON object can be recovered at all.
 */
export function safeParseJson<T>(text: string, schema: z.ZodType<T>): T {
    const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    let raw: unknown;
    try {
        raw = JSON.parse(clean);
    } catch {
        const match = clean.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Model returned no parseable JSON.");
        raw = JSON.parse(match[0]);
    }

    // Every field in these schemas has a .catch() fallback, so parse() only
    // throws when `raw` isn't even the right top-level shape (e.g. not an
    // object) — a real failure worth surfacing to the retry logic.
    return schema.parse(raw);
}
