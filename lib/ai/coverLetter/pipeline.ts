import { sampleStyleDirective } from "./styleBank";
import { callGroqStage, runStageWithRetry } from "./runStage";
import { safeParseJson } from "./parseStageOutput";
import { buildAnalyzePrompt, buildOutlinePrompt, buildDraftPrompt, buildCritiquePrompt } from "./prompts";
import {
    coverLetterAnalysisSchema,
    coverLetterOutlineSchema,
    coverLetterCritiqueSchema,
    CondensedResume,
    Tone,
    CoverLetterStreamEvent,
    CoverLetterResultMeta,
} from "./types";

export interface CoverLetterPipelineInput {
    condensed: CondensedResume;
    jobDescription: string;
    company: string;
    tone: Tone;
    emit: (event: CoverLetterStreamEvent) => void;
}

export interface CoverLetterPipelineResult {
    coverLetter: string;
    meta: CoverLetterResultMeta;
}

// Total wall-clock budget for the whole pipeline, kept comfortably under the
// route's `maxDuration` (90s) so a slow stage can never blow past the
// serverless function's own hard timeout.
const PIPELINE_BUDGET_MS = 70_000;

const STAGE_TIMEOUTS = {
    analyze: 12_000,
    outline: 10_000,
    draft: 20_000,
    critique: 12_000,
};

/**
 * Orchestrates Analyze -> Outline -> Draft -> Critique on Groq. Transport-
 * agnostic: takes a plain `emit` callback for progress rather than knowing
 * anything about HTTP/NDJSON, so the route handler stays a thin adapter.
 *
 * Analyze/Outline/Draft failing after their retry is fatal (nothing usable
 * exists without them) and the error propagates to the caller. Critique
 * failing after its retry is NOT fatal — the pipeline falls back to the
 * Draft-stage text so a transient issue in the polish step doesn't waste the
 * whole generation.
 */
export async function runCoverLetterPipeline(
    input: CoverLetterPipelineInput
): Promise<CoverLetterPipelineResult> {
    const { condensed, jobDescription, company, tone, emit } = input;
    const start = Date.now();
    const deadline = start + PIPELINE_BUDGET_MS;
    const styleDirective = sampleStyleDirective();

    emit({ type: "stage", stage: "analyze", label: "Analyzing the job description and your resume..." });
    const analysis = await runStageWithRetry("analyze", deadline, async () => {
        const { system, prompt } = buildAnalyzePrompt(condensed, jobDescription, company, tone);
        const text = await callGroqStage({
            system,
            prompt,
            temperature: 0.3,
            maxTokens: 1400,
            timeoutMs: STAGE_TIMEOUTS.analyze,
            deadline,
        });
        return safeParseJson(text, coverLetterAnalysisSchema);
    });

    emit({ type: "stage", stage: "outline", label: "Planning your letter's narrative..." });
    const outline = await runStageWithRetry("outline", deadline, async () => {
        const { system, prompt } = buildOutlinePrompt(analysis, condensed, styleDirective, tone, company);
        const text = await callGroqStage({
            system,
            prompt,
            temperature: 0.5,
            maxTokens: 900,
            timeoutMs: STAGE_TIMEOUTS.outline,
            deadline,
        });
        return safeParseJson(text, coverLetterOutlineSchema);
    });

    emit({ type: "stage", stage: "draft", label: "Writing your draft..." });
    const draft = await runStageWithRetry("draft", deadline, async () => {
        const { system, prompt } = buildDraftPrompt(outline, analysis, condensed, styleDirective, tone, company);
        const text = await callGroqStage({
            system,
            prompt,
            temperature: 0.75,
            maxTokens: 900,
            timeoutMs: STAGE_TIMEOUTS.draft,
            deadline,
        });
        const trimmed = text.trim();
        if (trimmed.length < 100) throw new Error("Draft came back too short.");
        return trimmed;
    });

    emit({ type: "stage", stage: "critique", label: "Polishing and fact-checking..." });
    let finalLetter = draft;
    let scores: CoverLetterResultMeta["scores"] = null;
    let stageDFailed = false;
    try {
        const critique = await runStageWithRetry("critique", deadline, async () => {
            const { system, prompt } = buildCritiquePrompt(draft, analysis, outline, condensed, jobDescription, tone);
            const text = await callGroqStage({
                system,
                prompt,
                temperature: 0.4,
                maxTokens: 1400,
                timeoutMs: STAGE_TIMEOUTS.critique,
                deadline,
            });
            return safeParseJson(text, coverLetterCritiqueSchema);
        });
        if (critique.revisedLetter.trim().length >= 100) {
            finalLetter = critique.revisedLetter.trim();
        }
        scores = critique.scores;
    } catch (err) {
        console.warn(
            "[cover-letter] critique stage failed after retry, falling back to draft:",
            err instanceof Error ? err.message : err
        );
        stageDFailed = true;
    }

    return {
        coverLetter: finalLetter,
        meta: { tone, company, styleDirective, scores, stageDFailed, durationMs: Date.now() - start },
    };
}
