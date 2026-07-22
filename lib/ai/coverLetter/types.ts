/**
 * Shared types for the 4-stage cover letter pipeline (Analyze -> Outline ->
 * Draft -> Critique). Zod schemas here validate/coerce already-JSON.parse'd
 * model output (see parseStageOutput.ts) — they are never passed to
 * generateObject/tool-calling mode, matching how the rest of this codebase
 * talks to Groq (see app/api/ai/analyze.ts, app/api/ai/parse-resume/route.ts).
 */
import { z } from "zod";

export type Tone = "professional" | "enthusiastic" | "concise";

export interface CondensedResume {
    name: string;
    jobTitle: string;
    summary: string;
    skills: string[];
    experience: { role: string; company: string; highlights: string }[];
    projects: { name: string; description: string; technologies: string }[];
    education: { degree: string; school: string }[];
}

// ── Stage A: Analyze ────────────────────────────────────────────────────────

const evidenceItemSchema = z.object({
    source: z.enum(["experience", "project", "skill", "education"]).catch("experience"),
    label: z.string().catch(""),
    detail: z.string().catch(""),
    relevance: z.enum(["high", "medium"]).catch("medium"),
});

export const coverLetterAnalysisSchema = z.object({
    matchScore: z.number().int().min(0).max(100).catch(50),
    matchSummary: z.string().catch(""),
    jdKeywords: z.array(z.string()).catch([]),
    jdRequirements: z.array(z.string()).catch([]),
    companyValues: z.array(z.string()).catch([]),
    inferredIndustry: z.string().catch(""),
    matchingEvidence: z.array(evidenceItemSchema).catch([]),
    transferableSkills: z.array(z.string()).catch([]),
    gaps: z.array(z.string()).catch([]),
});
export type CoverLetterAnalysis = z.infer<typeof coverLetterAnalysisSchema>;

// ── Stage B: Outline ────────────────────────────────────────────────────────

const outlineParagraphSchema = z.object({
    purpose: z.string().catch(""),
    evidenceRefs: z.array(z.string()).catch([]),
    angle: z.string().catch(""),
});

export const coverLetterOutlineSchema = z.object({
    openingHook: z.string().catch(""),
    paragraphs: z.array(outlineParagraphSchema).catch([]),
    closingAngle: z.string().catch(""),
    keywordsToWeaveIn: z.array(z.string()).catch([]),
});
export type CoverLetterOutline = z.infer<typeof coverLetterOutlineSchema>;

// ── Stage D: Critique & revise ──────────────────────────────────────────────

const scoreField = z.number().int().min(1).max(10).catch(6);

export const coverLetterScoresSchema = z.object({
    personalization: scoreField,
    recruiterAppeal: scoreField,
    clarity: scoreField,
    atsOptimization: scoreField,
    flow: scoreField,
    evidenceUse: scoreField,
    tone: scoreField,
    originality: scoreField,
    factualAccuracy: scoreField,
    readability: scoreField,
});
export type CoverLetterScores = z.infer<typeof coverLetterScoresSchema>;

export const coverLetterCritiqueSchema = z.object({
    scores: coverLetterScoresSchema,
    revisedLetter: z.string().catch(""),
    changesSummary: z.array(z.string()).catch([]),
});
export type CoverLetterCritique = z.infer<typeof coverLetterCritiqueSchema>;

// ── NDJSON stream protocol ──────────────────────────────────────────────────

export type CoverLetterStageName = "analyze" | "outline" | "draft" | "critique";

export interface CoverLetterResultMeta {
    tone: Tone;
    company: string;
    styleDirective: string;
    scores: CoverLetterScores | null;
    stageDFailed: boolean;
    durationMs: number;
}

export type CoverLetterStreamEvent =
    | { type: "stage"; stage: CoverLetterStageName; label: string }
    | { type: "result"; coverLetter: string; meta: CoverLetterResultMeta }
    | { type: "error"; message: string };
